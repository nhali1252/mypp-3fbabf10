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

// ─── DLQ recovery ─────────────────────────────────────────────────────────────

export type DlqMessage = {
  msg_id: number;
  enqueued_at: string;
  read_ct: number;
  source_queue: "auth_emails" | "transactional_emails";
  payload: {
    message_id?: string;
    to?: string;
    label?: string;
    subject?: string;
    queued_at?: string;
  };
  error_message: string | null;
};

const DLQ_QUEUES: Array<"auth_emails" | "transactional_emails"> = [
  "auth_emails",
  "transactional_emails",
];

/** Admin: peek both DLQ queues without consuming. */
export const listDlqMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ limit: z.number().int().min(1).max(200).default(100) }).parse(data ?? {}),
  )
  .handler(async ({ data, context }): Promise<{ messages: DlqMessage[] }> => {
    await assertAdmin(context.supabase as any, context.userId);
    const sb = supabaseAdmin as any;

    const all: DlqMessage[] = [];
    for (const queue of DLQ_QUEUES) {
      const dlqName = `${queue}_dlq`;
      const { data: rows, error } = await sb.rpc("peek_dlq", {
        dlq_name: dlqName,
        lim: data.limit,
      });
      if (error) {
        console.warn(`[email-logs.listDlqMessages] peek failed for ${dlqName}`, error);
        continue;
      }
      for (const r of (rows ?? []) as any[]) {
        all.push({
          msg_id: Number(r.msg_id),
          enqueued_at: r.enqueued_at,
          read_ct: Number(r.read_ct ?? 0),
          source_queue: queue,
          payload: r.message ?? {},
          error_message: null,
        });
      }
    }

    // Enrich with latest error_message from email_send_log keyed by payload.message_id
    const ids = Array.from(
      new Set(all.map((m) => m.payload.message_id).filter((x): x is string => !!x)),
    );
    if (ids.length > 0) {
      const { data: logs } = await sb
        .from("email_send_log")
        .select("message_id, status, error_message, created_at")
        .in("message_id", ids)
        .in("status", ["dlq", "failed"])
        .order("created_at", { ascending: false });
      const errByMid = new Map<string, string>();
      for (const r of (logs ?? []) as any[]) {
        if (r.message_id && !errByMid.has(r.message_id) && r.error_message) {
          errByMid.set(r.message_id, r.error_message);
        }
      }
      for (const m of all) {
        if (m.payload.message_id) {
          m.error_message = errByMid.get(m.payload.message_id) ?? null;
        }
      }
    }

    all.sort((a, b) => (a.enqueued_at < b.enqueued_at ? 1 : -1));
    return { messages: all };
  });

/** Admin: requeue a single DLQ message back into its source queue. */
export const requeueDlqMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        msg_id: z.number().int().nonnegative(),
        source_queue: z.enum(["auth_emails", "transactional_emails"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }): Promise<{ ok: true; new_msg_id: number | null }> => {
    await assertAdmin(context.supabase as any, context.userId);
    const sb = supabaseAdmin as any;
    const dlqName = `${data.source_queue}_dlq`;

    // Read payload first so we can write a recovery log entry.
    const { data: rows } = await sb.rpc("peek_dlq", { dlq_name: dlqName, lim: 200 });
    const found = ((rows ?? []) as any[]).find((r) => Number(r.msg_id) === data.msg_id);

    const { data: newId, error } = await sb.rpc("requeue_from_dlq", {
      dlq_name: dlqName,
      target_queue: data.source_queue,
      message_id: data.msg_id,
    });
    if (error) throw new Error(error.message);

    // Refresh queued_at and stamp a fresh "pending" log so the dashboard shows the new attempt.
    if (found?.message?.message_id) {
      try {
        await sb.from("email_send_log").insert({
          message_id: found.message.message_id,
          template_name: found.message.label || data.source_queue,
          recipient_email: found.message.to || "",
          status: "pending",
          error_message: "Requeued from DLQ by admin",
        });
      } catch (e) {
        console.warn("[email-logs.requeueDlqMessage] log insert failed", e);
      }
    }
    return { ok: true, new_msg_id: newId === null ? null : Number(newId) };
  });

/** Admin: permanently drop a DLQ message. */
export const purgeDlqMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        msg_id: z.number().int().nonnegative(),
        source_queue: z.enum(["auth_emails", "transactional_emails"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertAdmin(context.supabase as any, context.userId);
    const sb = supabaseAdmin as any;
    const { error } = await sb.rpc("delete_email", {
      queue_name: `${data.source_queue}_dlq`,
      message_id: data.msg_id,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── Retry-policy config ──────────────────────────────────────────────────────

export type RetryConfig = {
  max_retries: number;
  batch_size: number;
  send_delay_ms: number;
  auth_email_ttl_minutes: number;
  transactional_email_ttl_minutes: number;
};

export const getRetryConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RetryConfig> => {
    await assertAdmin(context.supabase as any, context.userId);
    const { data, error } = await (supabaseAdmin as any)
      .from("email_send_state")
      .select(
        "max_retries, batch_size, send_delay_ms, auth_email_ttl_minutes, transactional_email_ttl_minutes",
      )
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return {
      max_retries: data?.max_retries ?? 5,
      batch_size: data?.batch_size ?? 10,
      send_delay_ms: data?.send_delay_ms ?? 200,
      auth_email_ttl_minutes: data?.auth_email_ttl_minutes ?? 15,
      transactional_email_ttl_minutes: data?.transactional_email_ttl_minutes ?? 60,
    };
  });

export const updateRetryConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        max_retries: z.number().int().min(1).max(20),
        batch_size: z.number().int().min(1).max(200).optional(),
        send_delay_ms: z.number().int().min(0).max(5000).optional(),
        auth_email_ttl_minutes: z.number().int().min(1).max(1440).optional(),
        transactional_email_ttl_minutes: z.number().int().min(1).max(1440).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertAdmin(context.supabase as any, context.userId);
    const { error } = await (supabaseAdmin as any)
      .from("email_send_state")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
