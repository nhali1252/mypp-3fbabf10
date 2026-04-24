import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PageLoaderRouteEntry = { label?: string; tagline?: string };
export type PageLoaderRoutesMap = Record<string, PageLoaderRouteEntry>;

export type PageLoaderSettings = {
  id: string;
  initial_ms: number;
  route_ms: number;
  default_label: string;
  default_tagline: string;
  routes: PageLoaderRoutesMap;
};

export const PAGE_LOADER_DEFAULTS: PageLoaderSettings = {
  id: "",
  initial_ms: 250,
  route_ms: 250,
  default_label: "",
  default_tagline: "",
  routes: {
    "/": { label: "Welcome", tagline: "Pick a page to explore" },
    "/basic": { label: "Basic info", tagline: "About · Education · Activities" },
    "/about-and-skills": { label: "Skills & About", tagline: "Design · Tools · Workflow" },
    "/portfolio": { label: "Portfolio", tagline: "Client & design work" },
    "/projects": { label: "Projects", tagline: "Personal & code projects" },
    "/services": { label: "Services", tagline: "What I offer" },
    "/contact": { label: "Contact", tagline: "Start a project" },
    "/reviews": { label: "Reviews", tagline: "Read & leave reviews" },
    "/auth": { label: "Sign in", tagline: "Admin access" },
    "/admin": { label: "Admin", tagline: "Content management" },
  },
};

export function usePageLoaderSettings() {
  return useQuery({
    queryKey: ["page_loader_settings"],
    queryFn: async (): Promise<PageLoaderSettings> => {
      const { data, error } = await supabase
        .from("page_loader_settings")
        .select("*")
        .maybeSingle();
      if (error) throw error;
      if (!data) return PAGE_LOADER_DEFAULTS;
      return {
        id: data.id,
        initial_ms: data.initial_ms ?? PAGE_LOADER_DEFAULTS.initial_ms,
        route_ms: data.route_ms ?? PAGE_LOADER_DEFAULTS.route_ms,
        default_label: data.default_label ?? "",
        default_tagline: data.default_tagline ?? "",
        routes: (data.routes as PageLoaderRoutesMap) ?? {},
      };
    },
    staleTime: 60_000,
  });
}
