import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, RefreshCw, CheckCircle2, XCircle, Copy } from "lucide-react";
import { triggerEnvImport, listEnvImports, revealEnvVar } from "@/server/env-import.functions";
import { Eye } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/env-import")({
  component: EnvImportPage,
});

const REQUIRED_VARS = new Set([
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "VITE_SUPABASE_PROJECT_ID",
]);

type Snapshot = {
  id: string;
  created_at: string;
  success: boolean;
  expected_count: number;
  present_count: number;
  missing: string[];
  vars: Array<{ name: string; present: boolean; length: number; fingerprint: string | null }>;
  db_check: { ok: boolean; error: string | null; tableCount: number | null };
  source: string;
};

function EnvImportPage() {
  const [rows, setRows] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<unknown>(null);

  async function refresh() {
    setLoading(true);
    try {
      const res = await listEnvImports();
      setRows((res.rows ?? []) as unknown as Snapshot[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function run() {
    setRunning(true);
    setLastResult(null);
    try {
      const res = await triggerEnvImport();
      setLastResult(res.body);
      if (res.ok) toast.success("Env import completed");
      else toast.error(`Import failed (${res.status})`);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Trigger failed");
    } finally {
      setRunning(false);
    }
  }

  const last = rows[0];

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Environment Data Import</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Triggers <code className="text-xs">/api/env-import</code> on the Cloudflare Worker.
            It inspects which expected secrets are configured, verifies database connectivity,
            and writes a snapshot row for auditing. Secret values are never returned —
            only presence, length, and a short fingerprint.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={run} disabled={running}>
            {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
            Run import
          </Button>
        </div>
      </div>

      {last && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {last.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              <h2 className="text-lg font-semibold">
                Last run — {new Date(last.created_at).toLocaleString()}
              </h2>
            </div>
            <Badge variant={last.success ? "default" : "destructive"}>
              {last.success ? "Success" : "Failed"}
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 text-sm">
            <Stat label="Expected vars" value={last.expected_count} />
            <Stat label="Present" value={last.present_count} />
            <Stat label="Missing" value={last.missing?.length ?? 0} tone={last.missing?.length ? "bad" : "ok"} />
            <Stat
              label="DB check"
              value={last.db_check?.ok ? `${last.db_check.tableCount ?? 0} tables` : "fail"}
              tone={last.db_check?.ok ? "ok" : "bad"}
            />
          </div>

          {last.missing?.length > 0 && (() => {
            const missingRequired = last.missing.filter((m) => REQUIRED_VARS.has(m));
            const missingOptional = last.missing.filter((m) => !REQUIRED_VARS.has(m));
            return (
              <div className="mb-5 space-y-3">
                {missingRequired.length > 0 && (
                  <div>
                    <div className="text-xs uppercase tracking-wider text-destructive mb-2">Missing (required)</div>
                    <div className="flex flex-wrap gap-1.5">
                      {missingRequired.map((m) => (
                        <Badge key={m} variant="destructive">{m}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {missingOptional.length > 0 && (
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Missing (optional — not required for the app to run)</div>
                    <div className="flex flex-wrap gap-1.5">
                      {missingOptional.map((m) => (
                        <Badge key={m} variant="secondary">{m}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Variables</div>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-3 py-2">Name</th>
                    <th className="text-left px-3 py-2">Present</th>
                    <th className="text-left px-3 py-2">Length</th>
                    <th className="text-left px-3 py-2">Fingerprint</th>
                  </tr>
                </thead>
                <tbody>
                  {last.vars?.map((v) => (
                    <tr key={v.name} className="border-t">
                      <td className="px-3 py-1.5 font-mono text-xs">{v.name}</td>
                      <td className="px-3 py-1.5">
                        {v.present ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                      </td>
                      <td className="px-3 py-1.5 text-muted-foreground">{v.length || "—"}</td>
                      <td className="px-3 py-1.5 font-mono text-xs text-muted-foreground">
                        {v.fingerprint ? (
                          <div className="flex items-center gap-1.5">
                            <span>{v.fingerprint}</span>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(v.fingerprint!);
                                  toast.success(`Copied fingerprint for ${v.name}`);
                                } catch {
                                  toast.error("Copy failed");
                                }
                              }}
                              className="inline-flex items-center justify-center h-6 w-6 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              aria-label={`Copy fingerprint for ${v.name}`}
                              title="Copy fingerprint"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                            {v.present && (
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!confirm(`Reveal & copy the FULL value of ${v.name}?\n\nThis exposes the secret to your clipboard.`)) return;
                                  try {
                                    const res = await revealEnvVar({ data: { name: v.name } });
                                    if (!res.value) { toast.error("No value returned"); return; }
                                    await navigator.clipboard.writeText(res.value);
                                    toast.success(`Copied full value of ${v.name}`);
                                  } catch (e) {
                                    toast.error(e instanceof Error ? e.message : "Reveal failed");
                                  }
                                }}
                                className="inline-flex items-center justify-center h-6 w-6 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                aria-label={`Copy full value of ${v.name}`}
                                title="Copy full value (admin only)"
                              >
                                <Eye className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

      {rows.length > 1 && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-3">Recent runs</h3>
          <div className="space-y-1.5">
            {rows.slice(1).map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                <div className="flex items-center gap-2">
                  {r.success ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                  <span>{new Date(r.created_at).toLocaleString()}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {r.present_count}/{r.expected_count} vars · {r.db_check?.ok ? "db ok" : "db fail"}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {!loading && rows.length === 0 && (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          No imports yet. Click <strong>Run import</strong> to create the first snapshot.
        </Card>
      )}

      {lastResult != null && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-2">Raw response (this session)</h3>
          <pre className="text-xs bg-muted/40 rounded-lg p-3 overflow-auto max-h-72">
            {JSON.stringify(lastResult, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: React.ReactNode; tone?: "ok" | "bad" }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div
        className={`text-lg font-semibold mt-0.5 ${
          tone === "ok" ? "text-green-600" : tone === "bad" ? "text-destructive" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}
