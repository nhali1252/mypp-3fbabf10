import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Page-scoped hooks accept an optional page key ("B" | "F" | ...). Defaults to "B".
type PageKey = "B" | "F" | string;

export const useHero = (pageKey: PageKey = "B") =>
  useQuery({
    queryKey: ["hero", pageKey],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("hero_content")
        .select("*")
        .eq("page_key", pageKey)
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

export const useAbout = (pageKey: PageKey = "B") =>
  useQuery({
    queryKey: ["about", pageKey],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("about_content")
        .select("*")
        .eq("page_key", pageKey)
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

export const useContactSettings = (pageKey: PageKey = "B") =>
  useQuery({
    queryKey: ["contact_settings", pageKey],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("contact_settings")
        .select("*")
        .eq("page_key", pageKey)
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

export const useSiteSettings = (pageKey: PageKey = "B") =>
  useQuery({
    queryKey: ["site_settings", pageKey],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("site_settings")
        .select("*")
        .eq("page_key", pageKey)
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

// Shared collection hooks (not page-scoped)
export const useServices = () =>
  useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data } = await supabase.from("services").select("*").eq("active", true).order("sort_order");
      return data ?? [];
    },
  });

export const useProjects = () =>
  useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("*").eq("published", true).order("sort_order");
      return data ?? [];
    },
  });

export const useNavLinks = () =>
  useQuery({
    queryKey: ["nav_links"],
    queryFn: async () => {
      const { data } = await supabase.from("nav_links").select("*").eq("active", true).order("sort_order");
      return data ?? [];
    },
  });

export const useFooterLinks = () =>
  useQuery({
    queryKey: ["footer_links"],
    queryFn: async () => {
      const { data } = await supabase.from("footer_links").select("*").eq("active", true).order("sort_order");
      return data ?? [];
    },
  });

export const useEducation = () =>
  useQuery({
    queryKey: ["education"],
    queryFn: async () => {
      const { data } = await supabase.from("education").select("*").eq("active", true).order("sort_order");
      return data ?? [];
    },
  });

export const useActivities = () =>
  useQuery({
    queryKey: ["activities"],
    queryFn: async () => {
      const { data } = await supabase.from("activities").select("*").eq("active", true).order("sort_order");
      return data ?? [];
    },
  });

export const useTickerItems = () =>
  useQuery({
    queryKey: ["ticker_items"],
    queryFn: async () => {
      const { data } = await supabase.from("ticker_items").select("*").eq("active", true).order("sort_order");
      return data ?? [];
    },
  });

export const useFooterApps = () =>
  useQuery({
    queryKey: ["footer_apps"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("footer_apps").select("*").eq("active", true).order("sort_order");
      return data ?? [];
    },
  });
