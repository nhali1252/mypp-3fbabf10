import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Loader2, CheckCircle2, AlertTriangle, KeyRound, Server } from "lucide-react";
import { toast } from "sonner";
import { reinitializeR2, r2Status } from "@/server/r2-admin.functions";

export const Route = createFileRoute("/_admin/admin/runtime")({
  component: RuntimePage,
  head: () => ({ meta: [{ title: "Runtime — Admin" }] }),
});

function fmtAge(ms: number | null) {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${Math.round(ms / 1000)}s ago`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)} min ago`;
  return `${Math.round(ms / 3_600_000)} h ago`;
}

function RuntimePage() {
  const qc = useQueryClient();
  const [lastResult, setLastResult] = useState<any>(null);

  const status = useQuery({
    queryKey: ["r2-status"],
    queryFn: () => r2Status(),
    refetchOnWindowFocus: false,
  });

  const reinit = useMutation({
    mutationFn: () => reinitializeR2(),
    onSuccess: (res: any) => {
      setLastResult(res);
      qc.invalidateQueries({ queryKey: ["r2-status"] });
      if (res.ok) {
        toast.success("R2 client reinitialized", {
          description: `New credentials verified in ${res.durationMs}ms.`,
        });
      } else {
        toast.error("Reinitialization failed", {
          description: res.probe?.error ?? "Probe failed",
        });
      }
    },
    onError: (e: any) =>
      toast.error("Reinitialization failed", { description: e?.message ?? "Unknown error" }),
  });

  useEffect(() => {
    // Refresh status when page mounts
    qc.invalidateQueries({ queryKey: ["r2-status"] });
  }, [qc]);

  const info = status.data?.info;
  const env = status.data?.env;
  const allEnvSet = env && env.hasEndpoint && env.hasAccessKey && env.hasSecret && env.hasBucket;

  return (
    <div className="space-y-6 max-w-3xl">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Runtime</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Apply updated R2 credentials without redeploying. Reinitialization
            drops the cached storage client and verifies the new keys with a
            probe before traffic hits them.
          </p>
        </div>
        <button
          type="button"
          onClick={() => reinit.mutate()}
          disabled={reinit.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-[0.2em] hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {reinit.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Reinitialize R2
        </button>
      </header>

      {/* Env presence */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-2">
          <KeyRound className="h-4 w-4" /> Environment
        </h2>
        {status.isLoading ? (
          <p className="mt-3 text-xs text-muted-foreground">Checking…</p>
        ) : status.error ? (
          <p className="mt-3 text-xs text-rose-400">{(status.error as Error).message}</p>
        ) : (
          <>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <EnvPill label="R2_ENDPOINT" ok={!!env?.hasEndpoint} />
              <EnvPill label="R2_ACCESS_KEY_ID" ok={!!env?.hasAccessKey} />
              <EnvPill label="R2_SECRET_ACCESS_KEY" ok={!!env?.hasSecret} />
              <EnvPill label="R2_BUCKET" ok={!!env?.hasBucket} />
              <EnvPill label="R2_PUBLIC_BASE_URL" ok={!!env?.hasPublicBase} />
            </div>
            {!allEnvSet && (
              <p className="mt-3 text-[11px] text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                One or more required R2 env vars are missing. Set them in
                project secrets, then reinitialize.
              </p>
            )}
          </>
        )}
      </section>

      {/* Cached client */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-2">
          <Server className="h-4 w-4" /> Cached client
        </h2>
        <dl className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
          <Row label="Initialized" value={info?.initialized ? "Yes" : "No"} />
          <Row label="Age" value={fmtAge(info?.ageMs ?? null)} />
          <Row label="Cached fingerprint" value={info?.fingerprint ?? "—"} mono />
          <Row label="Current env fingerprint" value={info?.envFingerprint ?? "—"} mono />
        </dl>
        {info?.initialized &&
          info.fingerprint &&
          info.fingerprint !== info.envFingerprint && (
            <p className="mt-3 text-[11px] text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              Cached client was built with different credentials than the
              current env. Reinitialize to apply the new values.
            </p>
          )}
      </section>

      {/* Last reinit result */}
      {lastResult && (
        <section
          className={`rounded-2xl border p-5 ${
            lastResult.ok
              ? "border-emerald-500/40 bg-emerald-500/10"
              : "border-rose-500/40 bg-rose-500/10"
          }`}
        >
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] flex items-center gap-2">
            {lastResult.ok ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-400" />
            )}
            Last reinitialization
          </h2>
          <dl className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
            <Row label="When" value={new Date(lastResult.reinitializedAt).toLocaleString()} />
            <Row label="Duration" value={`${lastResult.durationMs}ms`} />
            <Row
              label="Probe"
              value={
                lastResult.probe?.ok
                  ? `OK (${lastResult.probe.sampleObjectCount ?? 0} sample objects)`
                  : "Failed"
              }
            />
            <Row label="Previous client age" value={fmtAge(lastResult.previous?.previousAgeMs ?? null)} />
            <Row label="Previous fingerprint" value={lastResult.previous?.previousFingerprint ?? "—"} mono />
            <Row label="New fingerprint" value={lastResult.current?.fingerprint ?? "—"} mono />
          </dl>
          {!lastResult.ok && lastResult.probe?.error && (
            <pre className="mt-3 text-[11px] font-mono whitespace-pre-wrap break-all p-3 rounded-lg bg-black/40 border border-rose-500/30 text-rose-100/90">
              {lastResult.probe.error}
            </pre>
          )}
        </section>
      )}

      <p className="text-[11px] text-muted-foreground">
        Note: this resets the in-memory R2 client only on the server instance
        that handles the request. If your deployment runs multiple isolated
        instances, those will pick up the new credentials lazily on their next
        cold start. For a guaranteed full restart, redeploy.
      </p>
    </div>
  );
}

function EnvPill({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-mono ${
        ok
          ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300"
          : "border-rose-500/30 bg-rose-500/5 text-rose-300"
      }`}
    >
      {ok ? (
        <CheckCircle2 className="h-3 w-3 shrink-0" />
      ) : (
        <AlertTriangle className="h-3 w-3 shrink-0" />
      )}
      <span className="truncate">{label}</span>
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/40 pb-1.5">
      <dt className="text-muted-foreground uppercase tracking-[0.16em] font-bold text-[10px] mt-0.5">
        {label}
      </dt>
      <dd className={`text-right break-all max-w-[60%] ${mono ? "font-mono" : ""}`}>
        {value || "—"}
      </dd>
    </div>
  );
}
