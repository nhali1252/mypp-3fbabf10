# Vercel deployment

This project deploys to **both Cloudflare Workers** (default, via `wrangler`) and **Vercel** (Node SSR, via `api/ssr.ts`). Pushing to either platform does not affect the other.

## One-time setup on Vercel

1. Import the repo on https://vercel.com/new — Vercel will auto-detect `vercel.json`.
2. **Framework Preset:** *Other* (the project ships its own config; do not pick TanStack/Vite presets — they would override `vercel.json`).
3. **Environment Variables** — copy these from Cloudflare / Lovable Cloud into Vercel → Project → Settings → Environment Variables (set all three scopes: Production, Preview, Development):

   Required:
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` *(server only — never expose)*
   - `SUPABASE_PROJECT_ID`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`

   Optional (only if the corresponding feature is used):
   - `LOVABLE_API_KEY` — Lovable AI gateway
   - `ENV_IMPORT_TOKEN` — admin env-import flow
   - `RESEND_API_KEY` — outbound email

4. Click **Deploy**.

## How requests are routed

`vercel.json` rewrites everything that is **not** a static file (anything without a typical asset extension and not under `/assets/`, `/_next/`, etc.) to `/api/ssr`, which boots the TanStack Start server entry as a Node 20 serverless function.

Static assets in `dist/client/` are served directly by Vercel's CDN with a 1-year immutable cache header for `/assets/*`.

## Build output expectations

The Vercel build runs `bun run build` and expects two folders to be produced:

- `dist/client/` — the browser bundle Vercel serves as static.
- `dist/server/index.js` — the Node SSR entry imported by `api/ssr.ts`.

The Lovable preset's bundled Cloudflare plugin keeps emitting the Worker bundle as well, which Vercel simply ignores. If a future Vite/preset upgrade ever stops producing `dist/server/index.js`, edit `api/ssr.ts` to import from the new SSR entry path — no other changes needed.

## Local check

```bash
bun run build
ls dist/client dist/server   # both should exist
```

## Cloudflare side is unchanged

`wrangler.jsonc`, the Workers bundle, and the `bun run deploy` flow are untouched. Cloudflare and Vercel can run side by side, pointing at the same Lovable Cloud (Supabase) backend.
