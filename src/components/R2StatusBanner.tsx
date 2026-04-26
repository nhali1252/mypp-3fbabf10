import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, AlertTriangle, Loader2, Database, RefreshCw } from "lucide-react";
import { getBasicR2Status } from "@/server/basic-status.functions";

export function R2StatusBanner() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["basic-r2-status"],
    queryFn: () => getBasicR2Status(),
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card/60 p-4 flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking storage connection…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-300">
        <div className="flex items-center gap-2 font-bold">
          <AlertTriangle className="h-4 w-4" /> Status check failed
        </div>
        <p className="mt-1 text-xs opacity-90">
          {(error as Error)?.message ?? "Unknown error"}
        </p>
      </div>
    );
  }

  const ok = data.connection.ok;
  const tone = ok
    ? "border-emerald-500/40 bg-emerald-500/10"
    : "border-rose-500/40 bg-rose-500/10";
  const Icon = ok ? CheckCircle2 : AlertTriangle;
  const iconColor = ok ? "text-emerald-400" : "text-rose-400";

  return (
    <div className={`rounded-2xl border ${tone} p-4 sm:p-5`}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3 min-w-0">
          <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${iconColor}`} aria-hidden />
          <div className="min-w-0">
            <p className="text-sm font-bold uppercase tracking-[0.18em]">
              {ok ? "Storage connected" : "Storage unreachable"}
            </p>
            <p className="mt-1 text-xs text-foreground/80">
              {ok ? (
                <>
                  Credentials verified against{" "}
                  <code className="font-mono text-[11px] px-1 rounded bg-background/60">
                    {data.connection.bucket ?? "—"}
                  </code>{" "}
                  on{" "}
                  <code className="font-mono text-[11px] px-1 rounded bg-background/60">
                    {data.connection.endpointHost ?? "—"}
                  </code>
                  {data.connection.accessKeyPrefix && (
                    <>
                      {" "}
                      using key{" "}
                      <code className="font-mono text-[11px] px-1 rounded bg-background/60">
                        {data.connection.accessKeyPrefix}
                      </code>
                    </>
                  )}
                  .
                </>
              ) : (
                <>
                  Could not authenticate to{" "}
                  <code className="font-mono text-[11px] px-1 rounded bg-background/60">
                    {data.connection.bucket ?? "(no bucket)"}
                  </code>
                  . Sections below will fall back to defaults.
                </>
              )}
            </p>
            {!ok && data.connection.error && (
              <pre className="mt-2 text-[11px] font-mono whitespace-pre-wrap break-all p-2 rounded-lg bg-black/30 border border-rose-500/30 text-rose-100/90 max-h-32 overflow-auto">
                {data.connection.error}
              </pre>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-background/40 text-[11px] font-bold uppercase tracking-[0.18em] hover:bg-background/70 disabled:opacity-60 transition-colors shrink-0"
        >
          {isFetching ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          Refresh
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
        {data.sections.map((s) => (
          <div
            key={s.key}
            className={`rounded-xl border p-3 flex items-center gap-3 ${
              s.ok
                ? "border-border bg-background/40"
                : "border-rose-500/30 bg-rose-500/5"
            }`}
          >
            <Database
              className={`h-4 w-4 shrink-0 ${
                s.ok ? "text-muted-foreground" : "text-rose-400"
              }`}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                {s.label}
              </div>
              <div className="text-base font-black tracking-tight">
                {s.ok ? (
                  <>
                    {s.count}
                    <span className="ml-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      loaded
                    </span>
                  </>
                ) : (
                  <span className="text-rose-400 text-sm">Failed</span>
                )}
              </div>
              {!s.ok && s.error && (
                <div className="mt-1 text-[10px] text-rose-300/90 font-mono break-all line-clamp-2">
                  {s.error}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        Checked {new Date(data.checkedAt).toLocaleTimeString()} · {data.durationMs}ms
      </p>
    </div>
  );
}
