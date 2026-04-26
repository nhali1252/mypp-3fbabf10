/**
 * RPC server functions for the messages inbox.
 * - submitMessage: PUBLIC, validated insert (used by contact forms / HireMe modal).
 * - listMessages / updateMessage / deleteMessage: ADMIN ONLY.
 *
 * Messages are stored in the PRIVATE R2 bucket so PII (email, phone) is not
 * served by the public CDN domain.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { readMessages, writeMessages, type Message } from "./messages.server";

export type MessagesResult =
  | { ok: true; messages: Message[] }
  | { ok: false; messages: Message[]; error: string; detail?: string };

function messageStorageError(error: unknown): string {
  const err = error as any;
  if (
    err?.name === "AccessDenied" ||
    err?.Code === "AccessDenied" ||
    err?.$metadata?.httpStatusCode === 403 ||
    /access\s*denied|forbidden/i.test(err?.message ?? "")
  ) {
    return "R2 denied access to the private messages bucket. Verify R2_PRIVATE_BUCKET is the bucket name and the R2 token has read/write object permissions for it.";
  }
  return "Messages storage is unavailable right now. Verify the R2 settings, then use Runtime → Restart R2 client.";
}

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin");
  if (error) throw new Error("Role check failed");
  if (!data?.length) throw new Error("Forbidden — admin role required");
}

const submitSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(60).optional().or(z.literal("")),
  subject: z.string().trim().max(200).optional().or(z.literal("")),
  message: z.string().trim().min(1).max(5000),
});

function newId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Public: append a new message. Validated server-side. */
export const submitMessage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => submitSchema.parse(data))
  .handler(async ({ data }) => {
    const list = await readMessages();
    const msg: Message = {
      id: newId(),
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      subject: data.subject || null,
      message: data.message,
      is_read: false,
      is_replied: false,
      created_at: new Date().toISOString(),
    };
    list.unshift(msg);
    // Cap at 1000 most recent to keep file size reasonable.
    if (list.length > 1000) list.length = 1000;
    await writeMessages(list);
    return { ok: true };
  });

/** Admin: list all messages, newest first. */
export const listMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MessagesResult> => {
    await assertAdmin(context.userId);
    try {
      const list = await readMessages();
      return { ok: true, messages: list.sort((a, b) => (a.created_at < b.created_at ? 1 : -1)) };
    } catch (error: any) {
      console.error("[messages.listMessages] storage unavailable", {
        name: error?.name,
        code: error?.Code || error?.code,
        status: error?.$metadata?.httpStatusCode,
        message: error?.message,
      });
      return { ok: false, messages: [], error: messageStorageError(error), detail: error?.message };
    }
  });

/** Admin: toggle is_read / is_replied flags. */
export const updateMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; is_read?: boolean; is_replied?: boolean }) =>
    z.object({
      id: z.string().min(1).max(120),
      is_read: z.boolean().optional(),
      is_replied: z.boolean().optional(),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const list = await readMessages();
    const idx = list.findIndex((m) => m.id === data.id);
    if (idx === -1) throw new Error("Message not found");
    if (typeof data.is_read === "boolean") list[idx].is_read = data.is_read;
    if (typeof data.is_replied === "boolean") list[idx].is_replied = data.is_replied;
    await writeMessages(list);
    return { ok: true };
  });

/** Admin: delete a message permanently. */
export const deleteMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) =>
    z.object({ id: z.string().min(1).max(120) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const list = await readMessages();
    const next = list.filter((m) => m.id !== data.id);
    await writeMessages(next);
    return { ok: true };
  });
