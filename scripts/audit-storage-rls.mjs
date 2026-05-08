#!/usr/bin/env node
/**
 * Automated RLS audit for one or more Supabase Storage buckets.
 *
 * For each configured bucket, verifies — using ONLY the public (anon) key,
 * no service-role secret — that:
 *   1. Bucket is reachable; if `public`, served public URLs return 200
 *   2. Anonymous list behaves per visibility (public→ok, private→denied)
 *   3. Anonymous upload is rejected (RLS must block it)
 *   4. Authenticated admin can upload / read / delete
 *
 * Configure buckets (in priority order):
 *   • CLI:  --bucket=media:public --bucket=attachments:private
 *   • Env:  BUCKETS="media:public,avatars:public,attachments:private"
 *   • Default: media:public
 *
 * Visibility tag is `public` (default) or `private`.
 *
 * Admin credentials (optional, enables step 4):
 *   ADMIN_EMAIL=… ADMIN_PASSWORD=…
 *
 * Exits 0 only when every bucket passes every applicable check.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";

if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)="?([^"\n]*)"?$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const ANON =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY;
if (!URL || !ANON) {
  console.error("✗ Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY");
  process.exit(1);
}

// ---- bucket config --------------------------------------------------------
function parseSpec(s) {
  const [name, vis = "public"] = s.split(":").map((x) => x.trim());
  if (!name) return null;
  if (vis !== "public" && vis !== "private") {
    console.error(`✗ Invalid visibility "${vis}" for "${name}" — use public|private`);
    process.exit(1);
  }
  return { name, visibility: vis };
}

const cliSpecs = process.argv
  .slice(2)
  .filter((a) => a.startsWith("--bucket="))
  .map((a) => a.slice("--bucket=".length));
const envSpecs = (process.env.BUCKETS || "").split(",").map((s) => s.trim()).filter(Boolean);
const specs = (cliSpecs.length ? cliSpecs : envSpecs.length ? envSpecs : ["media:public"])
  .map(parseSpec)
  .filter(Boolean);

const stamp = Date.now();
const anon = createClient(URL, ANON, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let adminClient = null;
const adminEmail = process.env.ADMIN_EMAIL;
const adminPass = process.env.ADMIN_PASSWORD;
if (adminEmail && adminPass) {
  adminClient = createClient(URL, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await adminClient.auth.signInWithPassword({
    email: adminEmail, password: adminPass,
  });
  if (error) {
    console.error(`✗ admin sign-in failed: ${error.message}`);
    adminClient = null;
  }
}

// ---- per-bucket runner ----------------------------------------------------
async function auditBucket({ name, visibility }) {
  const r = { name, visibility, pass: 0, fail: 0 };
  const ok = (m, x = "") => { r.pass++; console.log(`  ✓ ${m}${x ? "  " + x : ""}`); };
  const ko = (m, e) => { r.fail++; console.log(`  ✗ ${m}\n      ${e?.message || e}`); };

  console.log(`\n── bucket: ${name}  (${visibility}) ─────────────────────────`);

  // 1. reachability + public-URL fetch (only meaningful for public buckets)
  console.log("1. Reachability");
  const roots = await anon.storage.from(name).list("", { limit: 20 });
  if (visibility === "public") {
    if (roots.error) ko("anon list root", roots.error);
    else {
      ok("anon list root", `(${roots.data?.length ?? 0} entries)`);
      // probe a real file (descend one folder if needed)
      let probed = null;
      outer: for (const entry of roots.data ?? []) {
        if (!entry.name) continue;
        if (entry.metadata) { probed = entry.name; break; }
        const sub = await anon.storage.from(name).list(entry.name, { limit: 20 });
        for (const f of sub.data ?? []) {
          if (f.name && f.metadata) { probed = `${entry.name}/${f.name}`; break outer; }
        }
      }
      if (!probed) {
        ok("public-URL probe skipped (bucket empty)");
      } else {
        const { data: pub } = anon.storage.from(name).getPublicUrl(probed);
        const res = await fetch(pub.publicUrl);
        res.ok ? ok("public URL fetch", `${probed} (${res.status})`)
               : ko("public URL fetch", `status ${res.status} — bucket may not actually be public`);
      }
    }
  } else {
    if (!roots.error) ko("anon list on private bucket succeeded", "RLS too permissive");
    else ok("anon list correctly denied", `(${roots.error.message})`);
  }

  // 2. anon upload must always be rejected
  console.log("2. Anon upload must be rejected");
  {
    const path = `audit/anon-${stamp}.txt`;
    const body = new Blob([`anon ${stamp}`], { type: "text/plain" });
    const up = await anon.storage.from(name).upload(path, body, { upsert: false });
    if (!up.error) ko("anon upload accepted", "RLS misconfigured");
    else ok("anon upload rejected", `(${up.error.message})`);
  }

  // 3. admin upload / read / delete
  console.log("3. Admin upload / read / delete");
  if (!adminClient) {
    console.log("  · skipped (set ADMIN_EMAIL + ADMIN_PASSWORD)");
  } else {
    const path = `audit/admin-${stamp}.txt`;
    const body = new Blob([`admin ${stamp}`], { type: "text/plain" });
    const up = await adminClient.storage.from(name).upload(path, body, { upsert: true });
    if (up.error) ko("admin upload", up.error);
    else {
      const { data: pub } = adminClient.storage.from(name).getPublicUrl(path);
      ok("admin upload", pub.publicUrl);

      if (visibility === "public") {
        const res = await fetch(pub.publicUrl);
        res.ok ? ok("public HTTP GET on uploaded object", `(${res.status})`)
               : ko("public HTTP GET", `status ${res.status}`);
      } else {
        const res = await fetch(pub.publicUrl);
        res.ok ? ko("public HTTP GET on private bucket succeeded", "should be 400/403")
               : ok("public HTTP GET correctly denied", `(${res.status})`);
        const dl = await adminClient.storage.from(name).download(path);
        dl.error ? ko("admin signed download", dl.error) : ok("admin signed download");
      }

      const del = await adminClient.storage.from(name).remove([path]);
      del.error ? ko("admin delete", del.error) : ok("admin delete");
    }
  }

  return r;
}

console.log(`\nStorage RLS audit — ${URL}`);
console.log(`Buckets: ${specs.map((s) => `${s.name}(${s.visibility})`).join(", ")}`);
console.log(`Admin checks: ${adminClient ? "enabled" : "skipped (no ADMIN_* env)"}`);

const results = [];
for (const spec of specs) results.push(await auditBucket(spec));

console.log("\n────────── summary ──────────");
let totalPass = 0, totalFail = 0;
for (const r of results) {
  totalPass += r.pass; totalFail += r.fail;
  const status = r.fail === 0 ? "✓" : "✗";
  console.log(`  ${status} ${r.name.padEnd(20)} ${r.pass} pass / ${r.fail} fail`);
}
console.log(`\nTotal: ${totalPass} passed, ${totalFail} failed across ${results.length} bucket(s).`);
process.exit(totalFail === 0 ? 0 : 1);
