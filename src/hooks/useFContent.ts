import { useContentDoc } from "./useContentDoc";

export type FHero = {
  id: string;
  headline: string;
  intro: string;
  eyebrow: string;
  highlight: string;
};

export type FSkill = {
  id: string;
  kind: "design" | "soft";
  title: string;
  description: string | null;
  icon: string;
  sort_order: number;
  active: boolean;
};

export type FProject = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  url: string | null;
  tags: string[];
  sort_order: number;
  active: boolean;
};

export type FPhotocard = {
  id: string;
  name: string;
  role: string;
  badge_top: string | null;
  badge_bottom: string | null;
  open_label: string | null;
  image_url: string | null;
};

export const F_KEYS = {
  hero: ["content", "fPage", "hero"] as const,
  skills: ["content", "fPage", "skills"] as const,
  projects: ["content", "fPage", "projects"] as const,
  photocard: ["content", "fPage", "photocard"] as const,
};

const useFDoc = () => useContentDoc<any>("fPage");

function pick<T>(q: ReturnType<typeof useFDoc>, value: T) {
  return { ...q, data: value } as Omit<typeof q, "data"> & { data: T };
}

export function useFPhotocard() {
  const q = useFDoc();
  return pick(q, (q.data?.photocard ?? null) as FPhotocard | null);
}

export function useFHero() {
  const q = useFDoc();
  return pick(q, (q.data?.hero ?? null) as FHero | null);
}

export function useFSkills(_opts: { onlyActive?: boolean } = {}) {
  const q = useFDoc();
  return pick(q, ((q.data?.skills ?? []) as FSkill[]));
}

export function useFProjects(_opts: { onlyActive?: boolean } = {}) {
  const q = useFDoc();
  const list = ((q.data?.projects ?? []) as any[]).map((d) => ({
    ...d,
    tags: Array.isArray(d.tags) ? d.tags : [],
  })) as FProject[];
  return pick(q, list);
}

/**
 * Realtime sync was DB-driven; with R2 JSON the admin save call invalidates
 * the cache directly, so this hook is now a no-op kept for backwards compat.
 */
export function useFRealtimeSync() {
  // intentionally empty
}
