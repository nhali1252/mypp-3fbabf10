/**
 * Server-side Supabase client using the PUBLIC (anon) key.
 *
 * Use this in server functions for read-only queries on tables that have
 * "Public read" RLS policies. Unlike `supabaseAdmin`, this does NOT require
 * `SUPABASE_SERVICE_ROLE_KEY`, so public pages keep working even if the
 * service role secret is missing on the deployed Worker.
 *
 * Reserve `supabaseAdmin` (client.server.ts) for:
 *   - inserts/updates/deletes that need to bypass RLS
 *   - storage operations
 *   - role checks against `user_roles`
 *   - any admin-only operation
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

function createSupabasePublicServerClient() {
  // Prefer runtime Worker vars; fall back to build-time VITE_* (always baked
  // into the bundle) so public reads keep working even if the deployed Worker
  // is missing the unprefixed SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY vars.
  const SUPABASE_URL =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error(
      "Missing Supabase server environment variables. Ensure SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY) are set.",
    );
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

let _client: ReturnType<typeof createSupabasePublicServerClient> | undefined;

export const supabasePublic = new Proxy(
  {} as ReturnType<typeof createSupabasePublicServerClient>,
  {
    get(_, prop, receiver) {
      if (!_client) _client = createSupabasePublicServerClient();
      return Reflect.get(_client, prop, receiver);
    },
  },
);
