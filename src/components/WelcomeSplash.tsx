import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { AlertTriangle, Inbox, RefreshCw, Sparkles } from "lucide-react";

type Status = "loading" | "error" | "empty";

type Props = {
  /** How long the splash stays visible before fading out (ms). */
  durationMs?: number;
  /** Top eyebrow line. */
  eyebrow?: string;
  /** Big welcome word. */
  title?: string;
  /** Sub-line under the title. */
  subtitle?: string;
  /**
   * Controlled visibility. When provided, overrides the session-storage
   * auto behavior — caller decides when the splash appears.
   */
  show?: boolean;
  /** Called when the splash finishes fading out. */
  onDone?: () => void;
  /**
   * What to render inside the splash.
   * - "loading" (default): animated loading bar
   * - "error": friendly error message + retry button
   * - "empty": friendly empty-state message
   */
  status?: Status;
  /** Error message shown in the error state. */
  errorMessage?: string;
  /** Click handler for the Retry button (error state). */
  onRetry?: () => void;
  /** Click handler for the dismiss button (empty/error states). */
  onDismiss?: () => void;
};

/**
 * Full-screen welcome splash. By default shows once per browser session
 * on mount. Pass `show` to control it imperatively, and `status` to render
 * the loading, error, or empty variant.
 */
export function WelcomeSplash({
  durationMs = 2200,
  eyebrow = "Portfolio",
  title = "Welcome",
  subtitle = "Ali Nur Hasan",
  show,
  onDone,
  status = "loading",
  errorMessage,
  onRetry,
  onDismiss,
}: Props) {
  const controlled = show !== undefined;
  const [mounted, setMounted] = useState(false);
  const [autoVisible, setAutoVisible] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    setMounted(true);
    if (controlled) return;
    let shouldShow = true;
    try {
      if (sessionStorage.getItem("welcomeSplash.seen") === "1") {
        shouldShow = false;
      } else {
        sessionStorage.setItem("welcomeSplash.seen", "1");
      }
    } catch {
      /* ignore storage errors */
    }
    if (!shouldShow) return;
    setAutoVisible(true);
    // Only auto-dismiss in the loading state. Error/empty stay until
    // the user retries or dismisses.
    if (status !== "loading") return;
    const t = setTimeout(() => {
      setAutoVisible(false);
      onDone?.();
    }, reduce ? 600 : durationMs);
    return () => clearTimeout(t);
  }, [durationMs, reduce, controlled, onDone, status]);

  const visible = controlled ? !!show : autoVisible;

  if (!mounted) return null;

  const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

  const isError = status === "error";
  const isEmpty = status === "empty";
  const isInteractive = isError || isEmpty;

  const headlineTitle = isError ? "Something went wrong" : isEmpty ? "Nothing here yet" : title;
  const headlineSub = isError
    ? errorMessage || "We couldn't load the homepage right now. Please try again."
    : isEmpty
      ? "The homepage doesn't have any cards to show yet."
      : subtitle;
  const headlineEyebrow = isError ? "Error" : isEmpty ? "Empty" : eyebrow;

  const Icon = isError ? AlertTriangle : isEmpty ? Inbox : Sparkles;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="welcome-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-background overflow-hidden"
          aria-hidden={isInteractive ? undefined : "true"}
          role={isInteractive ? "alertdialog" : undefined}
        >
          {/* Ambient gradient glows */}
          <div
            className="pointer-events-none absolute -top-40 -left-40 w-[640px] h-[640px] rounded-full blur-[140px] opacity-40"
            style={{
              background: isError
                ? "radial-gradient(circle, color-mix(in oklab, var(--destructive, #ef4444) 70%, transparent) 0%, transparent 70%)"
                : "radial-gradient(circle, color-mix(in oklab, var(--primary) 70%, transparent) 0%, transparent 70%)",
            }}
          />
          <div
            className="pointer-events-none absolute -bottom-40 -right-40 w-[560px] h-[560px] rounded-full blur-[120px] opacity-30"
            style={{
              background:
                "radial-gradient(circle, color-mix(in oklab, var(--accent, var(--primary)) 60%, transparent) 0%, transparent 70%)",
            }}
          />

          <div className="relative flex flex-col items-center text-center px-6 max-w-xl">
            <motion.span
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease }}
              className={`inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.4em] mb-5 ${
                isError ? "text-destructive" : "text-primary"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {headlineEyebrow}
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 24, letterSpacing: "0.2em" }}
              animate={{ opacity: 1, y: 0, letterSpacing: "-0.02em" }}
              transition={{ duration: 0.9, ease, delay: 0.05 }}
              className="font-black leading-[1]"
              style={{
                fontSize: isInteractive
                  ? "clamp(36px, 7vw, 72px)"
                  : "clamp(56px, 12vw, 140px)",
              }}
            >
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: isError
                    ? "linear-gradient(110deg, var(--foreground) 0%, var(--destructive, #ef4444) 100%)"
                    : "linear-gradient(110deg, var(--foreground) 0%, color-mix(in oklab, var(--primary) 80%, var(--foreground)) 55%, var(--primary) 100%)",
                }}
              >
                {headlineTitle}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease, delay: 0.25 }}
              className="mt-5 text-sm sm:text-base text-muted-foreground tracking-wide leading-relaxed"
            >
              {headlineSub}
            </motion.p>

            {status === "loading" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="mt-10 h-[2px] w-48 sm:w-64 rounded-full overflow-hidden bg-foreground/10"
              >
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{
                    duration: Math.max(0.8, durationMs / 1000 - 0.3),
                    ease: "easeInOut",
                  }}
                  className="h-full w-1/2 bg-gradient-to-r from-transparent via-primary to-transparent"
                />
              </motion.div>
            )}

            {isInteractive && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease, delay: 0.35 }}
                className="mt-9 flex flex-wrap items-center justify-center gap-3"
              >
                {onRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-2.5 text-sm font-semibold shadow-[0_10px_30px_-10px_color-mix(in_oklab,var(--primary)_60%,transparent)] hover:opacity-95 transition-opacity"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try again
                  </button>
                )}
                {onDismiss && (
                  <button
                    type="button"
                    onClick={onDismiss}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-card text-foreground px-6 py-2.5 text-sm font-semibold hover:border-primary/60 hover:text-primary transition-colors"
                  >
                    Continue anyway
                  </button>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
