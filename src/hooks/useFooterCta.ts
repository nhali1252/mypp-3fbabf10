import { useContentDoc } from "./useContentDoc";

export type FooterCta = {
  id: string;
  eyebrow: string;
  headline: string;
  subtext: string;
  primary_label: string;
  primary_url: string;
  show_email: boolean;
  email_label: string;
  show_whatsapp: boolean;
  whatsapp_label: string;
  show_call: boolean;
  call_label: string;
  active: boolean;
};

export const FOOTER_CTA_DEFAULTS: FooterCta = {
  id: "",
  eyebrow: "Start a project",
  headline: "Have a brief or an idea? Let's talk.",
  subtext: "Replies within 24 hours · Calls Mon–Fri",
  primary_label: "Start a project",
  primary_url: "/contact",
  show_email: true,
  email_label: "Email",
  show_whatsapp: true,
  whatsapp_label: "WhatsApp",
  show_call: true,
  call_label: "Call",
  active: true,
};

export function useFooterCta() {
  const q = useContentDoc<any>("chrome");
  const merged: FooterCta = { ...FOOTER_CTA_DEFAULTS, ...(q.data?.footerCta ?? {}) };
  return { ...q, data: merged } as Omit<typeof q, "data"> & { data: FooterCta };
}
