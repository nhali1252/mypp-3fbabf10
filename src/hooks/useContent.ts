/**
 * Public content hooks — now read from R2 JSON via the `getContent` server function.
 * Public API is preserved so consumer components don't change.
 */
import { useR2Content } from "./useR2Content";

type PageKey = "B" | "F" | string;

type BasicInfoDoc = {
  hero?: any;
  about?: any;
  contact?: any;
  siteSettings?: Record<string, any>;
};

type ChromeDoc = {
  navLinks: any[];
  footerLinks: any[];
  footerApps: any[];
  footerCta: any | null;
  tickerItems: any[];
  seoSettings: Record<string, any>;
  pageLoader: any | null;
};

type AboutDoc = any & { activities?: any[]; education?: any[] };

const useBasicInfo = () => useR2Content<BasicInfoDoc>("basicInfo");
const useChrome = () => useR2Content<ChromeDoc>("chrome");
const useAboutDoc = () => useR2Content<AboutDoc>("about");

// Shape the basic-info hero doc by page key (defaults to "B").
export const useHero = (_pageKey: PageKey = "B") => {
  const q = useBasicInfo();
  return { ...q, data: q.data?.hero ?? null } as typeof q;
};

export const useAbout = (_pageKey: PageKey = "B") => {
  return useAboutDoc();
};

export const useContactSettings = (_pageKey: PageKey = "B") => {
  return useR2Content<any>("contact");
};

export const useSiteSettings = (pageKey: PageKey = "B") => {
  const q = useBasicInfo();
  return { ...q, data: q.data?.siteSettings?.[pageKey] ?? null } as typeof q;
};

export const useServices = () => useR2Content<any[]>("services");

export const useProjects = () => useR2Content<any[]>("projects");

export const useNavLinks = () => {
  const q = useChrome();
  return { ...q, data: q.data?.navLinks ?? [] } as typeof q;
};

export const useFooterLinks = () => {
  const q = useChrome();
  return { ...q, data: q.data?.footerLinks ?? [] } as typeof q;
};

export const useEducation = () => {
  const q = useAboutDoc();
  return { ...q, data: q.data?.education ?? [] } as typeof q;
};

export const useActivities = () => {
  const q = useAboutDoc();
  return { ...q, data: q.data?.activities ?? [] } as typeof q;
};

export const useTickerItems = () => {
  const q = useChrome();
  return { ...q, data: q.data?.tickerItems ?? [] } as typeof q;
};

export const useFooterApps = () => {
  const q = useChrome();
  return { ...q, data: q.data?.footerApps ?? [] } as typeof q;
};
