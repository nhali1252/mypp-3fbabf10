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
 * Match a single configured `pattern` against a runtime `pathname`.
 *
 * Supported syntax:
 *   - Exact:           `/portfolio`         → matches only `/portfolio`
 *   - Trailing star:   `/portfolio/*`       → matches `/portfolio/anything` (any depth)
 *   - Single-segment:  `/blog/* /comments`  → `*` matches one URL segment (no `/`)
 *   - Globstar:        `/blog/**`           → matches any number of segments
 *
 * Trailing slashes on either side are normalized away. Patterns are matched
 * case-sensitively. Empty patterns never match.
 */
export function matchShimmerPath(pattern: string, pathname: string): boolean {
  if (!pattern) return false;
  const norm = (s: string) => (s.length > 1 ? s.replace(/\/+$/, "") : s);
  const pat = norm(pattern.trim());
  const path = norm(pathname);
  if (!pat.includes("*")) return path === pat;
  // Convert glob → RegExp. Escape regex specials, then expand `**` and `*`.
  const escaped = pat.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  const re = escaped
    .replace(/\*\*/g, "::GLOBSTAR::")
    .replace(/\*/g, "[^/]*")
    .replace(/::GLOBSTAR::/g, ".*");
  return new RegExp(`^${re}$`).test(path);
}

/** Specificity score for ranking — more literal characters = more specific. */
function patternSpecificity(pattern: string): number {
  return pattern.replace(/\*/g, "").length - (pattern.match(/\*/g)?.length ?? 0);
}

/**
 * Pick the most-specific override for `pathname`. Patterns support exact
 * matches and `*` / `**` wildcards (see {@link matchShimmerPath}). When
 * multiple patterns match, the most specific one wins; literal paths beat
 * wildcards.
 */
export function pickShimmerOverride(
  overrides: HeadingShimmerOverride[],
  pathname: string,
): HeadingShimmerOverride | null {
  const matches = overrides
    .filter((o) => matchShimmerPath(o.path, pathname))
    .sort((a, b) => patternSpecificity(b.path) - patternSpecificity(a.path));
  return matches[0] ?? null;
}

/** True if any pattern in `patterns` matches `pathname`. */
export function isShimmerPathDisabled(patterns: string[], pathname: string): boolean {
  return patterns.some((p) => matchShimmerPath(p, pathname));
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
