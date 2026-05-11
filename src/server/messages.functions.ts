/**
 * Messages inbox — backed directly by the Supabase `messages` table.
 * - submitMessage: PUBLIC, validated insert (used by contact form / HireMe modal).
 * - listMessages / updateMessage / deleteMessage: ADMIN ONLY.
 */
import { createServerFn } from "@tanstack/react-start";
import * as React from "react";
import { render } from "@react-email/components";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabasePublic } from "@/integrations/supabase/client.public";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { template as contactNotification } from "@/lib/email-templates/contact-notification";
import { template as contactConfirmation } from "@/lib/email-templates/contact-confirmation";

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

async function assertAdmin(sb: any, userId: string) {
  try {
    const { data, error } = await sb
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
    const messageRowId = crypto.randomUUID();
    // Use public (anon) client — RLS policy "Anon can submit message" permits
    // this insert, so the contact form works without SUPABASE_SERVICE_ROLE_KEY
    // being deployed to the Worker.
    const { error } = await supabasePublic.from("messages").insert({
      id: messageRowId,
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      subject: data.subject || null,
      message: data.message,
    });
    if (error) throw new Error(error.message);

    // Fire-and-forget email notifications. Failures must not block the form response.
    try {
      await sendContactNotification(data, messageRowId);
    } catch (e) {
      console.error("[messages.submitMessage] admin notify failed", e);
    }
    try {
      await sendContactConfirmation(data, messageRowId);
    } catch (e) {
      console.error("[messages.submitMessage] sender confirmation failed", e);
    }
    return { ok: true, id: messageRowId };
  });

function makeMessageId(leg: EmailLeg, rowId: string, retry: boolean) {
  return retry ? `${leg}-${rowId}-r${Date.now()}` : `${leg}-${rowId}`;
}

async function sendContactConfirmation(
  data: { name: string; email: string; subject?: string; message: string },
  messageRowId: string,
  opts: { retry?: boolean } = {},
) {
  const submittedAt = new Date().toISOString();
  const props = {
    name: data.name,
    subject: data.subject || "(no subject)",
    message: data.message,
    submittedAt,
  };
  const element = React.createElement(contactConfirmation.component, props);
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);
  const subject =
    typeof contactConfirmation.subject === "function"
      ? contactConfirmation.subject(props)
      : contactConfirmation.subject;

  const messageId = makeMessageId("confirm", messageRowId, !!opts.retry);
  await (supabaseAdmin as any).from("email_send_log").insert({
    message_id: messageId,
    template_name: "contact-confirmation",
    recipient_email: data.email,
    status: "pending",
  });
  const { error: enqErr } = await (supabaseAdmin as any).rpc("enqueue_email", {
    queue_name: "transactional_emails",
    payload: {
      message_id: messageId,
      to: data.email,
      from: "Ali Nur Hasan <info@alii.uk>",
      sender_domain: "notify.alii.uk",
      subject,
      html,
      text,
      purpose: "transactional",
      label: "contact-confirmation",
      idempotency_key: messageId,
      queued_at: submittedAt,
    },
  });
  if (enqErr) {
    console.error("[messages.submitMessage] confirmation enqueue failed", enqErr);
    await (supabaseAdmin as any).from("email_send_log").insert({
      message_id: messageId,
      template_name: "contact-confirmation",
      recipient_email: data.email,
      status: "failed",
      error_message: enqErr.message,
    });
    throw new Error(enqErr.message);
  }
  return { messageId, recipient: data.email };
}

