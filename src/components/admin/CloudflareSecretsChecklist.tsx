import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { AdminCard } from "@/components/admin/AdminPage";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Copy, RefreshCw, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const REQUIRED_SERVER_ENV = [
  {
    name: "SUPABASE_URL",
    description: "Backend project URL — public, safe to expose.",
    type: "Variable" as const,
  },
  {
    name: "SUPABASE_PUBLISHABLE_KEY",
    description: "Anon key used by the server SDK — public, safe to expose.",
    type: "Variable" as const,
  },
  {
    name: "SUPABASE_SERVICE_ROLE_KEY",
    description: "Privileged service role — REQUIRED. Add as a Secret, never as a Variable.",
    type: "Secret" as const,
  },
];

const checkServerEnv = createServerFn({ method: "GET" }).handler(async () => {
  return REQUIRED_SERVER_ENV.map((v) => {
    const raw = process.env[v.name];
    // Only expose values for public Variables (URL + anon key).
    // Service role key is a Secret — value is NEVER returned to the client.
    const value = v.type === "Variable" ? (raw ?? null) : null;
    return {
      name: v.name,
      present: Boolean(raw),
      value,
    };
  });
});

export function CloudflareSecretsChecklist() {
  const qc = useQueryClient();
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["cloudflare-env-check"],
    queryFn: () => checkServerEnv(),
    staleTime: 30_000,
  });

  const statusByName = new Map((data ?? []).map((c) => [c.name, c.present]));
  const valueByName = new Map((data ?? []).map((c) => [c.name, c.value]));
  const missing = REQUIRED_SERVER_ENV.filter((v) => statusByName.get(v.name) === false);
  const allOk = data && missing.length === 0;

  return (
    <AdminCard title="Cloudflare secrets checklist">
      <div className="space-y-4">
        <p className="text-sm opacity-75 -mt-1">
          One-click reference for the Supabase keys your deployed Worker needs. Updates require a
          redeploy to take effect.
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              qc.invalidateQueries({ queryKey: ["cloudflare-env-check"] });
              refetch();
            }}
            disabled={isFetching}
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
            Re-check now
          </Button>
          <a
            href="https://dash.cloudflare.com/?to=/:account/workers-and-pages"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm underline opacity-80 hover:opacity-100"
          >
            Open Cloudflare dashboard <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {data ? (
          allOk ? (
            <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm">
              ✅ All required server environment variables are present on the deployed Worker.
            </div>
          ) : (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
              ❌ {missing.length} missing on the deployed Worker:{" "}
              <strong>{missing.map((m) => m.name).join(", ")}</strong>. Add the secrets below, then
              redeploy.
            </div>
          )
        ) : (
          <div className="text-sm opacity-70">Checking server environment…</div>
        )}

        <ol className="space-y-3 text-sm">
          {REQUIRED_SERVER_ENV.map((v, i) => {
            const present = statusByName.get(v.name);
            return (
              <li
                key={v.name}
                className="rounded-lg border border-border bg-card/40 p-3 space-y-2"
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="opacity-60">{i + 1}.</span>
                    <code className="text-xs px-1.5 py-0.5 rounded bg-muted">{v.name}</code>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border ${
                        v.type === "Secret"
                          ? "border-amber-500/40 text-amber-400"
                          : "border-border opacity-70"
                      }`}
                    >
                      {v.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {present === true && (
                      <span className="inline-flex items-center gap-1 text-emerald-400 text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Set
                      </span>
                    )}
                    {present === false && (
                      <span className="inline-flex items-center gap-1 text-destructive text-xs">
                        <XCircle className="w-3.5 h-3.5" /> Missing
                      </span>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(v.name);
                        toast.success(`Copied ${v.name}`);
                      }}
                    >
                      <Copy className="w-3.5 h-3.5 mr-1" /> Copy name
                    </Button>
                    {valueByName.get(v.name) ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const val = valueByName.get(v.name);
                          if (!val) return;
                          navigator.clipboard.writeText(val);
                          toast.success(`Copied ${v.name} value`);
                        }}
                      >
                        <Copy className="w-3.5 h-3.5 mr-1" /> Copy value
                      </Button>
                    ) : v.type === "Secret" && present ? (
                      <span className="text-[10px] uppercase tracking-wider opacity-60">
                        value hidden
                      </span>
                    ) : null}
                  </div>
                </div>
                <p className="text-xs opacity-75">{v.description}</p>
              </li>
            );
          })}
        </ol>

        <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs space-y-1.5">
          <p className="font-semibold text-sm">How to add them</p>
          <ol className="list-decimal pl-5 space-y-1 opacity-90">
            <li>Cloudflare dashboard → <strong>Workers &amp; Pages</strong> → select your worker.</li>
            <li>Open <strong>Settings → Variables and Secrets</strong>.</li>
            <li>
              Click <strong>Add</strong> → choose the type shown above (<em>Secret</em> for the
              service role key, <em>Variable</em> for the URL and anon key).
            </li>
            <li>Paste the name (use the copy button) and the value from your Supabase project.</li>
            <li>
              <strong>Redeploy the Worker</strong> — secrets only become available on the next
              deployment. Then click <em>Re-check now</em> above to verify.
            </li>
          </ol>
        </div>
      </div>
    </AdminCard>
  );
}
