import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

/**
 * GET/POST /api/env-import
 *
 * Reports which expected environment variables are configured on the
 * Cloudflare Worker runtime, and verifies that the Supabase admin client
 * can reach the database. Secret values are NEVER returned — only presence,
 * length, and a short fingerprint so you can confirm rotation took effect.
 *
 * Access control (BOTH must pass):
 *   1. Header `x-env-import-token` must match `ENV_IMPORT_TOKEN` server secret
 *      (fail-closed if the secret itself is unset).
 *   2. `Authorization: Bearer <jwt>` must be a valid Supabase session whose
 *      user has the `admin` role.
 */

const REQUIRED_VARS = [
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "VITE_SUPABASE_PROJECT_ID",
] as const;

// Optional: tracked for visibility but absence does NOT mark the run failed.
const OPTIONAL_VARS = [
  "SUPABASE_ANON_KEY",
  "SUPABASE_JWKS",
  "SUPABASE_DB_URL",
  "LOVABLE_API_KEY",
] as const;

const EXPECTED_VARS = [...REQUIRED_VARS, ...OPTIONAL_VARS] as const;

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
  const requiredSet = new Set<string>(REQUIRED_VARS as readonly string[]);
  const missingRequired = missing.filter((n) => requiredSet.has(n));
  const missingOptional = missing.filter((n) => !requiredSet.has(n));

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
    success: missingRequired.length === 0 && dbCheck.ok,
    startedAt,
    finishedAt: new Date().toISOString(),
    runtime: {
      hasNodeProcess: typeof process !== "undefined",
      hasFetch: typeof fetch !== "undefined",
    },
    env: {
      expected: EXPECTED_VARS.length,
      present: vars.filter((v) => v.present).length,
      missing,
      missingRequired,
      missingOptional,
      vars,
    },
    db: dbCheck,
  };
}

function jsonError(status: number, error: string) {
  return new Response(JSON.stringify({ success: false, error }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

async function verifyAdmin(request: Request): Promise<{ userId: string } | Response> {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    return jsonError(500, "Supabase env vars not configured on the server.");
  }

  const auth = request.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) {
    return jsonError(401, "Missing Bearer token");
  }
  const token = auth.slice("Bearer ".length).trim();
  if (!token) return jsonError(401, "Empty Bearer token");

  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) return jsonError(401, "Invalid session token");
  const userId = data.claims.sub;

  const { data: isAdmin, error: roleErr } = await supabaseAdmin.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (roleErr) return jsonError(500, `Role check failed: ${roleErr.message}`);
  if (!isAdmin) return jsonError(403, "Admin role required");

  return { userId };
}

async function handle(request: Request) {
  const expectedToken = process.env.ENV_IMPORT_TOKEN;
  if (!expectedToken) {
    return jsonError(
      503,
      "ENV_IMPORT_TOKEN secret is not configured. Add it in backend secrets and retry.",
    );
  }

  const provided = request.headers.get("x-env-import-token") ?? "";
  if (!timingSafeEqual(provided, expectedToken)) {
    return jsonError(401, "Invalid or missing x-env-import-token");
  }

  const auth = await verifyAdmin(request);
  if (auth instanceof Response) return auth;


  const report = await buildReport();

  // Persist a snapshot row so we have an audit trail of every import.
  let snapshotId: string | null = null;
  let snapshotError: string | null = null;
  try {
    const { data, error } = await supabaseAdmin
      .from("env_imports")
      .insert({
        success: report.success,
        started_at: report.startedAt,
        finished_at: report.finishedAt,
        expected_count: report.env.expected,
        present_count: report.env.present,
        missing: report.env.missing,
        vars: report.env.vars,
        db_check: report.db,
        source: "cloudflare-worker",
      })
      .select("id")
      .single();
    if (error) snapshotError = error.message;
    else snapshotId = data?.id ?? null;
  } catch (e) {
    snapshotError = e instanceof Error ? e.message : String(e);
  }

  const body = { ...report, snapshot: { id: snapshotId, error: snapshotError } };
  return new Response(JSON.stringify(body, null, 2), {
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
