import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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

export const F_KEYS = {
  hero: ["f_hero"] as const,
  skills: ["f_skills"] as const,
  projects: ["f_projects"] as const,
};

export function useFHero() {
  return useQuery({
    queryKey: F_KEYS.hero,
    queryFn: async (): Promise<FHero | null> => {
      const { data } = await (supabase as any)
        .from("f_hero")
        .select("*")
        .limit(1)
        .maybeSingle();
      return data;
    },
  });
}

export function useFSkills(opts: { onlyActive?: boolean } = {}) {
  const { onlyActive = true } = opts;
  return useQuery({
    queryKey: [...F_KEYS.skills, { onlyActive }],
    queryFn: async (): Promise<FSkill[]> => {
      let q = (supabase as any).from("f_skills").select("*").order("sort_order");
      if (onlyActive) q = q.eq("active", true);
      const { data } = await q;
      return (data ?? []) as FSkill[];
    },
  });
}

export function useFProjects(opts: { onlyActive?: boolean } = {}) {
  const { onlyActive = true } = opts;
  return useQuery({
    queryKey: [...F_KEYS.projects, { onlyActive }],
    queryFn: async (): Promise<FProject[]> => {
      let q = (supabase as any).from("f_projects").select("*").order("sort_order");
      if (onlyActive) q = q.eq("active", true);
      const { data } = await q;
      return ((data ?? []) as any[]).map((d) => ({
        ...d,
        tags: Array.isArray(d.tags) ? d.tags : [],
      })) as FProject[];
    },
  });
}

/**
 * Subscribe to realtime changes on /F CMS tables and invalidate the query
 * cache so both the public page and the admin preview update instantly.
 */
export function useFRealtimeSync() {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel("f-content-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "f_hero" },
        () => qc.invalidateQueries({ queryKey: F_KEYS.hero }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "f_skills" },
        () => qc.invalidateQueries({ queryKey: F_KEYS.skills }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "f_projects" },
        () => qc.invalidateQueries({ queryKey: F_KEYS.projects }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
}
