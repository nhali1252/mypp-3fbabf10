/**
 * Shared loading + error UI for content sections that read from R2.
 *
 * - <SectionSkeleton />: animated placeholder cards while data is loading
 * - <SectionError />: clear, actionable error message with a retry button
 * - <SectionEmpty />: friendly notice when the fetch succeeded but returned no items
 */
import { AlertTriangle, RefreshCw, Inbox, Loader2, Settings2 } from "lucide-react";
import { useState } from "react";

/**
 * Detect the specific "missing server env var" failure so we can show a
 * friendly fallback that points the admin straight to the fix screen
 * instead of a scary stack trace.
 */
function detectMissingEnvVar(message: string): string | null {
  // Matches the server-side error from src/integrations/supabase/client.server.ts
  // e.g. "Missing Supabase server environment variables. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set."
  if (!/Missing\s+Supabase\s+server\s+environment\s+variables/i.test(message)) {
    return null;
  }
  const known = [
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_URL",
    "SUPABASE_PUBLISHABLE_KEY",
  ];
  const found = known.filter((name) => message.includes(name));
  return found.length ? found.join(", ") : "SUPABASE_SERVICE_ROLE_KEY";
}

export function SectionSkeleton({
  count = 3,
  cols = 1,
  label = "Loading…",
}: {
  count?: number;
  cols?: 1 | 2 | 3 | 4;
  label?: string;
}) {
  const colsCls =
    cols === 4
      ? "md:grid-cols-2 lg:grid-cols-4"
      : cols === 3
      ? "md:grid-cols-3"
      : cols === 2
      ? "md:grid-cols-2"
      : "";
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      <div className={`grid gap-4 ${colsCls}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="rounded-[22px] border border-white/5 bg-gradient-card p-7 overflow-hidden relative"
          >
            <div className="h-4 w-1/3 rounded bg-white/10 animate-pulse" />
            <div className="mt-4 h-3 w-full rounded bg-white/5 animate-pulse" />
            <div className="mt-2 h-3 w-5/6 rounded bg-white/5 animate-pulse" />
            <div className="mt-2 h-3 w-2/3 rounded bg-white/5 animate-pulse" />
            <div
              aria-hidden
              className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.04] to-transparent animate-[shimmer_1.6s_infinite]"
              style={{ animation: "shimmer 1.6s linear infinite" }}
            />
          </div>
        ))}
      </div>
      <style>{`@keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}`}</style>
    </div>
  );
}

export function SectionError({
  title = "Couldn't load this section",
  error,
  onRetry,
  hint,
}: {
  title?: string;
  error?: unknown;
  onRetry?: () => void | Promise<unknown>;
  hint?: string;
}) {
  const [retrying, setRetrying] = useState(false);
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
      ? error
      : "The storage backend didn't respond. This is usually temporary.";

  const missingEnv = detectMissingEnvVar(message);

  async function handleRetry() {
    if (!onRetry || retrying) return;
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  }

  return (
    <div
      role="alert"
      className="rounded-[22px] border border-rose-500/30 bg-rose-500/[0.06] p-6 sm:p-7"
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-2xl bg-rose-500/15 grid place-items-center">
          <AlertTriangle className="h-5 w-5 text-rose-400" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base text-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            {hint ?? "We couldn't reach the content storage. The page is fine — just this section needs a retry."}
          </p>
          <details className="mt-2 group">
            <summary className="text-[11px] uppercase tracking-[0.18em] font-bold text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors">
              Technical details
            </summary>
            <pre className="mt-2 text-[11px] font-mono whitespace-pre-wrap break-all p-3 rounded-lg bg-black/30 border border-rose-500/20 text-rose-100/90 max-h-32 overflow-auto">
              {message}
            </pre>
          </details>
          {onRetry && (
            <button
              type="button"
              onClick={handleRetry}
              disabled={retrying}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-[0.2em] hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {retrying ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              {retrying ? "Retrying…" : "Retry"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function SectionEmpty({
  title = "Nothing here yet",
  hint = "Content for this section hasn't been published.",
}: {
  title?: string;
  hint?: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/5 bg-gradient-card p-7 text-center">
      <div className="mx-auto w-10 h-10 rounded-2xl bg-white/5 grid place-items-center">
        <Inbox className="h-5 w-5 text-muted-foreground" aria-hidden />
      </div>
      <h3 className="mt-3 font-bold text-base text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}
