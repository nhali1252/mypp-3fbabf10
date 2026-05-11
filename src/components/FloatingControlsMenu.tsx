import { useEffect, useRef, useState } from "react";
import { Settings2, X, Sparkles, SparklesIcon, Sun, Moon, Zap, ZapOff, RotateCcw, AlignLeft, AlignJustify } from "lucide-react";
import { useShimmerPref } from "@/hooks/useShimmerPref";
import { useMotionPref } from "@/hooks/useMotionPref";
import { useAlignPref } from "@/hooks/useAlignPref";
import { useTheme } from "@/components/ThemeProvider";
import {
  useShimmerSpeedPref,
  SHIMMER_SPEED_MIN,
  SHIMMER_SPEED_MAX,
  SHIMMER_SPEED_STEP,
} from "@/hooks/useShimmerSpeedPref";
import { useHeadingShimmer } from "@/hooks/useHeadingShimmer";

/**
 * Single floating control hub for the four visitor preferences:
 * shimmer on/off, shimmer speed, motion, theme. Replaces the four
 * separate floating/inline toggles that crowded the mobile viewport.
 *
 * Collapsed: 44x44 FAB (gear). Expanded: a small menu anchored above-right
 * of the FAB. Closes on outside click / Escape. Hidden on /admin and print.
 */
export function FloatingControlsMenu() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const { pref: shimmerPref, toggle: toggleShimmer } = useShimmerPref();
  const { pref: motionPref, setMotionPref, reduceMotion } = useMotionPref();
  const { pref: alignPref, setAlignPref } = useAlignPref();
  const { theme, toggle: toggleTheme } = useTheme();
  const { speedMs, setSpeedMs } = useShimmerSpeedPref();
  const { data } = useHeadingShimmer();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const shimmerOn = shimmerPref === "on";
  const ShimmerIcon = shimmerOn ? Sparkles : SparklesIcon;
  const isDark = theme === "dark";
  const motionLabel =
    motionPref === "auto"
      ? `Auto${reduceMotion ? " (reduced)" : ""}`
      : motionPref === "on"
        ? "On"
        : "Off";
  const MotionIcon = motionPref === "off" ? ZapOff : motionPref === "on" ? Zap : Sparkles;
  const nextMotion = motionPref === "auto" ? "off" : motionPref === "off" ? "on" : "auto";
  const AlignIcon = alignPref === "left" ? AlignLeft : AlignJustify;
  const alignLabel = alignPref === "auto" ? "Auto" : alignPref === "justify" ? "Justify" : "Left";
  const nextAlign = alignPref === "auto" ? "justify" : alignPref === "justify" ? "left" : "auto";
  const effectiveSpeed = speedMs ?? data.speed_ms;
  const seconds = (effectiveSpeed / 1000).toFixed(1);
  const speedOverridden = speedMs != null;

  return (
    <div
      ref={wrapRef}
      className="pointer-events-none fixed bottom-4 right-4 z-40 print:hidden"
    >
      <div className="pointer-events-auto relative flex flex-col items-end gap-2">
        {open && (
          <div
            role="dialog"
            aria-label="Preferences"
            className="no-shimmer w-[260px] rounded-2xl border border-border bg-popover/95 backdrop-blur-xl p-3 shadow-xl"
          >
            <div className="flex items-center justify-between gap-2 mb-2 px-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                Preferences
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close preferences"
                className="grid place-items-center w-6 h-6 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              <Row
                icon={<ShimmerIcon className={`w-4 h-4 ${shimmerOn ? "text-primary" : "opacity-60"}`} />}
                label="Shimmer"
                value={shimmerOn ? "On" : "Off"}
                onClick={toggleShimmer}
              />
              <Row
                icon={<MotionIcon className="w-4 h-4" />}
                label="Motion"
                value={motionLabel}
                onClick={() => setMotionPref(nextMotion)}
              />
              <Row
                icon={isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                label="Theme"
                value={isDark ? "Dark" : "Light"}
                onClick={toggleTheme}
              />
              <Row
                icon={<AlignIcon className="w-4 h-4" />}
                label="Text align"
                value={alignLabel}
                onClick={() => setAlignPref(nextAlign)}
              />

              <div className="mt-1 rounded-xl border border-border/70 bg-card/40 px-3 py-2.5">
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground">
                    Shimmer speed
                  </span>
                  <span className="text-[10px] text-muted-foreground">{seconds}s</span>
                </div>
                <input
                  type="range"
                  min={SHIMMER_SPEED_MIN}
                  max={SHIMMER_SPEED_MAX}
                  step={SHIMMER_SPEED_STEP}
                  value={effectiveSpeed}
                  onChange={(e) => setSpeedMs(Number(e.target.value))}
                  className="w-full accent-[var(--primary)]"
                  aria-label="Shimmer speed in milliseconds"
                />
                <button
                  type="button"
                  onClick={() => setSpeedMs(null)}
                  disabled={!speedOverridden}
                  className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground disabled:opacity-40"
                >
                  <RotateCcw className="w-3 h-3" />
                  Site default ({(data.speed_ms / 1000).toFixed(1)}s)
                </button>
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close preferences" : "Open preferences"}
          title="Preferences"
          className="no-shimmer grid place-items-center h-11 w-11 rounded-full border border-border bg-card/85 backdrop-blur-md text-foreground shadow-md hover:border-primary/60 hover:text-primary transition-colors"
        >
          {open ? <X className="w-4 h-4" /> : <Settings2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between gap-3 rounded-xl border border-transparent px-3 py-2 text-left hover:border-border hover:bg-muted/40 transition-colors"
    >
      <span className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
        <span className="grid place-items-center w-7 h-7 rounded-lg bg-muted/40 text-foreground">
          {icon}
        </span>
        {label}
      </span>
      <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {value}
      </span>
    </button>
  );
}
