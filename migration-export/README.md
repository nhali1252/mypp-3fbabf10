# Lovable Cloud → Your own Supabase: migration package

Generated `2026-04-27` from your live Lovable Cloud DB.

This folder contains everything you need to recreate your project on your own
Supabase project. The current Lovable Cloud backend stays running until you
flip the env variables in step 6 — there's no automatic disconnect.

## Files

| File | What it does |
|---|---|
| `01_schema.sql` | All tables, enums, functions, triggers, indexes, RLS policies. **Run first.** |
| `02_storage.sql` | Creates the `media` bucket and its storage RLS policies. **Run second.** |
| `03_data.sql` | INSERT statements for every row in every public table. **Run third.** |
| `_raw_dump.sql` | Untouched `pg_dump` output. Reference only — don't run. |

---

## Step-by-step

### 1. Run the schema on your new Supabase project
1. Open your new Supabase project → **SQL Editor** → **New query**.
2. Paste the contents of `01_schema.sql` → **Run**.
3. Paste `02_storage.sql` → **Run**.
4. Verify in **Table Editor** that all 36 tables appear and **Storage** shows the `media` bucket.

### 2. Configure auth providers
Go to **Authentication → Providers** on your new Supabase project and enable:
- **Email** (match your current Lovable Cloud setting — confirm-email enabled or not)
- Any social providers you use (Google, etc.) — re-enter their client IDs/secrets

Go to **Authentication → URL Configuration** and add your site URLs to:
- **Site URL**: your production domain
- **Redirect URLs**: `https://<your-domain>/**`, `http://localhost:5173/**`

### 3. Migrate auth users
Lovable Cloud's `auth.users` table cannot be exported via `pg_dump` (Supabase blocks it).
Two options:

**Option A — Ask users to re-sign-up** (simplest, loses passwords).
You can pre-seed `public.user_roles` so admins regain admin access on their first login by re-running:
```sql
-- After your admin signs up on the new project, find their user_id in Authentication → Users, then:
INSERT INTO public.user_roles (user_id, role) VALUES ('<paste-uuid-here>', 'admin');
```

**Option B — Export/import via Supabase Auth API** (preserves users, NOT passwords).
1. On the **old** project (Lovable Cloud → Cloud → Users → ⋯ menu) export the user list as CSV/JSON if available, OR run this in SQL Editor:
   ```sql
   SELECT id, email, raw_user_meta_data, created_at FROM auth.users;
   ```
   Save the result.
2. On the **new** project use the [Supabase Admin API](https://supabase.com/docs/reference/javascript/auth-admin-createuser)
   `supabase.auth.admin.createUser({ email, email_confirm: true, user_metadata })` for each user.
3. Send all users a password-reset email so they can set a new password.

### 4. Insert table data
1. SQL Editor → paste `03_data.sql` → **Run**.
2. ⚠️ If step 3 (Option A) is your path, the `profiles`, `user_roles`, `feed_comments`, `feed_reactions`, `feed_comment_reports` rows reference `auth.users(id)` UUIDs that no longer exist — those inserts will FAIL with FK violations. That's fine; comment them out or skip those tables. If you used Option B and preserved UUIDs, the inserts will succeed.

### 5. Migrate storage files
The `media` bucket files don't come with the SQL dump.
1. **Old project**: Cloud → Storage → `media` bucket → select all → **Download** (or use the Supabase CLI: `supabase storage cp ss://media ./media-backup --recursive`).
2. **New project**: Storage → `media` bucket → **Upload** the same files, preserving the folder structure.

### 6. Switch the app to your new project
Update these in **GitHub repo → Settings → Secrets and variables → Actions**
(your `.github/workflows/deploy.yml` reads from these on every deploy):

| Secret name | New value (from Supabase → Settings → API) |
|---|---|
| `SUPABASE_URL` | `https://<new-ref>.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | the new `anon` / `sb_publishable_...` key |
| `SUPABASE_SERVICE_ROLE_KEY` | the new `service_role` key |
| `VITE_SUPABASE_URL` | same as `SUPABASE_URL` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | same as `SUPABASE_PUBLISHABLE_KEY` |
| `VITE_SUPABASE_PROJECT_ID` | the new project ref (e.g. `abcdxyz...`) |

Also update `wrangler.jsonc` `vars` block locally and re-deploy (or your deploy
workflow will overwrite it from the GitHub secrets — see the workflow file).

### 7. Verify
On the deployed site (or `bun dev` locally with new `.env`):
1. `/health` → all three indicators green
2. `/` → public sections render
3. `/auth` → log in
4. `/admin` → admin pages load (proves `user_roles` + `has_role()` work)
5. Edit something in admin → save (proves writes + service role)
6. Upload an image (proves storage)

### 8. Decommission old Cloud (optional, irreversible)
Only after the new project has been working for a few days. There is no UI button —
just stop reading from the old project. The Lovable-managed DB stays live but unused.

---

## Notes / caveats

- **Edge function `admin-users`**: lives in `supabase/functions/admin-users/`. After
  switching, redeploy it to your new project via Supabase CLI:
  `supabase functions deploy admin-users --project-ref <new-ref>`
- **Cron jobs / pg_cron**: none detected in your current DB.
- **Realtime**: if you use realtime channels, enable replication on the same tables
  in your new project (Supabase Dashboard → Database → Replication).
- **`env_imports` table** can stay empty — it was only used by the old Cloudflare worker setup.
