/** Server-only helper: read branding overrides for a given email template. */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function loadBranding(
  key: string,
): Promise<Record<string, string> | null> {
  try {
    const { data } = await (supabaseAdmin as any)
      .from("email_template_settings")
      .select("settings")
      .eq("template_key", key)
      .maybeSingle();
    return (data?.settings as Record<string, string>) ?? null;
  } catch {
    return null;
  }
}
