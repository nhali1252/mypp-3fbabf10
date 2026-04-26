import { useEffect, useRef, useState } from "react";
import { Outlet, useRouterState } from "@tanstack/react-router";

/**
 * Smooth cross-fade page transition between routes.
 * Slightly longer + with a subtle scale for a "premium" feel.
 */
export function RouteTransition() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [stage, setStage] = useState<"in" | "out">("in");
  const last = useRef(pathname);

  useEffect(() => {
    if (last.current === pathname) return;
    last.current = pathname;
    setStage("out");
    const t = window.setTimeout(() => setStage("in"), 60);
    // also scroll to top on route change for a clean entry
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    return () => window.clearTimeout(t);
  }, [pathname]);

  return (
    <div
      key={pathname}
      className={`min-h-screen transition-[opacity,transform,filter] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[opacity,transform,filter] ${
        stage === "in"
          ? "opacity-100 translate-y-0 scale-100 blur-0"
          : "opacity-0 translate-y-2 scale-[0.995] blur-[2px]"
      }`}
    >
      <Outlet />
    </div>
  );
}
