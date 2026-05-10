import { useEffect } from "react";
import { useLocation } from "@tanstack/react-router";
import { useHeadingShimmer } from "@/hooks/useHeadingShimmer";
import { useShimmerSpeedPref } from "@/hooks/useShimmerSpeedPref";
import { contrastRatio } from "@/lib/contrast";

/**
 * Applies admin-tuned heading shimmer settings to :root as CSS variables
 * and toggles the global kill-switch attribute on <html>. The kill-switch
 * fires either when shimmer is globally disabled OR when the current
 * pathname matches an entry in `disabled_paths`.
 *
 * Accessibility: after applying settings we measure the contrast of the
 * shimmer's brightest stop (`--primary`) against the page background. If it
 * falls below the WCAG AA threshold for large text (3:1), we set
 * `data-shimmer-fallback="true"` on <html> so the CSS swaps the gradient
 * for plain `--foreground`, which is verified against the design tokens.
 */
const AA_LARGE = 3;

function evaluateContrast() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const ratio = contrastRatio("var(--primary)", "var(--background)");
  if (ratio != null && ratio < AA_LARGE) {
    root.setAttribute("data-shimmer-fallback", "true");
  } else {
    root.removeAttribute("data-shimmer-fallback");
  }
}

export function HeadingShimmerVars() {
  const { data } = useHeadingShimmer();
  const { pathname } = useLocation();
  const { speedMs: userSpeed } = useShimmerSpeedPref();

  const pageDisabled = data.disabled_paths.some(
    (p) => p && (pathname === p || pathname.startsWith(p + "/")),
  );
  const off = !data.enabled || pageDisabled;
  const effectiveSpeed = userSpeed ?? data.speed_ms;

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.style.setProperty("--shimmer-sweep-size", `${data.sweep_size}%`);
    root.style.setProperty("--shimmer-speed", `${effectiveSpeed}ms`);
    root.style.setProperty("--shimmer-intensity", `${data.intensity}%`);
    if (off) root.setAttribute("data-shimmer", "off");
    else root.removeAttribute("data-shimmer");
    evaluateContrast();
  }, [data.sweep_size, effectiveSpeed, data.intensity, off]);

  // Re-evaluate when the theme class flips (light/dark) since both --primary
  // and --background can swap, changing the contrast ratio.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const obs = new MutationObserver(() => evaluateContrast());
    obs.observe(root, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });
    evaluateContrast();
    return () => obs.disconnect();
  }, []);

  return null;
}
