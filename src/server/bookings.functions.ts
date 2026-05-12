/**
 * Bookings — public submit + admin manage, with booking-confirmation
 * (to client) and booking-notification (to admin) emails enqueued via the
 * shared transactional queue. Mirrors the messages.functions.ts pattern.
 */
import { createServerFn } from "@tanstack/react-start";
import * as React from "react";
import { render } from "@react-email/components";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabasePublic } from "@/integrations/supabase/client.public";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { template as bookingConfirmation } from "@/lib/email-templates/booking-confirmation";
import { template as bookingNotification } from "@/lib/email-templates/booking-notification";
import { getOrCreateUnsubscribeToken } from "@/server/unsubscribe-token.server";

export type Booking = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  service: string | null;
  preferred_date: string;
  preferred_time: string | null;
  notes: string | null;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  created_at: string;
  updated_at: string;
};

export type BookingsResult =
  | { ok: true; bookings: Booking[] }
  | { ok: false; bookings: Booking[]; error: string; detail?: string };

async function assertAdmin(sb: any, userId: string) {
  const { data, error } = await sb
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin");
  if (error) throw new Error(`Role check failed: ${error.message}`);
  if (!data?.length) throw new Error("Forbidden — admin role required");
}

const submitSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(60).optional().or(z.literal("")),
  service: z.string().trim().max(200).optional().or(z.literal("")),
  preferred_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date (expected YYYY-MM-DD)"),
  preferred_time: z.string().trim().max(40).optional().or(z.literal("")),
  notes: z.string().trim().max(5000).optional().or(z.literal("")),
});

export const submitBooking = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => submitSchema.parse(data))
  .handler(async ({ data }) => {
    const id = crypto.randomUUID();
    const { error } = await supabasePublic.from("bookings").insert({
      id,
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      service: data.service || null,
      preferred_date: data.preferred_date,
      preferred_time: data.preferred_time || null,
      notes: data.notes || null,
    });
    if (error) throw new Error(error.message);

    // Fire-and-forget — never block the form on email failures.
    try {
      await sendBookingNotification(data, id);
    } catch (e) {
      console.error("[bookings.submit] admin notify failed", e);
    }
    try {
      await sendBookingConfirmation(data, id);
    } catch (e) {
      console.error("[bookings.submit] client confirmation failed", e);
    }
    return { ok: true as const, id };
  });

export type BookingEmailLeg = "notify" | "confirm";

function makeMessageId(leg: BookingEmailLeg, rowId: string, retry: boolean) {
  return retry ? `booking-${leg}-${rowId}-r${Date.now()}` : `booking-${leg}-${rowId}`;
}

type BookingEmailData = z.infer<typeof submitSchema>;

async function sendBookingConfirmation(
  data: BookingEmailData,
  rowId: string,
  opts: { retry?: boolean } = {},
) {
  const props = {
    name: data.name,
    service: data.service || "(no service selected)",
    preferredDate: data.preferred_date,
    preferredTime: data.preferred_time || undefined,
    notes: data.notes || undefined,
  };
  const element = React.createElement(bookingConfirmation.component, props);
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);
  const subject =
    typeof bookingConfirmation.subject === "function"
      ? bookingConfirmation.subject(props)
      : bookingConfirmation.subject;

  const messageId = makeMessageId("confirm", rowId, !!opts.retry);
  const sb = supabaseAdmin as any;
  await sb.from("email_send_log").insert({
    message_id: messageId,
    template_name: "booking-confirmation",
    recipient_email: data.email,
    status: "pending",
  });
  const { error: enqErr } = await sb.rpc("enqueue_email", {
    queue_name: "transactional_emails",
    payload: {
      message_id: messageId,
      to: data.email,
      from: "Ali Nur Hasan <info@i.alii.uk>",
      sender_domain: "notify.i.alii.uk",
      subject,
      html,
      text,
      purpose: "transactional",
      label: "booking-confirmation",
      idempotency_key: messageId,
      queued_at: new Date().toISOString(),
    },
  });
  if (enqErr) {
    await sb.from("email_send_log").insert({
      message_id: messageId,
      template_name: "booking-confirmation",
      recipient_email: data.email,
      status: "failed",
      error_message: enqErr.message,
    });
    throw new Error(enqErr.message);
  }
  return { messageId, recipient: data.email };
}

async function sendBookingNotification(
  data: BookingEmailData,
  rowId: string,
  opts: { retry?: boolean } = {},
) {
  const sb = supabaseAdmin as any;
  const { data: settings } = await sb
    .from("contact_settings")
    .select("form_receiver_email, email")
    .limit(1)
    .maybeSingle();
  const recipient: string | undefined =
    settings?.form_receiver_email || settings?.email;
  if (!recipient) {
    console.warn("[bookings.notify] no recipient email configured");
    return null;
  }

  const submittedAt = new Date().toISOString();
  const props = {
    name: data.name,
    email: data.email,
    phone: data.phone || "",
    service: data.service || "",
    preferredDate: data.preferred_date,
    preferredTime: data.preferred_time || "",
    notes: data.notes || "",
    submittedAt,
  };
  const element = React.createElement(bookingNotification.component, props);
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);
  const subject =
    typeof bookingNotification.subject === "function"
      ? bookingNotification.subject(props)
      : bookingNotification.subject;

  const messageId = makeMessageId("notify", rowId, !!opts.retry);
  await sb.from("email_send_log").insert({
    message_id: messageId,
    template_name: "booking-notification",
    recipient_email: recipient,
    status: "pending",
  });
  const { error: enqErr } = await sb.rpc("enqueue_email", {
    queue_name: "transactional_emails",
    payload: {
      message_id: messageId,
      to: recipient,
      from: "mypp <noreply@i.alii.uk>",
      sender_domain: "notify.i.alii.uk",
      subject,
      html,
      text,
      purpose: "transactional",
      label: "booking-notification",
      idempotency_key: messageId,
      reply_to: data.email,
      queued_at: submittedAt,
    },
  });
  if (enqErr) {
    await sb.from("email_send_log").insert({
      message_id: messageId,
      template_name: "booking-notification",
      recipient_email: recipient,
      status: "failed",
      error_message: enqErr.message,
    });
    throw new Error(enqErr.message);
  }
  return { messageId, recipient };
}

/** Admin: list all bookings, newest first. */
export const listBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<BookingsResult> => {
    const sb = context.supabase as any;
    await assertAdmin(sb, context.userId);
    try {
      const { data, error } = await sb
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return { ok: true, bookings: (data ?? []) as Booking[] };
    } catch (error: any) {
      return {
        ok: false,
        bookings: [],
        error: "Could not load bookings.",
        detail: error?.message,
      };
    }
  });

const statusEnum = z.enum(["pending", "confirmed", "cancelled", "completed"]);

/** Admin: update status. */
export const updateBookingStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; status: string }) =>
    z
      .object({ id: z.string().uuid(), status: statusEnum })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    await assertAdmin(sb, context.userId);
    const { error } = await sb
      .from("bookings")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Admin: delete. */
export const deleteBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) =>
    z.object({ id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    await assertAdmin(sb, context.userId);
    const { error } = await sb.from("bookings").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
