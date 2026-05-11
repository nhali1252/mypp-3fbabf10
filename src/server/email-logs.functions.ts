/**
 * Admin: read email_send_log with deduplication by message_id (latest row per id).
 * Used by the /admin/email-logs view.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(sb: any, userId: string) {
  const { data, error } = await sb
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin");
  if (error) throw new Error(`Role check failed: ${error.message}`);
  if (!data?.length) throw new Error("Forbidden — admin role required");
}

export type EmailLogRow = {
  message_id: string | null;
  template_name: string;
  recipient_email: string;
  status: string;
  error_message: string | null;
  created_at: string;
  attempts: number;
};

export type EmailLogResult = {
  rows: EmailLogRow[];
  templates: string[];
  stats: { total: number; sent: number; failed: number; dlq: number; suppressed: number; pending: number };
  total: number;
};

const filterSchema = z.object({
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional(),
  template: z.string().optional(),
  status: z.enum(["all", "sent", "failed", "dlq", "suppressed", "pending", "bounced", "complained"]).default("all"),
  search: z.string().trim().max(200).optional(),
  limit: z.number().int().min(1).max(200).default(50),
  offset: z.number().int().min(0).default(0),
});

export const listEmailLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => filterSchema.parse(data ?? {}))
  .handler(async ({ data, context }): Promise<EmailLogResult> => {
    await assertAdmin(context.supabase as any, context.userId);
    const sb = supabaseAdmin as any;

    // Pull a wide window then dedupe in JS — email_send_log is small per project
    // and this keeps the SQL portable (no DISTINCT ON via PostgREST).
    let q = sb
      .from("email_send_log")
      .select("message_id, template_name, recipient_email, status, error_message, created_at")
      .order("created_at", { ascending: false })
      .limit(5000);
    if (data.start) q = q.gte("created_at", data.start);
    if (data.end) q = q.lte("created_at", data.end);
    if (data.template && data.template !== "all") q = q.eq("template_name", data.template);
    if (data.search) {
      const s = data.search.replace(/[%,]/g, "");
      q = q.or(`recipient_email.ilike.%${s}%,message_id.ilike.%${s}%,error_message.ilike.%${s}%`);
    }
    const { data: raw, error } = await q;
    if (error) throw new Error(error.message);

    // Dedupe by message_id (keep latest), count attempts per id
    const latest = new Map<string, EmailLogRow>();
    const attempts = new Map<string, number>();
    for (const r of (raw ?? []) as any[]) {
      const key = r.message_id ?? `__nokey__:${r.created_at}:${r.recipient_email}`;
      attempts.set(key, (attempts.get(key) ?? 0) + 1);
      if (!latest.has(key)) {
        latest.set(key, {
          message_id: r.message_id,
          template_name: r.template_name,
          recipient_email: r.recipient_email,
          status: r.status,
          error_message: r.error_message,
          created_at: r.created_at,
          attempts: 0,
        });
      }
    }
    const all = Array.from(latest.entries()).map(([k, row]) => ({
      ...row,
      attempts: attempts.get(k) ?? 1,
    }));

    // Status filter (applied after dedup so the latest status wins)
    const filtered = data.status === "all" ? all : all.filter((r) => r.status === data.status);

    // Stats over filtered set (after status filter? per spec: stats should reflect active filter — yes)
    const stats = { total: filtered.length, sent: 0, failed: 0, dlq: 0, suppressed: 0, pending: 0 };
    for (const r of filtered) {
      if (r.status === "sent") stats.sent++;
      else if (r.status === "dlq") stats.dlq++;
      else if (r.status === "suppressed") stats.suppressed++;
      else if (r.status === "pending" || r.status === "queued") stats.pending++;
      else stats.failed++;
    }

    // Distinct templates from full window (not filtered) so dropdown stays stable
    const templates = Array.from(new Set(all.map((r) => r.template_name))).sort();

    const total = filtered.length;
    const page = filtered.slice(data.offset, data.offset + data.limit);

    return { rows: page, templates, stats, total };
  });
