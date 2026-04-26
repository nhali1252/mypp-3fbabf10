/**
 * Persistent alert shown above admin content when R2 auto-resync has failed
 * repeatedly. Includes the last error message, the affected R2 doc scope,
 * a one-click retry, and a dismiss action. Hidden when failures < threshold.
 */
import { useState } from "react";
import { AlertTriangle, RefreshCw, X, ChevronDown, Loader2 } from "lucide-react";
import {
  FAILURE_ALERT_THRESHOLD,
  type useR2AutoResync,
} from "@/hooks/useR2AutoResync";

export default function R2SyncAlert({
  sync,
}: {
  sync: ReturnType<typeof useR2AutoResync>;
}) {
  const {
    consecutiveFailures,
    error,
    lastFailedScope,
    failureHistory,
    retry,
    dismissFailures,
    status,
    retryCooldownRemaining,
    canRetry,
  } = sync;

  const [open, setOpen] = useState(false);
  const [retrying, setRetrying] = useState(false);

  if (consecutiveFailures < FAILURE_ALERT_THRESHOLD) return null;

  const onRetry = async () => {
    if (!canRetry || retrying) return;
    setRetrying(true);
    try {
      await retry();
    } finally {
      setRetrying(false);
    }
  };

  const fmt = (d: Date) => {
    const s = Math.round((Date.now() - d.getTime()) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.round(s / 60)}m ago`;
    return d.toLocaleTimeString();
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="mb-4 rounded-2xl border border-destructive/40 bg-destructive/10 text-destructive"
    >
      <div className="flex items-start gap-3 p-4">
        <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm">
            R2 auto-resync is failing — public site may be stale
          </div>
          <p className="text-xs mt-1 opacity-90">
            <strong>{consecutiveFailures}</strong> consecutive failure
            {consecutiveFailures === 1 ? "" : "s"}.{" "}
            {lastFailedScope.length > 0 && (
              <>
                Affected docs:{" "}
                <code className="text-[11px]">{lastFailedScope.join(", ")}</code>
                .{" "}
              </>
            )}
            Latest error:{" "}
            <span className="font-mono text-[11px] break-all">
              {error ?? "Unknown error"}
            </span>
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            <button
              onClick={onRetry}
              disabled={retrying || status === "syncing"}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-semibold hover:opacity-90 disabled:opacity-60"
            >
              {retrying || status === "syncing" ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Retrying…
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" /> Retry now
                </>
              )}
            </button>
            <button
              onClick={dismissFailures}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-destructive/40 text-xs font-medium hover:bg-destructive/15"
            >
              <X className="w-3.5 h-3.5" /> Dismiss
            </button>
            {failureHistory.length > 0 && (
              <button
                onClick={() => setOpen((v) => !v)}
                className="inline-flex items-center gap-1 px-2 py-1.5 text-xs opacity-80 hover:opacity-100"
              >
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
                />
                Recent failures ({failureHistory.length})
              </button>
            )}
          </div>

          {open && failureHistory.length > 0 && (
            <ul className="mt-3 space-y-1.5 text-[11px] font-mono">
              {failureHistory.map((f, i) => (
                <li
                  key={i}
                  className="rounded-md bg-background/40 px-2 py-1.5 break-all"
                >
                  <span className="opacity-60">{fmt(f.at)}</span>
                  {f.scope.length > 0 && (
                    <span className="opacity-60"> · [{f.scope.join(", ")}]</span>
                  )}
                  <div>{f.message}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
