/**
 * Messages inbox — backed directly by the Supabase `messages` table.
 * - submitMessage: PUBLIC, validated insert (used by contact form / HireMe modal).
 * - listMessages / updateMessage / deleteMessage: ADMIN ONLY.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { supabasePublic } from "@/integrations/supabase/client.public";

export type Message = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  is_read: boolean;
  is_replied: boolean;
  created_at: string;
};

export type MessagesResult =
  | { ok: true; messages: Message[] }
  | { ok: false; messages: Message[]; error: string; detail?: string };

async function assertAdmin(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin");
    if (error) {
      console.error("[messages.assertAdmin] supabase error:", error);
      throw new Error(`Role check failed: ${error.message}`);
    }
    if (!data?.length) throw new Error("Forbidden — admin role required");
  } catch (e: any) {
    if (e?.message?.startsWith("Forbidden")) throw e;
    if (e?.message?.startsWith("Role check failed")) throw e;
    console.error("[messages.assertAdmin] unexpected:", e);
    throw new Error(`Role check failed: ${e?.message ?? String(e)}`);
  }
}

const submitSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(60).optional().or(z.literal("")),
  subject: z.string().trim().max(200).optional().or(z.literal("")),
  message: z.string().trim().min(1).max(5000),
});

/** Public: insert a new message. */
export const submitMessage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => submitSchema.parse(data))
  .handler(async ({ data }) => {
    // Use public (anon) client — RLS policy "Anon can submit message" permits
    // this insert, so the contact form works without SUPABASE_SERVICE_ROLE_KEY
    // being deployed to the Worker.
    const { error } = await supabasePublic.from("messages").insert({
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      subject: data.subject || null,
      message: data.message,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Admin: list all messages, newest first. */
export const listMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MessagesResult> => {
    await assertAdmin(context.userId);
    try {
      const { data, error } = await supabaseAdmin
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return { ok: true, messages: (data ?? []) as Message[] };
    } catch (error: any) {
      console.error("[messages.listMessages] failed", error);
      return {
        ok: false,
        messages: [],
        error: "Could not load messages.",
        detail: error?.message,
      };
    }
  });

/** Admin: toggle is_read / is_replied flags. */
export const updateMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; is_read?: boolean; is_replied?: boolean }) =>
    z
      .object({
        id: z.string().uuid(),
        is_read: z.boolean().optional(),
        is_replied: z.boolean().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const patch: { is_read?: boolean; is_replied?: boolean } = {};
    if (typeof data.is_read === "boolean") patch.is_read = data.is_read;
    if (typeof data.is_replied === "boolean") patch.is_replied = data.is_replied;
    const { error } = await supabaseAdmin.from("messages").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Admin: delete a message permanently. */
export const deleteMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) =>
    z.object({ id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("messages").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
