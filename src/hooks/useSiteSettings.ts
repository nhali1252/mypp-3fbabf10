import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type MotionPref = "on" | "off" | "auto";

export type SiteSettings = {
  welcome_animation_ms: number;
  default_motion_pref: MotionPref;
  section_visibility: Record<string, boolean>;
  reactions_enabled: boolean;
  watermark_text: string;
};

const DEFAULTS: SiteSettings = {
  welcome_animation_ms: 2000,
  default_motion_pref: "auto",
  section_visibility: {},
  reactions_enabled: true,
  watermark_text: "",
};

const MOTION_KEY = "motion-pref";

/**
 * Reads global site settings (welcome animation duration, default motion
 * preference, homepage section visibility) for the current page key. Falls
 * back to safe defaults so SSR + first paint never block.
 *
 * Also seeds the user's local motion preference from the admin default the
 * first time they visit (only when they haven't picked one yet).
 */
export function useSiteSettings(pageKey: string = "B"): SiteSettings {
  const { data } = useQuery({
    queryKey: ["public-site-settings", pageKey],
    queryFn: async (): Promise<SiteSettings> => {
      const { data } = await (supabase as any)
        .from("site_settings")
        .select(
          "welcome_animation_ms, default_motion_pref, section_visibility, reactions_enabled",
        )
        .eq("page_key", pageKey)
        .limit(1)
        .maybeSingle();
      if (!data) return DEFAULTS;
      const ms = Number(data.welcome_animation_ms);
      const pref = data.default_motion_pref;
      return {
        welcome_animation_ms: Number.isFinite(ms) ? ms : DEFAULTS.welcome_animation_ms,
        default_motion_pref:
          pref === "on" || pref === "off" || pref === "auto" ? pref : "auto",
        section_visibility:
          data.section_visibility && typeof data.section_visibility === "object"
            ? (data.section_visibility as Record<string, boolean>)
            : {},
        reactions_enabled: data.reactions_enabled !== false,
      };
    },
    staleTime: 60_000,
  });

  const settings = data ?? DEFAULTS;

  // Seed the visitor's stored motion pref from the admin default — but only if
  // they haven't already chosen one in this browser.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (settings.default_motion_pref === "auto") return;
    const existing = window.localStorage.getItem(MOTION_KEY);
    if (existing === "on" || existing === "off") return;
    window.localStorage.setItem(MOTION_KEY, settings.default_motion_pref);
    window.dispatchEvent(new Event("motion-pref-change"));
  }, [settings.default_motion_pref]);

  return settings;
}

export function isSectionVisible(
  settings: SiteSettings,
  key: string,
  defaultVisible = true,
): boolean {
  const v = settings.section_visibility?.[key];
  if (v === false) return false;
  if (v === true) return true;
  return defaultVisible;
}
