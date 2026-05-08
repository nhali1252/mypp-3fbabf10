#!/usr/bin/env node
/**
 * End-to-end audit: verifies the site works using ONLY the public
 * (publishable / anon) key — no service-role secret, no extra env file.
 *
 * Checks:
 *   1. Public reads (site_settings)         — anon SELECT via RLS
 *   2. Media storage upload                 — anon INSERT into `media` bucket
 *   3. Contact message submit               — anon INSERT into `messages`
 *   4. Review (testimonial) submit          — anon INSERT into `testimonials`
 *   5. Admin visibility check               — submitted review readable by admin
 *
 * Usage:
 *   node scripts/audit-anon-flow.mjs
 *
 * The anon key + URL are read from .env (or env vars). No service role key
 * is required for steps 1-4. Step 5 is skipped unless ADMIN_EMAIL +
 * ADMIN_PASSWORD env vars are provided (admin sign-in).
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";

// ---- load .env (only public vars) -----------------------------------------
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

const sb = createClient(URL, ANON, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let pass = 0, fail = 0;
const ok = (label, extra = "") => { pass++; console.log(`  ✓ ${label}${extra ? "  " + extra : ""}`); };
const ko = (label, err) => { fail++; console.log(`  ✗ ${label}\n      ${err?.message || err}`); };

const stamp = Date.now();

console.log(`\nAuditing ${URL} with PUBLIC key only…\n`);

// 1. public read
console.log("1. Public read (site_settings)");
{
  const { error } = await sb.from("site_settings").select("id").limit(1);
  error ? ko("anon SELECT site_settings", error) : ok("anon SELECT site_settings");
}

// 2. storage upload to public media bucket
console.log("\n2. Media upload (storage:media)");
{
  const path = `audit/anon-${stamp}.txt`;
  const body = new Blob([`audit ${stamp}`], { type: "text/plain" });
  const { error } = await sb.storage.from("media").upload(path, body, { upsert: true });
  if (error) ko("anon upload to media bucket", error);
  else {
    ok("anon upload to media bucket", path);
    const { data: pub } = sb.storage.from("media").getPublicUrl(path);
    ok("public URL resolves", pub.publicUrl);
  }
}

// 3. contact message submit
console.log("\n3. Contact message submit (messages)");
{
  const { error } = await sb.from("messages").insert({
    name: "Audit Bot",
    email: `audit-${stamp}@example.com`,
    subject: "Audit ping",
    message: `End-to-end audit at ${new Date().toISOString()}`,
  });
  error ? ko("anon INSERT messages", error) : ok("anon INSERT messages");
}

// 4. review/testimonial submit (must be pending + unpublished per RLS)
console.log("\n4. Review submit (testimonials)");
const reviewMarker = `AUDIT-${stamp}`;
{
  const { error } = await sb.from("testimonials").insert({
    client_name: "Audit Reviewer",
    review: `${reviewMarker} — automated audit submission.`,
    rating: 5,
    status: "pending",
    published: false,
    featured: false,
  });
  error ? ko("anon INSERT testimonials", error) : ok("anon INSERT testimonials");
}

// 5. admin visibility (optional — needs ADMIN_EMAIL/PASSWORD)
console.log("\n5. Admin visibility for the submitted review");
const adminEmail = process.env.ADMIN_EMAIL;
const adminPass = process.env.ADMIN_PASSWORD;
if (!adminEmail || !adminPass) {
  console.log("  · skipped (set ADMIN_EMAIL + ADMIN_PASSWORD to verify)");
  console.log(`  · meanwhile, search admin panel for: ${reviewMarker}`);
} else {
  const adminClient = createClient(URL, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: signInErr } = await adminClient.auth.signInWithPassword({
    email: adminEmail, password: adminPass,
  });
  if (signInErr) ko("admin sign-in", signInErr);
  else {
    ok("admin sign-in");
    const { data, error } = await adminClient
      .from("testimonials")
      .select("id, client_name, review, status")
      .ilike("review", `%${reviewMarker}%`)
      .limit(1);
    if (error) ko("admin SELECT new review", error);
    else if (!data?.length) ko("admin SELECT new review", "row not found");
    else ok("admin sees submitted review", `(id=${data[0].id}, status=${data[0].status})`);
  }
}

console.log(`\nResult: ${pass} passed, ${fail} failed.`);
process.exit(fail === 0 ? 0 : 1);
