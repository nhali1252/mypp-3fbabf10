# Deployment: GitHub → Cloudflare Workers

This project is built for the Cloudflare Workers runtime (see `wrangler.jsonc` and `@cloudflare/vite-plugin` in `package.json`). The included GitHub Actions workflow at `.github/workflows/deploy.yml` deploys every push to `main`.

You keep editing in Lovable. Lovable syncs to GitHub. GitHub Actions builds and deploys to your Cloudflare account.

## One-time setup

### 1. Create a Cloudflare API token

1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click **Create Token** → use the **Edit Cloudflare Workers** template
3. Copy the token
4. Also copy your **Account ID** from any Cloudflare dashboard page (right sidebar)

### 2. Add GitHub repository secrets

In your GitHub repo: **Settings → Secrets and variables → Actions → New repository secret**.

Add all of these:

| Secret name | Where to get it |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Step 1 above |
| `CLOUDFLARE_ACCOUNT_ID` | Step 1 above |
| `VITE_SUPABASE_URL` | Copy from `.env` in Lovable |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Copy from `.env` in Lovable |
| `VITE_SUPABASE_PROJECT_ID` | Copy from `.env` in Lovable |
| `SUPABASE_URL` | Same value as `VITE_SUPABASE_URL` |
| `SUPABASE_PUBLISHABLE_KEY` | Same value as `VITE_SUPABASE_PUBLISHABLE_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY` | Lovable Cloud → Backend → API → `service_role` key |

The `VITE_*` values are baked into the client bundle at build time. The non-prefixed `SUPABASE_*` values are uploaded as Worker runtime secrets (used by `auth-middleware.ts` and `client.server.ts`).

### 3. Push to GitHub

Connect your Lovable project to GitHub (top-right in Lovable → GitHub). Once pushed, the workflow runs automatically. Watch progress under the **Actions** tab.

## After deploy

Your site is live at `https://tanstack-start-app.<your-subdomain>.workers.dev` (the name comes from `wrangler.jsonc`). To attach a custom domain, do it in the Cloudflare dashboard → Workers & Pages → your worker → Settings → Domains & Routes.

## Editing flow stays the same

- Edit in Lovable as usual.
- Lovable pushes commits to GitHub.
- GitHub Actions deploys to Cloudflare automatically.
- The Lovable preview URL still works for in-editor previews.

## Troubleshooting

- **Build fails on `bun install`**: ensure your repo contains `bun.lockb` (it does) and that no private packages are referenced.
- **Deploy succeeds but site shows env errors**: a `SUPABASE_*` secret is missing in GitHub. Re-check the table above.
- **401 on `/admin` server functions**: `SUPABASE_SERVICE_ROLE_KEY` is missing or wrong.
- **Want to redeploy without a code change**: Actions tab → Deploy to Cloudflare Workers → **Run workflow**.