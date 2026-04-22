import { Sparkles, Zap, ZapOff } from "lucide-react";
import { useMotionPref } from "@/hooks/useMotionPref";

/**
 * Compact toggle that lets users force-enable, force-disable, or auto-follow
 * the system `prefers-reduced-motion` setting. State is persisted in localStorage.
 */
export function MotionToggle({ className = "" }: { className?: string }) {
  const { pref, setMotionPref, reduceMotion } = useMotionPref();

  const next = pref === "auto" ? "off" : pref === "off" ? "on" : "auto";
  const Icon = pref === "off" ? ZapOff : pref === "on" ? Zap : Sparkles;
  const label =
    pref === "auto"
      ? `Motion: Auto${reduceMotion ? " (reduced)" : ""}`
      : pref === "on"
      ? "Motion: On"
      : "Motion: Off";

  return (
    <button
      type="button"
      onClick={() => setMotionPref(next)}
      title={`${label} — click to switch`}
      aria-label={label}
      className={`inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground hover:border-primary/60 transition-colors backdrop-blur ${className}`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
    </button>
  );
}
