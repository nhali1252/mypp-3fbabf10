import { Sparkles, SparklesIcon } from "lucide-react";
import { useShimmerPref } from "@/hooks/useShimmerPref";

/**
 * Compact toggle that switches the gold heading shimmer on/off for the
 * current visitor (persisted in localStorage). Visible on every page via
 * the floating mount in __root.tsx — no admin access required.
 *
 * Mirrors `data-shimmer-user="off"` onto <html>; the matching CSS rule in
 * src/styles.css neutralizes h1/h2/h3 (and Hero3DText spans) the same way
 * the kill-switch and .no-shimmer opt-outs do.
 */
export function ShimmerToggle({ className = "" }: { className?: string }) {
  const { pref, toggle } = useShimmerPref();
  const on = pref === "on";
  const Icon = on ? Sparkles : SparklesIcon;
  const label = on ? "Shimmer: On" : "Shimmer: Off";

  return (
    <button
      type="button"
      onClick={toggle}
      title={`${label} — click to switch headings to ${on ? "plain" : "gold shimmer"}`}
      aria-label={label}
      aria-pressed={on}
      data-shimmer-toggle
      className={`no-shimmer inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] backdrop-blur transition-colors hover:border-primary/60 hover:text-foreground ${
        on ? "text-primary" : "text-muted-foreground"
      } ${className}`}
    >
      <Icon className={`h-3.5 w-3.5 ${on ? "" : "opacity-60"}`} />
      <span>{label}</span>
    </button>
  );
}
