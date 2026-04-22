import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * Premium TasTaj brand loader — shows on first paint, fades out gracefully.
 * Logo wordmark + animated gold underline reveal.
 */
export function PageLoader({ minDurationMs = 1100 }: { minDurationMs?: number }) {
  const [show, setShow] = useState(true);
  const reduce = useReducedMotion();

  useEffect(() => {
    const start = performance.now();
    const finish = () => {
      const elapsed = performance.now() - start;
      const wait = Math.max(0, minDurationMs - elapsed);
      window.setTimeout(() => setShow(false), wait);
    };
    if (document.readyState === "complete") {
      finish();
    } else {
      window.addEventListener("load", finish, { once: true });
      // Safety net so loader never sticks if `load` never fires.
      const safety = window.setTimeout(finish, minDurationMs + 1500);
      return () => {
        window.removeEventListener("load", finish);
        window.clearTimeout(safety);
      };
    }
  }, [minDurationMs]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="page-loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[9999] grid place-items-center bg-background"
          aria-hidden
        >
          {/* Soft radial gold glow */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 50% at 50% 50%, oklch(0.72 0.07 78 / 0.10), transparent 70%)",
            }}
          />

          <div className="relative flex flex-col items-center">
            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14, filter: "blur(8px)" }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="font-serif-display italic text-5xl md:text-6xl tracking-tight select-none"
            >
              <span className="text-foreground">Tas</span>
              <span className="bg-gradient-to-r from-[oklch(0.82_0.09_82)] to-[oklch(0.66_0.07_70)] bg-clip-text text-transparent">
                Taj
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25, ease: "easeOut" }}
              className="mt-3 text-[10px] md:text-[11px] tracking-[0.42em] uppercase text-muted-foreground"
            >
              Designing&nbsp;Timeless&nbsp;Visual&nbsp;Stories
            </motion.div>

            {/* Underline reveal */}
            <div className="relative mt-6 h-[2px] w-44 md:w-56 overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                initial={{ x: "-110%" }}
                animate={reduce ? { x: 0 } : { x: ["-110%", "0%", "110%"] }}
                transition={{
                  duration: 1.6,
                  ease: [0.65, 0, 0.35, 1],
                  repeat: reduce ? 0 : Infinity,
                }}
                className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-[oklch(0.78_0.08_80)] to-transparent"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
