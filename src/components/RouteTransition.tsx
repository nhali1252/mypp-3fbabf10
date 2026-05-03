import { Outlet, useRouterState } from "@tanstack/react-router";

/**
 * Smooth fade-in for each new route. Uses a keyed wrapper so only the
 * incoming page animates — no out→in flicker, no double-page overlap.
 */
export function RouteTransition() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

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
