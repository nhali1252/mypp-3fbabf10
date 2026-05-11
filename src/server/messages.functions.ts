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
import { loadBranding } from "@/server/email-template-settings.functions";

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

/** Dedup window: ignore identical submissions from the same email within this many minutes. */
const DEDUP_WINDOW_MINUTES = 10;

type AuditStatus = "info" | "success" | "warn" | "error";
type AuditEntry = {
  message_row_id: string | null;
  event: string;
  message_id?: string | null;
  recipient_email?: string | null;
  status?: AuditStatus;
  error_message?: string | null;
  details?: Record<string, unknown>;
};
/** Best-effort append to message_audit_log — never throws. */
async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    await (supabaseAdmin as any).from("message_audit_log").insert({
      message_row_id: entry.message_row_id,
      event: entry.event,
      message_id: entry.message_id ?? null,
      recipient_email: entry.recipient_email ?? null,
      status: entry.status ?? "info",
      error_message: entry.error_message ?? null,
      details: entry.details ?? {},
    });
  } catch (e) {
    console.warn("[messages.recordAudit] failed", entry.event, e);
  }
}

/** Public: insert a new message. */
export const submitMessage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => submitSchema.parse(data))
  .handler(async ({ data }) => {
    // Dedup: if the same email submitted the same (subject + message) within the
    // dedup window, treat as a duplicate — skip insert AND skip email notifications.
    try {
      const sinceIso = new Date(Date.now() - DEDUP_WINDOW_MINUTES * 60_000).toISOString();
      const { data: existing } = await (supabaseAdmin as any)
        .from("messages")
        .select("id, subject, message, created_at")
        .eq("email", data.email)
        .gte("created_at", sinceIso)
        .order("created_at", { ascending: false })
        .limit(20);
      const incomingSubject = (data.subject || "").trim();
      const incomingMessage = data.message.trim();
      const dup = (existing ?? []).find(
        (r: any) =>
          (r.message ?? "").trim() === incomingMessage &&
          ((r.subject ?? "") || "").trim() === incomingSubject,
      );
      if (dup) {
        console.info("[messages.submitMessage] duplicate suppressed", {
          email: data.email,
          existingId: dup.id,
        });
        await recordAudit({
          message_row_id: dup.id,
          event: "inbox.deduped",
          recipient_email: data.email,
          status: "warn",
          details: {
            window_minutes: DEDUP_WINDOW_MINUTES,
            subject: incomingSubject || null,
          },
        });
        return { ok: true, id: dup.id as string, deduped: true };
      }
    } catch (e: any) {
      // Dedup is best-effort — never block a real submission on a check failure.
      console.warn("[messages.submitMessage] dedup check failed", e);
      await recordAudit({
        message_row_id: null,
        event: "inbox.dedup_check_failed",
        recipient_email: data.email,
        status: "warn",
        error_message: e?.message ?? String(e),
      });
    }

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
    if (error) {
      await recordAudit({
        message_row_id: messageRowId,
        event: "inbox.insert_failed",
        recipient_email: data.email,
        status: "error",
        error_message: error.message,
      });
      throw new Error(error.message);
    }
    await recordAudit({
      message_row_id: messageRowId,
      event: "inbox.inserted",
      recipient_email: data.email,
      status: "success",
      details: {
        subject: data.subject || null,
        has_phone: !!data.phone,
        message_length: data.message.length,
      },
    });

    // Fire-and-forget email notifications. Failures must not block the form response.
    try {
      await sendContactNotification(data, messageRowId);
    } catch (e: any) {
      console.error("[messages.submitMessage] admin notify failed", e);
      await recordAudit({
        message_row_id: messageRowId,
        event: "notify.threw",
        status: "error",
        error_message: e?.message ?? String(e),
      });
    }
    try {
      await sendContactConfirmation(data, messageRowId);
    } catch (e: any) {
      console.error("[messages.submitMessage] sender confirmation failed", e);
      await recordAudit({
        message_row_id: messageRowId,
        event: "confirm.threw",
        status: "error",
        error_message: e?.message ?? String(e),
      });
    }
    return { ok: true, id: messageRowId, deduped: false };
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
  const branding = await loadBranding("contact-confirmation");
  const props = {
    name: data.name,
    subject: data.subject || "(no subject)",
    message: data.message,
    submittedAt,
    branding,
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
    await recordAudit({
      message_row_id: messageRowId,
      event: opts.retry ? "retry.confirm.failed" : "confirm.enqueue_failed",
      message_id: messageId,
      recipient_email: data.email,
      status: "error",
      error_message: enqErr.message,
    });
    throw new Error(enqErr.message);
  }
  await recordAudit({
    message_row_id: messageRowId,
    event: opts.retry ? "retry.confirm.enqueued" : "confirm.enqueued",
    message_id: messageId,
    recipient_email: data.email,
    status: "success",
    details: { template: "contact-confirmation" },
  });
  return { messageId, recipient: data.email };
}

async function sendContactNotification(
  data: { name: string; email: string; phone?: string; subject?: string; message: string },
  messageRowId: string,
  opts: { retry?: boolean } = {},
) {
  // Look up the configured receiver from contact_settings (admin client to bypass RLS).
  // Prefer page_key='B' (Basic / primary), then any other row as fallback. Without an
  // explicit ORDER BY, .limit(1) is non-deterministic and could pick the wrong row.
  const { data: settingsRows } = await (supabaseAdmin as any)
    .from("contact_settings")
    .select("page_key, form_receiver_email, email")
    .order("page_key", { ascending: true });
  const rows: any[] = settingsRows ?? [];
  const primary = rows.find((r) => r.page_key === "B") ?? rows[0] ?? null;
  const recipient: string | undefined =
    primary?.form_receiver_email || primary?.email;
  if (!recipient) {
    console.warn("[messages.submitMessage] no recipient email configured; skipping notify");
    await recordAudit({
      message_row_id: messageRowId,
      event: "notify.no_recipient",
      status: "warn",
    });
    return null;
  }

  const submittedAt = new Date().toISOString();
  const branding = await loadBranding("contact-notification");
  const props = {
    name: data.name,
    email: data.email,
    phone: data.phone || "",
    subject: data.subject || "(no subject)",
    message: data.message,
    submittedAt,
    branding,
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

  const messageId = makeMessageId("notify", messageRowId, !!opts.retry);
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
    await recordAudit({
      message_row_id: messageRowId,
      event: opts.retry ? "retry.notify.failed" : "notify.enqueue_failed",
      message_id: messageId,
      recipient_email: recipient,
      status: "error",
      error_message: enqErr.message,
    });
    throw new Error(enqErr.message);
  }
  await recordAudit({
    message_row_id: messageRowId,
    event: opts.retry ? "retry.notify.enqueued" : "notify.enqueued",
    message_id: messageId,
    recipient_email: recipient,
    status: "success",
    details: { template: "contact-notification" },
  });
  return { messageId, recipient };
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
    // Build OR filter to also catch retry rows (`notify-<id>-r...`, `confirm-<id>-r...`)
    const orFilter = data.ids
      .flatMap((id) => [`message_id.like.notify-${id}%`, `message_id.like.confirm-${id}%`])
      .join(",");
    const { data: rows, error } = await (supabaseAdmin as any)
      .from("email_send_log")
      .select("message_id, status, error_message, created_at")
      .or(orFilter)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    type Acc = { message_id: string; created_at: string; status: string; error_message: string | null };
    const best = new Map<string, Acc>(); // key = `${leg}:${rowId}`
    for (const r of rows ?? []) {
      const m = String(r.message_id).match(/^(notify|confirm)-([0-9a-f-]{36})/i);
      if (!m) continue;
      const leg = m[1] as EmailLeg;
      const rowId = m[2];
      const key = `${leg}:${rowId}`;
      const prev = best.get(key);
      // Newer message_id (retry) wins; within same message_id newer created_at wins
      if (
        !prev ||
        r.message_id > prev.message_id ||
        (r.message_id === prev.message_id && r.created_at > prev.created_at)
      ) {
        best.set(key, {
          message_id: r.message_id,
          created_at: r.created_at,
          status: r.status,
          error_message: r.error_message ?? null,
        });
      }
    }
    const out: EmailStatusRow[] = [];
    for (const [key, r] of best) {
      const [leg, rowId] = key.split(":");
      out.push({
        message_row_id: rowId,
        leg: leg as EmailLeg,
        status: r.status,
        error_message: r.error_message,
        updated_at: r.created_at,
      });
    }
    return { ok: true, rows: out };
  });

