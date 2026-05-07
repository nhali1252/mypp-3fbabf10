import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

const REQUIRED_SERVER_ENV = [
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

type EnvCheck = { name: string; present: boolean };

const checkServerEnv = createServerFn({ method: "GET" }).handler(async () => {
  const checks: EnvCheck[] = REQUIRED_SERVER_ENV.map((name) => ({
    name,
    present: Boolean(process.env[name]),
  }));
  const missing = checks.filter((c) => !c.present).map((c) => c.name);
  return {
    ok: missing.length === 0,
    missing,
    checks,
    runtime: typeof navigator !== "undefined" ? navigator.userAgent : "node",
    checkedAt: new Date().toISOString(),
  };
});

export const Route = createFileRoute("/health")({
  loader: () => checkServerEnv(),
  component: HealthPage,
  errorComponent: ({ error }) => (
    <pre style={{ padding: 24, color: "crimson" }}>
      Diagnostic failed: {error.message}
    </pre>
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
          <p style={{ marginTop: 12, fontSize: 14, opacity: 0.8 }}>
            Add the missing name(s) as <strong>Secrets</strong> in your
            Cloudflare Worker → Settings → Variables and Secrets, then redeploy.
          </p>
        </div>
      )}

      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
        All checks
      </h2>
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
              <td style={{ padding: "8px 0" }}>
                {c.present ? "✅ set" : "❌ missing"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
