import { useEffect } from "react";
import { useLocation } from "@tanstack/react-router";
import { useHeadingShimmer } from "@/hooks/useHeadingShimmer";

/**
 * Applies admin-tuned heading shimmer settings to :root as CSS variables
 * and toggles the global kill-switch attribute on <html>. The kill-switch
 * fires either when shimmer is globally disabled OR when the current
 * pathname matches an entry in `disabled_paths`.
 */
export function HeadingShimmerVars() {
  const { data } = useHeadingShimmer();
  const { pathname } = useLocation();

  const pageDisabled = data.disabled_paths.some(
    (p) => p && (pathname === p || pathname.startsWith(p + "/")),
  );
  const off = !data.enabled || pageDisabled;

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.style.setProperty("--shimmer-sweep-size", `${data.sweep_size}%`);
    root.style.setProperty("--shimmer-speed", `${data.speed_ms}ms`);
    root.style.setProperty("--shimmer-intensity", `${data.intensity}%`);
    if (off) root.setAttribute("data-shimmer", "off");
    else root.removeAttribute("data-shimmer");
  }, [data.sweep_size, data.speed_ms, data.intensity, off]);

  return null;
}
