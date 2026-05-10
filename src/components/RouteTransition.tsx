import { useEffect, useRef } from "react";
import { Outlet, useRouterState } from "@tanstack/react-router";

/**
 * Per-route enter animation. Keyed by pathname so the wrapper remounts
 * on every page change → CSS keyframe replays. We deliberately do NOT
 * use AnimatePresence with mode="wait" here because TanStack's <Outlet/>
 * always renders the currently matched route — wrapping it in an exiting
 * AnimatePresence child would show the NEW route's content while the old
 * wrapper fades out, causing the "double page" flicker.
 *
 * Scroll position is handled by the router (`scrollRestoration: true`)
 * so back/forward buttons restore correctly. We force a hard top-scroll
 * on forward navigation only, to feel snappy.
 */
export function RouteTransition() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const last = useRef(pathname);

  useEffect(() => {
    if (last.current === pathname) return;
    last.current = pathname;
    // Router handles scroll restoration on POP; this only fires on PUSH/replace.
  }, [pathname]);

  return (
    <div key={pathname} className="route-fade-in min-h-screen">
      <Outlet />
      <style>{`
        @keyframes routeFadeIn {
          from { opacity: 0; transform: translate3d(0, 6px, 0); }
          to   { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        .route-fade-in {
          animation: routeFadeIn 280ms cubic-bezier(0.22, 1, 0.36, 1) both;
          transform-origin: top center;
          backface-visibility: hidden;
        }
        @media (prefers-reduced-motion: reduce) {
          .route-fade-in { animation: none; }
        }
      `}</style>
    </div>
  );
}