async function sendContactNotification(data: {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}, messageRowId: string) {
  // Look up the configured receiver from contact_settings (admin client to bypass RLS).
  const { data: settings } = await (supabaseAdmin as any)
    .from("contact_settings")
    .select("form_receiver_email, email")
    .limit(1)
    .maybeSingle();
  const recipient: string | undefined =
    settings?.form_receiver_email || settings?.email;
  if (!recipient) {
    console.warn("[messages.submitMessage] no recipient email configured; skipping notify");
    return;
  }

  const submittedAt = new Date().toISOString();
  const props = {
    name: data.name,
    email: data.email,
    phone: data.phone || "",
    subject: data.subject || "(no subject)",
    message: data.message,
    submittedAt,
  };
  const element = React.createElement(contactNotification.component, props);
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);
  const subject =
    typeof contactNotification.subject === "function"
      ? contactNotification.subject(props)
      : contactNotification.subject;

  const messageId = `notify-${messageRowId}`;
  await (supabaseAdmin as any).from("email_send_log").insert({
    message_id: messageId,
    template_name: "contact-notification",
    recipient_email: recipient,
    status: "pending",
  });
  const { error: enqErr } = await (supabaseAdmin as any).rpc("enqueue_email", {
    queue_name: "transactional_emails",
    payload: {
      message_id: messageId,
      to: recipient,
      from: "mypp <noreply@alii.uk>",
      sender_domain: "notify.alii.uk",
      subject,
      html,
      text,
      purpose: "transactional",
      label: "contact-notification",
      idempotency_key: messageId,
      reply_to: data.email,
      queued_at: submittedAt,
    },
  });
  if (enqErr) {
    console.error("[messages.submitMessage] enqueue failed", enqErr);
    await (supabaseAdmin as any).from("email_send_log").insert({
      message_id: messageId,
      template_name: "contact-notification",
      recipient_email: recipient,
      status: "failed",
      error_message: enqErr.message,
    });
  }
}

/** Admin: list all messages, newest first. */
export const listMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MessagesResult> => {
    const sb = context.supabase as any;
    await assertAdmin(sb, context.userId);
    try {
      const { data, error } = await sb
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
    const sb = context.supabase as any;
    await assertAdmin(sb, context.userId);
    const patch: { is_read?: boolean; is_replied?: boolean } = {};
    if (typeof data.is_read === "boolean") patch.is_read = data.is_read;
    if (typeof data.is_replied === "boolean") patch.is_replied = data.is_replied;
    const { error } = await sb.from("messages").update(patch).eq("id", data.id);
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
    const sb = context.supabase as any;
    await assertAdmin(sb, context.userId);
    const { error } = await sb.from("messages").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type EmailLeg = "notify" | "confirm";
export type EmailStatusRow = {
  message_row_id: string;
  leg: EmailLeg;
  status: string;
  error_message: string | null;
  updated_at: string;
};

/** Admin: latest email send status (notify + confirm) per messages row. */
export const getMessageEmailStatuses = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { ids: string[] }) =>
    z.object({ ids: z.array(z.string().uuid()).max(500) }).parse(data),
  )
  .handler(async ({ data, context }): Promise<{ ok: true; rows: EmailStatusRow[] }> => {
    await assertAdmin(context.supabase as any, context.userId);
    if (data.ids.length === 0) return { ok: true, rows: [] };
    const keys = data.ids.flatMap((id) => [`notify-${id}`, `confirm-${id}`]);
    const { data: rows, error } = await (supabaseAdmin as any)
      .from("email_send_log")
      .select("message_id, status, error_message, created_at")
      .in("message_id", keys)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    // Reduce to latest row per message_id
    const latest = new Map<string, any>();
    for (const r of rows ?? []) {
      if (!latest.has(r.message_id)) latest.set(r.message_id, r);
    }
    const out: EmailStatusRow[] = [];
    for (const [mid, r] of latest) {
      const [legStr, ...rest] = mid.split("-");
      if (legStr !== "notify" && legStr !== "confirm") continue;
      out.push({
        message_row_id: rest.join("-"),
        leg: legStr as EmailLeg,
        status: r.status,
        error_message: r.error_message ?? null,
        updated_at: r.created_at,
      });
    }
    return { ok: true, rows: out };
  });
