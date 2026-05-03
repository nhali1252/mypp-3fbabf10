import { useEffect, useRef } from "react";
import { Outlet, useRouterState } from "@tanstack/react-router";

/**
 * Smooth fade-in for each new route. Uses a keyed wrapper so only the
 * incoming page animates — no out→in flicker, no double-page overlap.
 * Also resets scroll on actual path changes (not on hash-only changes).
 */
export function RouteTransition() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const last = useRef(pathname);

  useEffect(() => {
    if (last.current === pathname) return;
    last.current = pathname;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);

  return (
    <div key={pathname} className="route-fade-in min-h-screen">
      <Outlet />
      <style>{`
        @keyframes routeFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .route-fade-in {
          animation: routeFadeIn 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
          will-change: opacity, transform;
        }
        @media (prefers-reduced-motion: reduce) {
          .route-fade-in { animation: none; }
        }
      `}</style>
    </div>
  );
}
