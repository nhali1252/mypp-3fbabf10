/**
 * Public content hooks — now read from R2 JSON via the `getContent` server function.
 * Public API (return shape) is preserved so consumer components don't change.
 */
import { useContentDoc } from "./useContentDoc";

type PageKey = "B" | "F" | string;

const useBasicInfo = () => useContentDoc<any>("basicInfo");
const useChromeDoc = () => useContentDoc<any>("chrome");
const useAboutDoc = () => useContentDoc<any>("about");

function project(q: { data: any } & Record<string, any>, value: any) {
  return { ...q, data: value } as any;
}

export const useHero = (_pageKey: PageKey = "B") => {
  const q = useBasicInfo();
  return project(q, q.data?.hero ?? null);
};

export const useAbout = (_pageKey: PageKey = "B") => useAboutDoc();

export const useContactSettings = (_pageKey: PageKey = "B") =>
  useContentDoc<any>("contact");

export const useSiteSettings = (pageKey: PageKey = "B") => {
  const q = useBasicInfo();
  return project(q, q.data?.siteSettings?.[pageKey] ?? null);
};

export const useServices = () => {
  const q = useContentDoc<any[]>("services");
  return project(q, q.data ?? []);
};

export const useProjects = () => {
  const q = useContentDoc<any[]>("projects");
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
