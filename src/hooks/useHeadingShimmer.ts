import { useContentDoc } from "./useContentDoc";

export type HeadingShimmer = {
  id: string;
  enabled: boolean;
  intensity: number; // 0–100 (% of primary mixed into mid-stop)
  sweep_size: number; // 100–400 (background-size %)
  speed_ms: number; // 1000–15000
  disabled_paths: string[]; // routes where shimmer is forced off
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
  return { ...q, data: merged } as Omit<typeof q, "data"> & { data: HeadingShimmer };
}
