import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { verifyWorkerHealth } from "@/server/env-import.functions";
import { CloudflareChallengeStatus } from "@/components/admin/CloudflareChallengeStatus";

/**
 * Wrap admin pages that depend on the Cloudflare Worker having admin secrets
 * (media library, messages, env-import). If `SUPABASE_SERVICE_ROLE_KEY` is
 * missing on the deployed Worker — or any other required secret — the gate
 * shows a clear, actionable banner instead of letting the underlying server
 * function blow up with a generic 500 / Cloudflare challenge page.
 *
 * The user never has to paste secrets manually:
 *   - GitHub Actions auto-syncs every secret to Cloudflare on each deploy
 *   - This gate just tells them when a redeploy is needed
 */
export function WorkerHealthGate({
  children,
  feature = "this feature",
  showWhenHealthy = false,
}: {
  children: React.ReactNode;
  feature?: string;
  showWhenHealthy?: boolean;
}) {
  const q = useQuery({
    queryKey: ["worker-health"],
    queryFn: () => verifyWorkerHealth(),
    staleTime: 30_000,
    retry: 1,
  });

  if (q.isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking worker health…
      </div>
    );
  }

  if (q.isError) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-destructive/35 bg-destructive/10 p-4 text-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-destructive">Worker is unreachable</div>
              <p className="mt-1 text-muted-foreground">
                {q.error instanceof Error ? q.error.message : "Unknown error"}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                If the message below shows a Cloudflare challenge, follow the WAF Skip rule
                instructions. Otherwise, push any commit to <code>main</code> — GitHub Actions
                will redeploy and auto-sync every Cloudflare secret.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => q.refetch()}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Retry
            </Button>
          </div>
        </div>
        <CloudflareChallengeStatus />
      </div>
    );
  }

  const data = q.data;
  if (!data?.ok) {
    const missing = data
      ? [
          ...Object.entries(data.required)
            .filter(([, v]) => !v)
            .map(([k]) => k),
        ]
      : [];

    return (
      <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <div className="font-semibold">Worker secrets not ready</div>
              <p className="mt-1 text-muted-foreground">
                {feature.charAt(0).toUpperCase() + feature.slice(1)} needs the deployed
                Cloudflare Worker to have admin credentials. {data?.hint}
              </p>
            </div>

            {missing.length > 0 && (
              <div>
                <div className="mb-1.5 text-xs uppercase tracking-wider text-muted-foreground">
                  Missing on worker
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {missing.map((m) => (
                    <Badge key={m} variant="destructive" className="font-mono text-[11px]">
                      {m}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {data && !data.db.ok && (
              <div className="rounded-lg border bg-background/60 p-2.5 text-xs">
                <div className="font-semibold text-destructive">Database check failed</div>
                <div className="mt-0.5 break-words font-mono text-muted-foreground">
                  {data.db.error ?? "Unknown error"}
                </div>
              </div>
            )}

            <ol className="list-decimal pl-4 text-xs leading-relaxed text-muted-foreground space-y-1">
              <li>
                Make sure these GitHub Actions secrets exist (one-time setup):
                <code className="ml-1">CLOUDFLARE_API_TOKEN</code>,{" "}
                <code>CLOUDFLARE_ACCOUNT_ID</code>,{" "}
                <code>SUPABASE_SERVICE_ROLE_KEY</code>.
              </li>
              <li>
                Push any commit to <code>main</code> (or click <em>Re-run workflow</em> in
                Actions). The deploy job auto-uploads every secret to Cloudflare.
              </li>
              <li>Click <strong>Retry</strong> below once the deploy completes.</li>
            </ol>
          </div>
          <Button size="sm" variant="outline" onClick={() => q.refetch()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {showWhenHealthy && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="font-medium">Worker healthy</span>
            <span className="text-xs text-muted-foreground">
              · all required secrets present · DB reachable
            </span>
          </div>
          <Button size="sm" variant="ghost" onClick={() => q.refetch()}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
      {children}
    </>
  );
}

/** Tiny inline status pill — useful in admin headers. */
export function WorkerHealthPill() {
  const q = useQuery({
    queryKey: ["worker-health"],
    queryFn: () => verifyWorkerHealth(),
    staleTime: 30_000,
  });
  if (q.isLoading) {
    return (
      <Badge variant="outline" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" /> checking
      </Badge>
    );
  }
  if (q.data?.ok) {
    return (
      <Badge variant="outline" className="gap-1 border-emerald-500/40 text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 className="h-3 w-3" /> worker ok
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 border-amber-500/40 text-amber-700 dark:text-amber-400">
      <XCircle className="h-3 w-3" /> worker needs redeploy
    </Badge>
  );
}
