import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  return useQuery({
    queryKey: ["footer_cta"],
    queryFn: async (): Promise<FooterCta> => {
      const { data, error } = await supabase
        .from("footer_cta")
        .select("*")
        .maybeSingle();
      if (error) throw error;
      if (!data) return FOOTER_CTA_DEFAULTS;
      return { ...FOOTER_CTA_DEFAULTS, ...data } as FooterCta;
    },
    staleTime: 60_000,
  });
}
