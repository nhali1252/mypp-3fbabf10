import { Outlet, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Smooth cross-fade between routes. Keyed by pathname so each new page
 * mounts fresh; framer-motion + AnimatePresence(mode="wait") makes the
 * outgoing page finish exiting before the new one enters → no overlap,
 * no jank. Honors prefers-reduced-motion via the global MotionConfig
 * provider in __root.tsx (skips transforms automatically).
 *
 * Scroll restoration is handled by the router (`scrollRestoration: true`
 * in src/router.tsx), so we don't manually scroll here — that lets the
 * browser back button restore prior positions correctly.
 */
export function RouteTransition() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{
          duration: 0.32,
          ease: [0.22, 1, 0.36, 1],
        }}
        style={{ willChange: "opacity, transform" }}
        className="min-h-screen"
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
}
