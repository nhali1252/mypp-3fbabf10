/**
 * Motion & visual-effect budget — JavaScript twin of the CSS tokens declared
 * in src/styles.css (`--dur-*`, `--blur-*`, `--ease-*`).
 *
 * Use this module whenever you write framer-motion variants, requestAnimationFrame
 * loops, or any JS-driven animation. Hard-coding milliseconds and blur radii
 * inside components defeats the budget — the goal is that one change here (or
 * in styles.css) re-tunes the entire site.
 *
 * The values automatically adapt to the runtime viewport via `useMotionBudget()`.
 * For SSR/static usage, import the constants directly — they default to the
 * desktop budget, which the mobile media query in styles.css then overrides
 * for any CSS-driven effect.
 *
 * See docs/animation-guidelines.md for the full ruleset.
 */
import { useEffect, useState } from "react";

/** Cubic-bezier easings — keep the count tiny so motion feels coherent. */
export const EASE = {
  smooth: [0.22, 1, 0.36, 1] as const,
  outSoft: [0.16, 1, 0.3, 1] as const,
  inOutSoft: [0.65, 0, 0.35, 1] as const,
} as const;

/** Duration record shape — same keys for desktop & mobile. */
export type DurationBudget = {
  instant: number;
  fast: number;
  base: number;
  slow: number;
  hero: number;
};
export type BlurBudget = { sm: number; md: number; lg: number; xl: number };

/** Desktop durations (ms). Mirror of `--dur-*` in styles.css. */
export const DURATION_DESKTOP: DurationBudget = {
  instant: 100,
  fast: 180,
  base: 260,
  slow: 480,
  hero: 800,
};

/** Mobile-clamped durations (ms). Same shape — just shorter. */
export const DURATION_MOBILE: DurationBudget = {
  instant: 80,
  fast: 140,
  base: 200,
  slow: 320,
  hero: 480,
};

/** Blur radii budget (px). */
export const BLUR_DESKTOP: BlurBudget = { sm: 8, md: 24, lg: 60, xl: 120 };
export const BLUR_MOBILE: BlurBudget = { sm: 6, md: 16, lg: 40, xl: 60 };

/** Hard caps — anything exceeding these triggers a dev-mode warning. */
export const CAPS = {
  /** Single one-shot transition must finish within this on mobile. */
  oneShotMaxMs: { desktop: 1200, mobile: 600 },
  /** Loop animations must be at least this long per cycle. */
  loopMinMs: { desktop: 1000, mobile: 1600 },
  /** Max blur radius any single layer can request. */
  blurMaxPx: { desktop: 140, mobile: 60 },
  /** Max concurrent `Infinity`-repeat motion elements per viewport. */
  concurrentLoops: { desktop: 6, mobile: 2 },
} as const;

export type MotionBudget = {
  isMobile: boolean;
  duration: typeof DURATION_DESKTOP;
  blur: typeof BLUR_DESKTOP;
  ease: typeof EASE;
};

/** Returns the static desktop budget — safe for SSR & module top-level use. */
export const desktopBudget: MotionBudget = {
  isMobile: false,
  duration: DURATION_DESKTOP,
  blur: BLUR_DESKTOP,
  ease: EASE,
};

/** Returns the static mobile budget. */
export const mobileBudget: MotionBudget = {
  isMobile: true,
  duration: DURATION_MOBILE,
  blur: BLUR_MOBILE,
  ease: EASE,
};

/**
 * Hook — reactive motion budget that flips between mobile/desktop with the
 * viewport. Use inside framer-motion variants:
 *
 *   const m = useMotionBudget();
 *   <motion.div transition={{ duration: m.duration.base / 1000, ease: m.ease.smooth }} />
 *
 * Honors `prefers-reduced-motion`: when the user opts out, every duration
 * collapses to ~0 so animations effectively become instant snaps.
 */
export function useMotionBudget(): MotionBudget {
  const [budget, setBudget] = useState<MotionBudget>(() => {
    if (typeof window === "undefined") return desktopBudget;
    return window.matchMedia("(max-width: 640px)").matches ? mobileBudget : desktopBudget;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 640px)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    const apply = () => {
      if (reduce.matches) {
        setBudget({
          ...mobileBudget,
          duration: { instant: 1, fast: 1, base: 1, slow: 1, hero: 1 },
        });
        return;
      }
      setBudget(mq.matches ? mobileBudget : desktopBudget);
    };

    apply();
    mq.addEventListener("change", apply);
    reduce.addEventListener("change", apply);
    return () => {
      mq.removeEventListener("change", apply);
      reduce.removeEventListener("change", apply);
    };
  }, []);

  return budget;
}

/**
 * Dev-only sanity check. Call from a component when you're tempted to use a
 * raw millisecond value — it logs a warning if you exceed the budget so the
 * regression shows up in the console during development without affecting
 * production performance.
 */
export function assertWithinBudget(
  kind: "oneShot" | "loop" | "blur",
  valueMs: number,
  context: string,
): void {
  if (typeof window === "undefined") return;
  if (!import.meta.env?.DEV) return;
  const isMobile = window.matchMedia("(max-width: 640px)").matches;
  const tier = isMobile ? "mobile" : "desktop";

  let limit: number | null = null;
  let direction: "max" | "min" = "max";
  if (kind === "oneShot") limit = CAPS.oneShotMaxMs[tier];
  else if (kind === "loop") {
    limit = CAPS.loopMinMs[tier];
    direction = "min";
  } else if (kind === "blur") limit = CAPS.blurMaxPx[tier];

  if (limit == null) return;
  const exceeds = direction === "max" ? valueMs > limit : valueMs < limit;
  if (exceeds) {
    // eslint-disable-next-line no-console
    console.warn(
      `[motion-budget] ${context}: ${kind}=${valueMs} exceeds ${tier} ${direction}=${limit}. ` +
        `Use tokens from src/lib/motion-budget.ts or src/styles.css instead.`,
    );
  }
}
