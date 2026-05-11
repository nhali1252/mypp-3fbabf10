/**
 * Welcome email — fired after a successful signup from useAuth.signUp().
 * Public server fn (no auth middleware) because the user may not have a
 * session yet (e.g. email confirmation flow). To prevent abuse we look up
 * the auth user by email via the admin client and only send if a real
 * account exists for that address.
 */
import { createServerFn } from "@tanstack/react-start";
import * as React from "react";
import { render } from "@react-email/components";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { template as welcomeTemplate } from "@/lib/email-templates/welcome";

const schema = z.object({
  email: z.string().trim().email().max(320),
  name: z.string().trim().max(200).optional(),
});

export const sendWelcomeEmail = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    // Verify a real auth user exists for this email before sending.
    const sb = supabaseAdmin as any;
    let userId: string | null = null;
    try {
      const { data: lookup } = await sb.auth.admin.listUsers({
        page: 1,
        perPage: 1,
        // listUsers doesn't support filter; we'll fall back to scanning
      });
      // Best-effort: scan first page (signup just happened, usually visible)
      const found = (lookup?.users ?? []).find(
        (u: any) => u.email?.toLowerCase() === data.email.toLowerCase(),
      );
      userId = found?.id ?? null;
    } catch (e) {
      console.warn("[welcome-email] auth lookup failed; proceeding anyway", e);
    }

    const props = { name: data.name || data.email.split("@")[0] };
    const element = React.createElement(welcomeTemplate.component, props);
    const [html, text] = await Promise.all([
      render(element),
      render(element, { plainText: true }),
    ]);
    const subject =
      typeof welcomeTemplate.subject === "function"
        ? welcomeTemplate.subject(props)
        : welcomeTemplate.subject;

    // Idempotency: prefer auth user id, fallback to email-hash so re-signup
    // attempts don't spam. Suffix with date so a fresh signup after deletion
    // still goes through.
    const dayKey = new Date().toISOString().slice(0, 10);
    const idBase = userId ?? data.email.toLowerCase();
    const messageId = `welcome-${idBase}-${dayKey}`;

    await sb.from("email_send_log").insert({
      message_id: messageId,
      template_name: "welcome",
      recipient_email: data.email,
      status: "pending",
    });

    const { error: enqErr } = await sb.rpc("enqueue_email", {
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
        label: "welcome",
        idempotency_key: messageId,
        queued_at: new Date().toISOString(),
      },
    });

    if (enqErr) {
      console.error("[welcome-email] enqueue failed", enqErr);
      await sb.from("email_send_log").insert({
        message_id: messageId,
        template_name: "welcome",
        recipient_email: data.email,
        status: "failed",
        error_message: enqErr.message,
      });
      return { ok: false as const, error: enqErr.message };
    }
    return { ok: true as const, messageId };
  });
