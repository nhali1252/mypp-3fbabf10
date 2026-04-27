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

---

## Migrating to a New Supabase Project

If you create a brand-new Supabase project and want to move all existing CMS / portfolio data into it, follow this plan.

### What can be migrated automatically

| Item | How |
| --- | --- |
| Schema (tables, columns, indexes, FKs, enums) | `supabase db dump --schema-only` |
| Row data (CMS content, portfolio, testimonials, etc.) | `supabase db dump --data-only` |
| RLS policies | included in schema dump |
| Functions, triggers, views | included in schema dump |
| Storage files (the `media` bucket) | `supabase storage cp` or rclone |

### What you must recreate manually

| Item | Why |
| --- | --- |
| Auth users (`auth.users` rows) | They live in the `auth` schema, which Supabase blocks from a normal dump. Re-invite users or use the Auth admin API export/import. |
| Auth provider config (Google, magic links, SMTP, redirect URLs) | Project-level dashboard settings. |
| Project secrets (`SUPABASE_SERVICE_ROLE_KEY`, R2 keys, etc.) | Each project has its own keys — see the secrets list above. |
| Realtime publication (`supabase_realtime`) membership for any tables you stream | Project-level. |

### Step-by-step

You'll need the [Supabase CLI](https://supabase.com/docs/guides/cli) installed locally. Replace `OLD_REF` and `NEW_REF` with the project refs from each project's URL (`https://<ref>.supabase.co`).

```bash
# 1. Authenticate locally
supabase login

# 2. Dump schema + data from the OLD project
supabase db dump --db-url "postgresql://postgres:OLD_DB_PASSWORD@db.OLD_REF.supabase.co:5432/postgres" \
  --schema public --schema-only > schema.sql
supabase db dump --db-url "postgresql://postgres:OLD_DB_PASSWORD@db.OLD_REF.supabase.co:5432/postgres" \
  --schema public --data-only --use-copy > data.sql

# 3. Apply schema, then data, to the NEW project
psql "postgresql://postgres:NEW_DB_PASSWORD@db.NEW_REF.supabase.co:5432/postgres" -f schema.sql
psql "postgresql://postgres:NEW_DB_PASSWORD@db.NEW_REF.supabase.co:5432/postgres" -f data.sql

# 4. Migrate the `media` storage bucket
#    First create the bucket in the new project (Dashboard → Storage → New bucket → name: media, public: true)
supabase storage cp --recursive \
  "supabase://OLD_REF/media" \
  "supabase://NEW_REF/media"
```

### Point the app at the new project

After the data is in the new project, update the Cloudflare Worker variables/secrets:

| Variable | Type | New value |
| --- | --- | --- |
| `SUPABASE_URL` | Variable | `https://NEW_REF.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | Variable | New project's `anon` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | New project's `service_role` key |

Also update the same three values in `wrangler.jsonc` (`vars.SUPABASE_URL` and `vars.SUPABASE_PUBLISHABLE_KEY`) and your local `.env` so dev and deploy agree. Then **redeploy the Worker**.

### Post-migration verification

1. `/health` shows all three vars green ✅.
2. Visit `/`, `/portfolio`, `/feed`, `/contact` — content loads, no fallback errors.
3. Sign in to `/auth`, open `/admin/settings` → "Cloudflare secrets checklist" shows all-green.
4. Edit any CMS field (e.g. hero title), save, refresh — change persists.
5. Upload a test image via `/admin/media` — appears in storage and on the page.
6. Submit a contact form / testimonial — row appears in the new database.

If anything fails, run `/health` first — it tells you exactly which env var is missing.
