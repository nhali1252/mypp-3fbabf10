import { useEffect, useRef, useState } from "react";
import { Outlet, useRouterState } from "@tanstack/react-router";

/**
 * Smooth, snappy page transition wrapper.
 * Same easing + duration on every route shift so it feels consistent.
 */
export function RouteTransition() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [stage, setStage] = useState<"in" | "out">("in");
  const last = useRef(pathname);

  useEffect(() => {
    if (last.current === pathname) return;
    last.current = pathname;
    setStage("out");
    const t = window.setTimeout(() => setStage("in"), 20);
    return () => window.clearTimeout(t);
  }, [pathname]);

  return (
    <div
      key={pathname}
      className={`min-h-screen transition-[opacity,transform] duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[opacity,transform] ${
        stage === "in" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
      }`}
    >
      <Outlet />
    </div>
  );
}
