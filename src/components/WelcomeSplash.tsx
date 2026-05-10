import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

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
};

/**
 * Full-screen welcome splash. By default shows once per browser session
 * on mount. Pass `show` to control it imperatively (e.g. on manual refresh).
 */
export function WelcomeSplash({
  durationMs = 2200,
  eyebrow = "Portfolio",
  title = "Welcome",
  subtitle = "Ali Nur Hasan",
  show,
  onDone,
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
    const t = setTimeout(() => {
      setAutoVisible(false);
      onDone?.();
    }, reduce ? 600 : durationMs);
    return () => clearTimeout(t);
  }, [durationMs, reduce, controlled, onDone]);

  const visible = controlled ? !!show : autoVisible;

  if (!mounted) return null;

  const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="welcome-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-background overflow-hidden"
          aria-hidden="true"
        >
          {/* Ambient gradient glows */}
          <div
            className="pointer-events-none absolute -top-40 -left-40 w-[640px] h-[640px] rounded-full blur-[140px] opacity-40"
            style={{
              background:
                "radial-gradient(circle, color-mix(in oklab, var(--primary) 70%, transparent) 0%, transparent 70%)",
            }}
          />
          <div
            className="pointer-events-none absolute -bottom-40 -right-40 w-[560px] h-[560px] rounded-full blur-[120px] opacity-30"
            style={{
              background:
                "radial-gradient(circle, color-mix(in oklab, var(--accent, var(--primary)) 60%, transparent) 0%, transparent 70%)",
            }}
          />

          <div className="relative flex flex-col items-center text-center px-6">
            <motion.span
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease }}
              className="text-[11px] font-bold uppercase tracking-[0.4em] text-primary mb-5"
            >
              {eyebrow}
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 24, letterSpacing: "0.2em" }}
              animate={{ opacity: 1, y: 0, letterSpacing: "-0.02em" }}
              transition={{ duration: 0.9, ease, delay: 0.05 }}
              className="font-black leading-[1]"
              style={{ fontSize: "clamp(56px, 12vw, 140px)" }}
            >
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(110deg, var(--foreground) 0%, color-mix(in oklab, var(--primary) 80%, var(--foreground)) 55%, var(--primary) 100%)",
                }}
              >
                {title}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease, delay: 0.25 }}
              className="mt-5 text-sm sm:text-base text-muted-foreground tracking-wide"
            >
              {subtitle}
            </motion.p>

            {/* Loading bar */}
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
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
