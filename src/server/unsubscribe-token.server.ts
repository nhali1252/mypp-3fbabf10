import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Get-or-create the unsubscribe token for a recipient.
 * The transactional email API rejects sends without one, so every
 * `enqueue_email` payload MUST include `unsubscribe_token`.
 */
export async function getOrCreateUnsubscribeToken(email: string): Promise<string> {
  const normalized = email.toLowerCase();
  const sb = supabaseAdmin as any;

  const { data: existing } = await sb
    .from("email_unsubscribe_tokens")
    .select("token, used_at")
    .eq("email", normalized)
    .maybeSingle();
  if (existing?.token && !existing.used_at) return existing.token as string;

  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const token = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  await sb
    .from("email_unsubscribe_tokens")
    .upsert({ token, email: normalized }, { onConflict: "email", ignoreDuplicates: true });

  const { data: stored } = await sb
    .from("email_unsubscribe_tokens")
    .select("token")
    .eq("email", normalized)
    .maybeSingle();
  return (stored?.token as string) ?? token;
}
