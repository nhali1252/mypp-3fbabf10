/**
 * One-time migration: copy existing Supabase messages into R2 private bucket.
 * Admin-only. Safe to run multiple times — merges by id.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { readMessages, writeMessages, type Message } from "./messages.server";

export const migrateMessagesToR2 = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Admin-only.
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin");
    if (!roles?.length) throw new Error("Forbidden — admin only");

    const { data: rows, error } = await supabaseAdmin
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const existing = await readMessages();
    const byId = new Map<string, Message>(existing.map((m) => [m.id, m]));

    for (const r of rows ?? []) {
      const id = String(r.id);
      if (byId.has(id)) continue;
      byId.set(id, {
        id,
        name: r.name,
        email: r.email,
        phone: r.phone ?? null,
        subject: r.subject ?? null,
        message: r.message,
        is_read: !!r.is_read,
        is_replied: !!r.is_replied,
        created_at: new Date(r.created_at).toISOString(),
      });
    }

    const merged = Array.from(byId.values()).sort((a, b) =>
      a.created_at < b.created_at ? 1 : -1,
    );
    await writeMessages(merged);

    return { ok: true, total: merged.length, copied: (rows ?? []).length };
  });
