# Portfolio app

TanStack Start app deployed to a Cloudflare Worker, backed by Lovable Cloud (Supabase).

---

## Cloudflare Worker Secrets

The deployed Worker needs these environment variables to talk to Supabase. Public pages need only `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` — they read via RLS-protected anon access. Admin features (saving content, moderating comments, uploading media, sending messages) additionally need `SUPABASE_SERVICE_ROLE_KEY`. If the public vars are missing, content sections show a friendly fallback (with a link to `/admin/settings` for the in-app checklist).

> ⚠️ **Never commit real keys to this repo.** Public values may live in `wrangler.jsonc` under `vars`. The service role key MUST be a Cloudflare **Secret**.

### Required values

| Name                         | Type in Cloudflare | What it is                                                                 |
| ---------------------------- | ------------------ | -------------------------------------------------------------------------- |
| `SUPABASE_URL`               | Variable           | Your Supabase project URL (`https://<project-ref>.supabase.co`).           |
| `SUPABASE_PUBLISHABLE_KEY`   | Variable           | The public **anon** key. Safe to expose in browsers.                       |
| `SUPABASE_SERVICE_ROLE_KEY`  | **Secret**         | Privileged service role key. Server-only. Bypasses RLS — never expose it.  |

### Where to find each value in Supabase

1. Open your Supabase project dashboard.
2. Go to **Project Settings → API**.
3. You'll see:
   - **Project URL** → use as `SUPABASE_URL`.
   - **Project API keys** section:
     - `anon` `public` → use as `SUPABASE_PUBLISHABLE_KEY`.
     - `service_role` `secret` → use as `SUPABASE_SERVICE_ROLE_KEY`. Click *Reveal* to copy. Treat like a password.

### How to add them in Cloudflare

1. Cloudflare dashboard → **Workers & Pages** → select this Worker.
2. **Settings → Variables and Secrets**.
3. Click **Add**:
   - For `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`: choose type **Variable**, paste the value.
   - For `SUPABASE_SERVICE_ROLE_KEY`: choose type **Secret**, paste the value.
4. **Redeploy the Worker.** New secrets only take effect on the next deployment.
5. Verify by visiting `/health` on your deployed site, or **Admin → Site settings → Cloudflare secrets checklist** for an in-app live check.

### Rotation

If a key is ever leaked or you want to rotate it:

1. Supabase → **Project Settings → API → Reset** (for the service role key) or rotate JWT signing keys.
2. Update the value in Cloudflare under the same name.
3. Redeploy the Worker.

---

## Local development

`bun install && bun dev` — local dev reads from `.env`, which Lovable manages automatically.
