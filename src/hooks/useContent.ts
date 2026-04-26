/**
 * Public content hooks — now read from R2 JSON via the `getContent` server function.
 * Public API (return shape) is preserved so consumer components don't change.
 */
import { useR2Content } from "./useR2Content";

type PageKey = "B" | "F" | string;

const useBasicInfo = () => useR2Content<any>("basicInfo");
const useChromeDoc = () => useR2Content<any>("chrome");
const useAboutDoc = () => useR2Content<any>("about");

// Each derived hook re-projects a slice of the cached doc but keeps
// the React-Query result shape (data/isLoading/error/etc).
function project<T>(q: ReturnType<typeof useBasicInfo>, picker: (d: any) => T) {
  return { ...q, data: q.data ? picker(q.data) : null } as Omit<typeof q, "data"> & { data: T | null };
}

export const useHero = (_pageKey: PageKey = "B") =>
  project(useBasicInfo(), (d) => d?.hero ?? null);

export const useAbout = (_pageKey: PageKey = "B") => useAboutDoc();

export const useContactSettings = (_pageKey: PageKey = "B") =>
  useR2Content<any>("contact");

export const useSiteSettings = (pageKey: PageKey = "B") =>
  project(useBasicInfo(), (d) => d?.siteSettings?.[pageKey] ?? null);

export const useServices = () => {
  const q = useR2Content<any[]>("services");
  return { ...q, data: q.data ?? [] };
};

export const useProjects = () => {
  const q = useR2Content<any[]>("projects");
  return { ...q, data: q.data ?? [] };
};

export const useNavLinks = () =>
  project(useChromeDoc(), (d) => (d?.navLinks ?? []) as any[]);

export const useFooterLinks = () =>
  project(useChromeDoc(), (d) => (d?.footerLinks ?? []) as any[]);

export const useEducation = () =>
  project(useAboutDoc(), (d) => (d?.education ?? []) as any[]);

export const useActivities = () =>
  project(useAboutDoc(), (d) => (d?.activities ?? []) as any[]);

export const useTickerItems = () =>
  project(useChromeDoc(), (d) => (d?.tickerItems ?? []) as any[]);

export const useFooterApps = () =>
  project(useChromeDoc(), (d) => (d?.footerApps ?? []) as any[]);
