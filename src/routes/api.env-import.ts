import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * GET/POST /api/env-import
 *
 * Reports which expected environment variables are configured on the
 * Cloudflare Worker runtime, and verifies that the Supabase admin client
 * can reach the database. Secret values are NEVER returned — only presence,
 * length, and a short fingerprint so you can confirm rotation took effect.
 *
 * Protected by a shared header `x-env-import-token` which must match the
 * `ENV_IMPORT_TOKEN` server secret. If the secret is unset, the route
 * refuses to run (fail-closed).
 */

const EXPECTED_VARS = [
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_ANON_KEY",
  "SUPABASE_JWKS",
  "SUPABASE_DB_URL",
  "LOVABLE_API_KEY",
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "VITE_SUPABASE_PROJECT_ID",
] as const;

type VarReport = {
  name: string;
  present: boolean;
  length: number;
  fingerprint: string | null;
};

function fingerprint(value: string): string {
  // Short, non-reversible identifier: first 4 + last 4, never the middle.
  if (value.length <= 8) return "****";
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

function inspectVar(name: string): VarReport {
  const v = process.env[name];
  if (!v) return { name, present: false, length: 0, fingerprint: null };
  return { name, present: true, length: v.length, fingerprint: fingerprint(v) };
}

async function buildReport() {
  const startedAt = new Date().toISOString();
  const vars = EXPECTED_VARS.map(inspectVar);
  const missing = vars.filter((v) => !v.present).map((v) => v.name);

  // Verify the admin client can actually talk to the DB.
  let dbCheck: { ok: boolean; error: string | null; tableCount: number | null } = {
    ok: false,
    error: null,
    tableCount: null,
  };
  try {
    const { data, error } = await supabaseAdmin.rpc("list_public_tables");
    if (error) {
      dbCheck = { ok: false, error: error.message, tableCount: null };
    } else {
      dbCheck = { ok: true, error: null, tableCount: Array.isArray(data) ? data.length : 0 };
    }
  } catch (e) {
    dbCheck = {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      tableCount: null,
    };
  }

  return {
    success: missing.length === 0 && dbCheck.ok,
    startedAt,
    finishedAt: new Date().toISOString(),
    runtime: {
      // Cloudflare Workers expose these via the bindings; surface what we can.
      hasNodeProcess: typeof process !== "undefined",
      hasFetch: typeof fetch !== "undefined",
    },
    env: {
      expected: EXPECTED_VARS.length,
      present: vars.filter((v) => v.present).length,
      missing,
      vars,
    },
    db: dbCheck,
  };
}

async function handle(request: Request) {
  const expectedToken = process.env.ENV_IMPORT_TOKEN;
  if (!expectedToken) {
    return new Response(
      JSON.stringify({
        success: false,
        error:
          "ENV_IMPORT_TOKEN secret is not configured. Add it in backend secrets and retry.",
      }),
      { status: 503, headers: { "content-type": "application/json" } },
    );
  }

  const provided = request.headers.get("x-env-import-token");
  if (!provided || provided !== expectedToken) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized" }),
      { status: 401, headers: { "content-type": "application/json" } },
    );
  }

  const report = await buildReport();
  return new Response(JSON.stringify(report, null, 2), {
    status: report.success ? 200 : 500,
    headers: { "content-type": "application/json" },
  });
}

export const Route = createFileRoute("/api/env-import")({
  server: {
    handlers: {
      GET: ({ request }) => handle(request),
      POST: ({ request }) => handle(request),
    },
  },
});
