import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const REQUIRED_SERVER_ENV = [
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

type EnvCheck = { name: string; present: boolean };

/**
 * Admin-only diagnostic. Exposes which server env vars are present so
 * deployment misconfigurations can be debugged without leaking the values
 * themselves. Anonymous callers get a 403 — never a list of variable names.
 */
const checkServerEnv = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (error || !data) {
      throw new Response("Forbidden", { status: 403 });
    }

    const checks: EnvCheck[] = REQUIRED_SERVER_ENV.map((name) => ({
      name,
      present: Boolean(process.env[name]),
    }));
    const missing = checks.filter((c) => !c.present).map((c) => c.name);
    return {
      ok: missing.length === 0,
      missing,
      checks,
      checkedAt: new Date().toISOString(),
    };
  });

export const Route = createFileRoute("/health")({
  loader: async () => {
    try {
      return await checkServerEnv();
    } catch (err) {
      // Anonymous / non-admin → bounce to login. Never leak that the
      // diagnostic exists or which vars are checked.
      throw redirect({ to: "/auth" });
    }
  },
  component: HealthPage,
  errorComponent: () => (
    <div style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 20, fontWeight: 600 }}>Not available</h1>
      <p style={{ marginTop: 8, opacity: 0.7 }}>
        This diagnostic page is only available to administrators.
      </p>
      <Link to="/" style={{ color: "hsl(var(--primary))" }}>
        Go home
      </Link>
    </div>
  ),
});

function HealthPage() {
  const data = Route.useLoaderData();
  return (
    <div
      style={{
        maxWidth: 720,
        margin: "40px auto",
        padding: 24,
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        color: "hsl(var(--foreground))",
      }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
        Server runtime diagnostics
      </h1>
      <p style={{ opacity: 0.7, marginBottom: 24 }}>
        Checked at {data.checkedAt}
      </p>

      {data.ok ? (
        <div
          style={{
            padding: 16,
            border: "1px solid #22c55e",
            background: "rgba(34,197,94,0.08)",
            borderRadius: 8,
            marginBottom: 24,
          }}
        >
          ✅ All required server environment variables are set.
        </div>
      ) : (
        <div
          style={{
            padding: 16,
            border: "1px solid #ef4444",
            background: "rgba(239,68,68,0.08)",
            borderRadius: 8,
            marginBottom: 24,
          }}
        >
          <strong>❌ Missing server environment variables:</strong>
          <ul style={{ marginTop: 8, paddingLeft: 20 }}>
            {data.missing.map((name: string) => (
              <li key={name}>
                <code>{name}</code>
              </li>
            ))}
          </ul>
        </div>
      )}

      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>All checks</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: "left", opacity: 0.7 }}>
            <th style={{ padding: "8px 0" }}>Variable</th>
            <th style={{ padding: "8px 0" }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.checks.map((c: EnvCheck) => (
            <tr key={c.name} style={{ borderTop: "1px solid rgba(0,0,0,0.1)" }}>
              <td style={{ padding: "8px 0" }}>
                <code>{c.name}</code>
              </td>
              <td style={{ padding: "8px 0" }}>{c.present ? "✅ set" : "❌ missing"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
