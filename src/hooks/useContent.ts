/**
 * Public content hooks — now read from R2 JSON via the `getContent` server function.
 * Public API (return shape) is preserved so consumer components don't change.
 */
import { useR2Content } from "./useR2Content";

type PageKey = "B" | "F" | string;

const useBasicInfo = () => useR2Content<any>("basicInfo");
const useChromeDoc = () => useR2Content<any>("chrome");
const useAboutDoc = () => useR2Content<any>("about");

function project(q: { data: any } & Record<string, any>, value: any) {
  return { ...q, data: value } as any;
}

export const useHero = (_pageKey: PageKey = "B") => {
  const q = useBasicInfo();
  return project(q, q.data?.hero ?? null);
};

export const useAbout = (_pageKey: PageKey = "B") => useAboutDoc();

export const useContactSettings = (_pageKey: PageKey = "B") =>
  useR2Content<any>("contact");

export const useSiteSettings = (pageKey: PageKey = "B") => {
  const q = useBasicInfo();
  return project(q, q.data?.siteSettings?.[pageKey] ?? null);
};

export const useServices = () => {
  const q = useR2Content<any[]>("services");
  return project(q, q.data ?? []);
};

export const useProjects = () => {
  const q = useR2Content<any[]>("projects");
  return project(q, q.data ?? []);
};

export const useNavLinks = () => {
  const q = useChromeDoc();
  return project(q, q.data?.navLinks ?? []);
};

export const useFooterLinks = () => {
  const q = useChromeDoc();
  return project(q, q.data?.footerLinks ?? []);
};

export const useEducation = () => {
  const q = useAboutDoc();
  return project(q, q.data?.education ?? []);
};

export const useActivities = () => {
  const q = useAboutDoc();
  return project(q, q.data?.activities ?? []);
};

export const useTickerItems = () => {
  const q = useChromeDoc();
  return project(q, q.data?.tickerItems ?? []);
};

export const useFooterApps = () => {
  const q = useChromeDoc();
  return project(q, q.data?.footerApps ?? []);
};
