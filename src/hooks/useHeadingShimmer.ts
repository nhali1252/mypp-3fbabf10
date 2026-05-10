import { useContentDoc } from "./useContentDoc";

export type HeadingShimmer = {
  id: string;
  enabled: boolean;
  intensity: number; // 0–100 (% of primary mixed into mid-stop)
  sweep_size: number; // 100–400 (background-size, applied as vw)
  speed_ms: number; // 1000–15000
  disabled_paths: string[]; // routes where shimmer is forced off
};

/**
 * Per-route override row. Any field left as null/undefined inherits from the
 * global `HeadingShimmer` defaults — letting a single page tune e.g. just the
 * speed without touching intensity/sweep, and without changing the global
 * settings used by every other page.
 */
export type HeadingShimmerOverride = {
  id: string;
  path: string;
  enabled: boolean | null;
  intensity: number | null;
  sweep_size: number | null;
  speed_ms: number | null;
  notes: string | null;
};

export const HEADING_SHIMMER_DEFAULTS: HeadingShimmer = {
  id: "",
  enabled: true,
  intensity: 70,
  sweep_size: 200,
  speed_ms: 4500,
  disabled_paths: [],
};

export function useHeadingShimmer() {
  const q = useContentDoc<any>("chrome");
  const raw = q.data?.headingShimmer;
  const rawOverrides = Array.isArray(q.data?.headingShimmerOverrides)
    ? (q.data.headingShimmerOverrides as any[])
    : [];
  const merged: HeadingShimmer = raw
    ? {
        id: raw.id ?? "",
        enabled: raw.enabled ?? HEADING_SHIMMER_DEFAULTS.enabled,
        intensity: raw.intensity ?? HEADING_SHIMMER_DEFAULTS.intensity,
        sweep_size: raw.sweep_size ?? HEADING_SHIMMER_DEFAULTS.sweep_size,
        speed_ms: raw.speed_ms ?? HEADING_SHIMMER_DEFAULTS.speed_ms,
        disabled_paths: Array.isArray(raw.disabled_paths) ? raw.disabled_paths : [],
      }
    : HEADING_SHIMMER_DEFAULTS;
  const overrides: HeadingShimmerOverride[] = rawOverrides.map((r) => ({
    id: r.id,
    path: r.path,
    enabled: r.enabled ?? null,
    intensity: r.intensity ?? null,
    sweep_size: r.sweep_size ?? null,
    speed_ms: r.speed_ms ?? null,
    notes: r.notes ?? null,
  }));
  return {
    ...q,
    data: merged,
    overrides,
  } as Omit<typeof q, "data"> & {
    data: HeadingShimmer;
    overrides: HeadingShimmerOverride[];
  };
}

/**
 * Pick the most-specific override for `pathname`. A row matches when its
 * `path` equals the pathname or is a parent prefix (`/portfolio` matches
 * `/portfolio/abc`). Longer paths win so a deeper override beats a shallow
 * one when both apply.
 */
export function pickShimmerOverride(
  overrides: HeadingShimmerOverride[],
  pathname: string,
): HeadingShimmerOverride | null {
  const matches = overrides
    .filter((o) => o.path && (pathname === o.path || pathname.startsWith(o.path + "/")))
    .sort((a, b) => b.path.length - a.path.length);
  return matches[0] ?? null;
}

/** Merge global defaults with the matching override (override wins per field). */
export function resolveShimmerForPath(
  base: HeadingShimmer,
  overrides: HeadingShimmerOverride[],
  pathname: string,
): { enabled: boolean; intensity: number; sweep_size: number; speed_ms: number; matched: HeadingShimmerOverride | null } {
  const o = pickShimmerOverride(overrides, pathname);
  return {
    enabled: o?.enabled ?? base.enabled,
    intensity: o?.intensity ?? base.intensity,
    sweep_size: o?.sweep_size ?? base.sweep_size,
    speed_ms: o?.speed_ms ?? base.speed_ms,
    matched: o,
  };
}
