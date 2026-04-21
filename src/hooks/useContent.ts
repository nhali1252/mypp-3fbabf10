import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useHero = () =>
  useQuery({
    queryKey: ["hero"],
    queryFn: async () => {
      const { data } = await supabase.from("hero_content").select("*").limit(1).maybeSingle();
      return data;
    },
  });

export const useAbout = () =>
  useQuery({
    queryKey: ["about"],
    queryFn: async () => {
      const { data } = await supabase.from("about_content").select("*").limit(1).maybeSingle();
      return data;
    },
  });

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

export const useContactSettings = () =>
  useQuery({
    queryKey: ["contact_settings"],
    queryFn: async () => {
      const { data } = await supabase.from("contact_settings").select("*").limit(1).maybeSingle();
      return data;
    },
  });

export const useSiteSettings = () =>
  useQuery({
    queryKey: ["site_settings"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("*").limit(1).maybeSingle();
      return data;
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
