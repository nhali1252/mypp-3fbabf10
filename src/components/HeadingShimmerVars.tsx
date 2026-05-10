import { useEffect } from "react";
import { useLocation } from "@tanstack/react-router";
import { useHeadingShimmer, resolveShimmerForPath, isShimmerPathDisabled } from "@/hooks/useHeadingShimmer";
import { useShimmerSpeedPref } from "@/hooks/useShimmerSpeedPref";
import { contrastRatio } from "@/lib/contrast";

/**
 * Applies the resolved heading-shimmer settings for the current route to
 * :root as CSS variables, and toggles the global kill-switch attribute on
 * <html>. Resolution order (per field):
 *   1. Per-route override (heading_shimmer_overrides table)
 *   2. Global defaults (heading_shimmer_settings table)
 *   3. Hard-coded fallbacks
 * The legacy `disabled_paths` list still forces the kill-switch on for
 * pages where it appears, even if no override row exists.
 *
 * Accessibility: after applying settings we measure the contrast of the
 * shimmer's brightest stop (`--primary`) against the page background. If it
 * falls below the WCAG AA threshold for large text (3:1), we set
 * `data-shimmer-fallback="true"` on <html> so the CSS swaps the gradient
 * for plain `--foreground`.
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
  const { data, overrides } = useHeadingShimmer();
  const { pathname } = useLocation();
  const { speedMs: userSpeed } = useShimmerSpeedPref();

  const resolved = resolveShimmerForPath(data, overrides, pathname);
  const pageDisabled = data.disabled_paths.some(
    (p) => p && (pathname === p || pathname.startsWith(p + "/")),
  );
  // User's reduced-motion speed pref still wins if set (accessibility).
  const effectiveSpeed = userSpeed ?? resolved.speed_ms;
  const off = !resolved.enabled || pageDisabled;

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.style.setProperty("--shimmer-sweep-size", `${resolved.sweep_size}vw`);
    root.style.setProperty("--shimmer-speed", `${effectiveSpeed}ms`);
    root.style.setProperty("--shimmer-intensity", `${resolved.intensity}%`);
    if (off) root.setAttribute("data-shimmer", "off");
    else root.removeAttribute("data-shimmer");
    evaluateContrast();
  }, [resolved.sweep_size, effectiveSpeed, resolved.intensity, off]);

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
