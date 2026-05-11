/**
 * Admin server functions to read/update branding overrides for email templates,
 * plus a public-to-admin preview renderer that returns the same HTML the queue
 * dispatcher would send.
 */
import { createServerFn } from "@tanstack/react-start";
import * as React from "react";
import { render } from "@react-email/components";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { template as contactConfirmation } from "@/lib/email-templates/contact-confirmation";
import { template as contactNotification } from "@/lib/email-templates/contact-notification";

const TEMPLATE_KEYS = ["contact-confirmation", "contact-notification"] as const;
type TemplateKey = (typeof TEMPLATE_KEYS)[number];

const TEMPLATES: Record<TemplateKey, any> = {
  "contact-confirmation": contactConfirmation,
  "contact-notification": contactNotification,
};

async function assertAdmin(userId: string) {
  const { data, error } = await (supabaseAdmin as any)
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin");
  if (error) throw new Error(`Role check failed: ${error.message}`);
  if (!data?.length) throw new Error("Forbidden — admin role required");
}

// loadBranding lives in email-template-branding.server.ts so the messages
// pipeline can use it without dragging supabaseAdmin into client bundles.
import { loadBranding } from "@/server/email-template-branding.server";

/** Admin: list all template branding overrides. */
export const listEmailTemplateSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin((context as any).user.id);
    const { data, error } = await (supabaseAdmin as any)
      .from("email_template_settings")
      .select("template_key, settings, updated_at")
      .in("template_key", TEMPLATE_KEYS as unknown as string[]);
    if (error) throw new Error(error.message);
    const byKey: Record<string, any> = {};
    (data ?? []).forEach((r: any) => { byKey[r.template_key] = r; });
    return TEMPLATE_KEYS.map((key) => ({
      template_key: key,
      settings: byKey[key]?.settings ?? {},
      updated_at: byKey[key]?.updated_at ?? null,
      displayName: TEMPLATES[key].displayName ?? key,
    }));
  });

const updateSchema = z.object({
  template_key: z.enum(TEMPLATE_KEYS as unknown as [TemplateKey, ...TemplateKey[]]),
  settings: z.record(z.string(), z.string()),
});

/** Admin: upsert branding overrides for one template. */
export const updateEmailTemplateSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => updateSchema.parse(input))
  .handler(async ({ data, context }) => {
    const userId = (context as any).user.id as string;
    await assertAdmin(userId);
    // Strip empty strings so defaults still apply.
    const cleaned: Record<string, string> = {};
    for (const [k, v] of Object.entries(data.settings)) {
      if (typeof v === "string" && v.trim().length > 0) cleaned[k] = v;
    }
    const { error } = await (supabaseAdmin as any)
      .from("email_template_settings")
      .upsert(
        {
          template_key: data.template_key,
          settings: cleaned,
          updated_at: new Date().toISOString(),
          updated_by: userId,
        },
        { onConflict: "template_key" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const previewSchema = z.object({
  template_key: z.enum(TEMPLATE_KEYS as unknown as [TemplateKey, ...TemplateKey[]]),
  /** Live edit preview: pass the current form state to render before saving. */
  settings: z.record(z.string(), z.string()).optional(),
});

/** Admin: render a template preview HTML with the given (or saved) branding. */
export const previewEmailTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => previewSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin((context as any).user.id);
    const tmpl = TEMPLATES[data.template_key];
    let branding = data.settings;
    if (!branding) {
      const stored = await loadBranding(data.template_key);
      branding = stored ?? undefined;
    }
    // Strip empty fields so defaults render.
    const cleaned: Record<string, string> = {};
    for (const [k, v] of Object.entries(branding ?? {})) {
      if (typeof v === "string" && v.trim().length > 0) cleaned[k] = v;
    }
    const props = { ...(tmpl.previewData ?? {}), branding: cleaned };
    const element = React.createElement(tmpl.component, props);
    const html = await render(element);
    const subject =
      typeof tmpl.subject === "function" ? tmpl.subject(props) : tmpl.subject;
    return { ok: true, html, subject };
  });
