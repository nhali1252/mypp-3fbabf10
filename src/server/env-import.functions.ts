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

    const token = process.env.ENV_IMPORT_TOKEN;
    if (!token) {
      return {
        ok: false,
        status: 503,
        body: { error: "ENV_IMPORT_TOKEN secret is not configured." },
      };
    }

    const host = getRequestHost();
    const proto = host?.includes("localhost") ? "http" : "https";
    const url = `${proto}://${host}/api/env-import`;

    const incomingAuth = getRequestHeader("authorization");
    const headers: Record<string, string> = { "x-env-import-token": token };
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
