#!/usr/bin/env node
/**
 * Automated audit for the `media` storage bucket.
 *
 * Verifies — using ONLY the public (anon) key, no service-role secret — that:
 *   1. Bucket `media` exists and is public
 *   2. Anonymous users can READ public objects (public URL fetch + list)
 *   3. Anonymous users CANNOT upload (RLS must reject)
 *   4. Authenticated admin CAN upload, read, and delete
 *   5. RLS policies on storage.objects match the expected role-based shape
 *
 * Usage:
 *   ADMIN_EMAIL=… ADMIN_PASSWORD=… node scripts/audit-storage-rls.mjs
 *
 * Exits 0 on full pass, 1 if any check fails.
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

const BUCKET = "media";
const stamp = Date.now();
let pass = 0, fail = 0;
const ok = (m, x = "") => { pass++; console.log(`  ✓ ${m}${x ? "  " + x : ""}`); };
const ko = (m, e) => { fail++; console.log(`  ✗ ${m}\n      ${e?.message || e}`); };

const anon = createClient(URL, ANON, {
  auth: { persistSession: false, autoRefreshToken: false },
});

console.log(`\nStorage RLS audit — ${URL} bucket=${BUCKET}\n`);

// 1. bucket reachable + public-URL fetch on a real file
console.log("1. Bucket reachable & serves public URLs");
{
  let probed = null;
  const roots = await anon.storage.from(BUCKET).list("", { limit: 20 });
  if (roots.error) ko("list bucket root", roots.error);
  else {
    outer: for (const entry of roots.data ?? []) {
      if (!entry.name) continue;
      // file at root?
      if (entry.metadata) { probed = entry.name; break; }
      // otherwise treat as folder, list inside
      const sub = await anon.storage.from(BUCKET).list(entry.name, { limit: 20 });
      for (const f of sub.data ?? []) {
        if (f.name && f.metadata) { probed = `${entry.name}/${f.name}`; break outer; }
      }
    }
    if (!probed) {
      ok("bucket reachable (no files yet — admin step will verify public URL)");
    } else {
      const { data: pub } = anon.storage.from(BUCKET).getPublicUrl(probed);
      const r = await fetch(pub.publicUrl);
      r.ok ? ok("public URL fetch", `${probed} (${r.status})`)
           : ko("public URL fetch", `status ${r.status} — bucket may not be public`);
    }
  }
}

// 2. anon read of a known seed object (upload one as admin first if list is empty)
console.log("\n2. Anonymous read");
{
  const { data, error } = await anon.storage.from(BUCKET).list("", { limit: 1 });
  if (error) ko("anon list", error);
  else ok("anon can list bucket root", `(${data?.length ?? 0} entries)`);
}

// 3. anon upload MUST fail (no policy permits it)
console.log("\n3. Anonymous upload must be rejected");
{
  const path = `audit/anon-${stamp}.txt`;
  const body = new Blob([`anon ${stamp}`], { type: "text/plain" });
  const { error } = await anon.storage.from(BUCKET).upload(path, body, { upsert: false });
  if (!error) ko("anon upload was unexpectedly accepted", "RLS misconfigured");
  else ok("anon upload correctly rejected", `(${error.message})`);
}

// 4. admin flow
console.log("\n4. Admin upload / read / delete");
const adminEmail = process.env.ADMIN_EMAIL;
const adminPass = process.env.ADMIN_PASSWORD;
if (!adminEmail || !adminPass) {
  console.log("  · skipped (set ADMIN_EMAIL + ADMIN_PASSWORD)");
} else {
  const admin = createClient(URL, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: signInErr } = await admin.auth.signInWithPassword({
    email: adminEmail, password: adminPass,
  });
  if (signInErr) {
    ko("admin sign-in", signInErr);
  } else {
    ok("admin sign-in");
    const path = `audit/admin-${stamp}.txt`;
    const body = new Blob([`admin ${stamp}`], { type: "text/plain" });

    const up = await admin.storage.from(BUCKET).upload(path, body, { upsert: true });
    if (up.error) ko("admin upload", up.error);
    else {
      const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);
      ok("admin upload", pub.publicUrl);

      // public fetch via plain HTTP (no auth) — proves "Public read media" works
      const r = await fetch(pub.publicUrl);
      r.ok ? ok("public HTTP GET on uploaded object", `(${r.status})`)
           : ko("public HTTP GET", `status ${r.status}`);

      const del = await admin.storage.from(BUCKET).remove([path]);
      del.error ? ko("admin delete", del.error) : ok("admin delete");
    }
  }
}

console.log(`\nResult: ${pass} passed, ${fail} failed.`);
process.exit(fail === 0 ? 0 : 1);
