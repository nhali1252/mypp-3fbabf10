import { useContentDoc } from "./useContentDoc";

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
  const q = useContentDoc<any>("chrome");
  const data = q.data?.pageLoader;
  const merged: PageLoaderSettings = data
    ? {
        id: data.id ?? "",
        initial_ms: data.initial_ms ?? PAGE_LOADER_DEFAULTS.initial_ms,
        route_ms: data.route_ms ?? PAGE_LOADER_DEFAULTS.route_ms,
        default_label: data.default_label ?? "",
        default_tagline: data.default_tagline ?? "",
        routes: (data.routes as PageLoaderRoutesMap) ?? {},
      }
    : PAGE_LOADER_DEFAULTS;
  return { ...q, data: merged } as Omit<typeof q, "data"> & { data: PageLoaderSettings };
}
