import { useEffect, useRef, useState } from "react";
import { Outlet, useRouterState } from "@tanstack/react-router";

/**
 * Buttery page transition wrapper.
 * Fades + lifts content on every route change for a professional feel.
 */
export function RouteTransition() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [stage, setStage] = useState<"in" | "out">("in");
  const last = useRef(pathname);

  useEffect(() => {
    if (last.current === pathname) return;
    last.current = pathname;
    setStage("out");
    const t = window.setTimeout(() => setStage("in"), 80);
    return () => window.clearTimeout(t);
  }, [pathname]);

  return (
    <div
      key={pathname}
      className={`min-h-screen transition-all duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[opacity,transform] ${
        stage === "in" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1.5"
      }`}
    >
      <Outlet />
    </div>
  );
}
