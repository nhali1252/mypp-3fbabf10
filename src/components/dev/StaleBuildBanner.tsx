import { useEffect, useState, useCallback } from "react";
import { AlertTriangle, RefreshCw, X, Terminal } from "lucide-react";

/**
 * StaleBuildBanner
 * ----------------
 * Detects a stale dev build / HMR state where the bundle running in the
 * browser references identifiers that no longer exist (or were renamed) in
 * source — even though `tsc` and the editor look clean. Symptoms include:
 *
 *   • ReferenceError: X is not defined
 *   • Cannot find name 'X' (rare at runtime, surfaces via overlay)
 *   • Failed to fetch dynamically imported module
 *   • [vite] hmr update / error events
 *
 * When detected, we surface a fixed banner with two clear actions:
 *   1. Reload the page (clears stale module cache in the browser)
 *   2. Restart the dev server (link with copy-to-clipboard command)
 *
 * Renders only in development (import.meta.env.DEV) to avoid shipping noise
 * to production. Self-hosted state, no providers required.
 */
export function StaleBuildBanner() {
  const [reason, setReason] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const trigger = useCallback((msg: string) => {
    setReason((cur) => cur ?? msg);
    setDismissed(false);
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const STALE_PATTERNS = [
      /Cannot find name ['"]([\w$]+)['"]/i,
      /([\w$]+) is not defined/i,
      /Failed to fetch dynamically imported module/i,
      /Failed to resolve module specifier/i,
      /Importing binding name ['"]([\w$]+)['"] is not found/i,
      /The requested module .* does not provide an export named/i,
    ];

    const matchStale = (msg: string): string | null => {
      for (const p of STALE_PATTERNS) {
        const m = msg.match(p);
        if (m) return m[0];
      }
      return null;
    };

    const onError = (e: ErrorEvent) => {
      const msg = e.error?.message ?? e.message ?? "";
      const hit = matchStale(String(msg));
      if (hit) trigger(hit);
    };

    const onRejection = (e: PromiseRejectionEvent) => {
      const msg = (e.reason && (e.reason.message ?? String(e.reason))) || "";
      const hit = matchStale(String(msg));
      if (hit) trigger(hit);
    };

    // Vite emits a custom event on its WebSocket client when a build/HMR error
    // is reported. We listen on `import.meta.hot` if available.
    const hot = (import.meta as any).hot;
    const onViteError = (payload: any) => {
      const msg = payload?.err?.message ?? payload?.message ?? "Vite build error";
      trigger(String(msg));
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    hot?.on?.("vite:error", onViteError);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      hot?.off?.("vite:error", onViteError);
    };
  }, [trigger]);

  if (!import.meta.env.DEV) return null;
  if (!reason || dismissed) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-4 left-1/2 z-[200] -translate-x-1/2 w-[min(680px,calc(100vw-2rem))] rounded-2xl border border-amber-500/40 bg-amber-500/10 backdrop-blur-md shadow-2xl text-foreground"
    >
      <div className="flex items-start gap-3 p-4">
        <div className="shrink-0 mt-0.5 h-9 w-9 rounded-full bg-amber-500/20 grid place-items-center">
          <AlertTriangle className="h-4 w-4 text-amber-400" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold tracking-tight">
            Stale dev build detected
          </p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            The browser bundle references something that no longer exists in
            source. Your editor and <code className="px-1 rounded bg-background/60 font-mono">tsc</code> may
            look fine — the dev server just needs to refresh its module graph.
          </p>
          <p className="mt-2 text-[11px] font-mono text-amber-300/90 break-all line-clamp-2">
            {reason}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500 text-amber-950 text-[11px] font-bold uppercase tracking-[0.18em] hover:bg-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 transition-colors"
            >
              <RefreshCw className="h-3 w-3" aria-hidden="true" /> Reload page
            </button>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText("bun run dev").catch(() => {});
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-background/60 text-[11px] font-bold uppercase tracking-[0.18em] hover:border-amber-400 transition-colors"
              title="Copy 'bun run dev' to clipboard"
            >
              <Terminal className="h-3 w-3" aria-hidden="true" /> Copy restart cmd
            </button>
            <span className="text-[10px] text-muted-foreground">
              If reload doesn't help, restart the dev server.
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss banner"
          className="shrink-0 h-8 w-8 grid place-items-center rounded-full hover:bg-background/60 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