/** Admin: re-enqueue a failed/pending email for a given message + leg. */
export const retryMessageEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; leg: EmailLeg }) =>
    z.object({ id: z.string().uuid(), leg: z.enum(["notify", "confirm"]) }).parse(data),
  )
  .handler(async ({ data, context }): Promise<{ ok: true; messageId: string; recipient: string }> => {
    await assertAdmin(context.supabase as any, context.userId);
    const { data: row, error } = await (supabaseAdmin as any)
      .from("messages")
      .select("id, name, email, phone, subject, message")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Message not found");

    const payload = {
      name: row.name,
      email: row.email,
      phone: row.phone || "",
      subject: row.subject || "",
      message: row.message,
    };
    if (data.leg === "notify") {
      const result = await sendContactNotification(payload, row.id, { retry: true });
      if (!result) throw new Error("No recipient configured in contact settings");
      return { ok: true, messageId: result.messageId, recipient: result.recipient };
    }
    const result = await sendContactConfirmation(payload, row.id, { retry: true });
    return { ok: true, messageId: result.messageId, recipient: result.recipient };
  });

export type MessageAuditEntry = {
  id: string;
  message_row_id: string | null;
  event: string;
  message_id: string | null;
  recipient_email: string | null;
  status: "info" | "success" | "warn" | "error";
  error_message: string | null;
  details: Record<string, any>;
  created_at: string;
};

/** Admin: full audit timeline for one inbox message (newest first). */
export const getMessageAudit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) =>
    z.object({ id: z.string().uuid() }).parse(data),
  )
  .handler(
    async ({ data, context }): Promise<{ ok: true; entries: MessageAuditEntry[] }> => {
      await assertAdmin(context.supabase as any, context.userId);
      const { data: rows, error } = await (supabaseAdmin as any)
        .from("message_audit_log")
        .select(
          "id, message_row_id, event, message_id, recipient_email, status, error_message, details, created_at",
        )
        .eq("message_row_id", data.id)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw new Error(error.message);
      return { ok: true, entries: (rows ?? []) as MessageAuditEntry[] };
    },
  );
