import { Sparkles, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  useShimmerSpeedPref,
  SHIMMER_SPEED_MIN,
  SHIMMER_SPEED_MAX,
  SHIMMER_SPEED_STEP,
} from "@/hooks/useShimmerSpeedPref";
import { useHeadingShimmer } from "@/hooks/useHeadingShimmer";

/**
 * Compact preference for the gold heading shimmer animation speed.
 * Saves to localStorage so it persists per browser. When unset, the
 * site-wide admin speed is used.
 */
export function ShimmerSpeedToggle({ className = "" }: { className?: string }) {
  const { speedMs, setSpeedMs } = useShimmerSpeedPref();
  const { data } = useHeadingShimmer();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape
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

  const effective = speedMs ?? data.speed_ms;
  const seconds = (effective / 1000).toFixed(1);
  const overridden = speedMs != null;

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={`Shimmer speed: ${seconds}s${overridden ? " (your setting)" : " (site default)"}`}
        aria-label="Shimmer speed"
        aria-expanded={open}
        className={`inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] backdrop-blur transition-colors ${
          overridden
            ? "border-primary/60 text-primary"
            : "border-border text-muted-foreground hover:text-foreground hover:border-primary/60"
        }`}
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>{seconds}s</span>
      </button>

      {open && (
        <div
          role="dialog"
          className="absolute right-0 top-full mt-2 z-50 w-72 rounded-2xl border border-border bg-popover p-4 shadow-lg"
        >
          <div className="flex items-baseline justify-between gap-2 mb-2">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-foreground">
              Shimmer speed
            </div>
            <div className="text-xs text-muted-foreground">
              {seconds}s / cycle
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mb-3">
            How long one full gold sweep takes across section headings.
            Saved on this device only.
          </p>
          <input
            type="range"
            min={SHIMMER_SPEED_MIN}
            max={SHIMMER_SPEED_MAX}
            step={SHIMMER_SPEED_STEP}
            value={effective}
            onChange={(e) => setSpeedMs(Number(e.target.value))}
            className="w-full accent-[var(--primary)]"
            aria-label="Shimmer speed in milliseconds"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1 mb-3">
            <span>Faster ({SHIMMER_SPEED_MIN / 1000}s)</span>
            <span>Slower ({SHIMMER_SPEED_MAX / 1000}s)</span>
          </div>
          <button
            type="button"
            onClick={() => setSpeedMs(null)}
            disabled={!overridden}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:hover:text-muted-foreground"
          >
            <RotateCcw className="w-3 h-3" />
            Use site default ({(data.speed_ms / 1000).toFixed(1)}s)
          </button>
        </div>
      )}
    </div>
  );
}
