import { createServerFn } from "@tanstack/react-start";
import { getRequestHost, getRequestHeader } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Trigger the /api/env-import route from the server (so the
 * ENV_IMPORT_TOKEN secret never reaches the browser), and return
 * the resulting status report.
 */
export const triggerEnvImport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    if (!userId) throw new Error("Not signed in");

    const { data: isAdmin, error: roleErr } = await supabaseAdmin.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (roleErr) throw new Error(roleErr.message);
    if (!isAdmin) throw new Error("Admin role required");

    // Token is optional — when configured we forward it; when not, the
    // /api/env-import handler skips the shared-secret check and relies on
    // the admin Bearer auth we forward below.
    const token = process.env.ENV_IMPORT_TOKEN;

    const host = getRequestHost();
    const proto = host?.includes("localhost") ? "http" : "https";
    const url = `${proto}://${host}/api/env-import`;

    const incomingAuth = getRequestHeader("authorization");
    const headers: Record<string, string> = {};
    if (token) headers["x-env-import-token"] = token;
    if (incomingAuth) headers["authorization"] = incomingAuth;

    const res = await fetch(url, {
      method: "POST",
      headers,
    });
    const body = await res.json().catch(() => ({ error: "non-JSON response" }));
    return { ok: res.ok, status: res.status, body };
  });

/**
 * Fetch the most recent env_imports rows so the admin UI can show history.
 */
export const listEnvImports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    if (!userId) throw new Error("Not signed in");

    const { data: isAdmin, error: roleErr } = await supabaseAdmin.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (roleErr) throw new Error(roleErr.message);
    if (!isAdmin) throw new Error("Admin role required");

    const { data, error } = await supabaseAdmin
      .from("env_imports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) throw new Error(error.message);
    return { rows: data ?? [] };
  });

/**
 * Lightweight worker health check — does NOT call /api/env-import or write
 * audit rows. Used as a gate before media/messages features so the UI can
 * show a clear "secrets missing — push to redeploy" banner instead of the
 * cryptic Cloudflare challenge / 500 from the underlying server fn.
 *
 * Returns booleans only — never the actual secret values.
 */
export const verifyWorkerHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    if (!userId) throw new Error("Not signed in");

    const { data: isAdmin, error: roleErr } = await supabaseAdmin.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (roleErr) throw new Error(roleErr.message);
    if (!isAdmin) throw new Error("Admin role required");

    const has = (k: string) => {
      const v = process.env[k];
      return typeof v === "string" && v.length > 0;
    };

    const required = {
      SUPABASE_URL: has("SUPABASE_URL"),
      SUPABASE_PUBLISHABLE_KEY: has("SUPABASE_PUBLISHABLE_KEY"),
      SUPABASE_SERVICE_ROLE_KEY: has("SUPABASE_SERVICE_ROLE_KEY"),
    };
    const optional = {
      LOVABLE_API_KEY: has("LOVABLE_API_KEY"),
      ENV_IMPORT_TOKEN: has("ENV_IMPORT_TOKEN"),
      SUPABASE_JWKS: has("SUPABASE_JWKS"),
      SUPABASE_DB_URL: has("SUPABASE_DB_URL"),
    };

    // Prove the SRK actually works — not just that the env var is set.
    let dbWritable = false;
    let dbError: string | null = null;
    try {
      const { error } = await supabaseAdmin.from("user_roles").select("role").limit(1);
      if (error) {
        dbError = error.message;
      } else {
        dbWritable = true;
      }
    } catch (e) {
      dbError = e instanceof Error ? e.message : String(e);
    }

    const ok = Object.values(required).every(Boolean) && dbWritable;

    return {
      ok,
      checkedAt: new Date().toISOString(),
      required,
      optional,
      db: { ok: dbWritable, error: dbError },
      hint: ok
        ? null
        : "One or more required worker secrets are missing. Push any commit to main to re-trigger the GitHub Actions deploy — it auto-syncs every secret to Cloudflare.",
    };
  });
