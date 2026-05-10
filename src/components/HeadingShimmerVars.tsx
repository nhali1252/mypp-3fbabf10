import { useEffect } from "react";
import { useHeadingShimmer } from "@/hooks/useHeadingShimmer";

/**
 * Applies the admin-tuned heading shimmer settings to :root as CSS
 * variables, and toggles the global kill-switch attribute on <html>.
 * Mounted once near the root.
 */
export function HeadingShimmerVars() {
  const { data } = useHeadingShimmer();

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.style.setProperty("--shimmer-sweep-size", `${data.sweep_size}%`);
    root.style.setProperty("--shimmer-speed", `${data.speed_ms}ms`);
    root.style.setProperty("--shimmer-intensity", `${data.intensity}%`);
    if (data.enabled) {
      root.removeAttribute("data-shimmer");
    } else {
      root.setAttribute("data-shimmer", "off");
    }
  }, [data.sweep_size, data.speed_ms, data.intensity, data.enabled]);

  return null;
}
