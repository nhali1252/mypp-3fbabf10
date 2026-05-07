/**
 * Server functions for the Feed social layer:
 *  - reactions (toggle, list)
 *  - comments (list, post, edit, delete)
 *  - reports (file)
 *
 * Authenticity rules baked in:
 *  - everything except read requires a signed-in Supabase user (RLS + middleware)
 *  - server-side validation via Zod (length, basic shape)
 *  - light profanity / spam screen — flagged comments stored as `hidden`
 *  - duplicate detection: same user + same item + same body within 5 min is rejected
 *  - posting throttle: max 5 comments per user per minute
 *  - reactions are unique per (item, user, kind) — a user can toggle but not spam
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabasePublic } from "@/integrations/supabase/client.public";

const REACTIONS = ["like", "fire", "love", "wow"] as const;
type ReactionKind = (typeof REACTIONS)[number];

const itemIdSchema = z.string().min(1).max(120).regex(/^[\w-]+$/, "Bad item id");
const reactionSchema = z.enum(REACTIONS);

// Tiny in-house list — pluggable. Doesn't need to be exhaustive; admin can hide
// anything the filter misses. Whole-word match, case-insensitive.
const PROFANITY = [
  "fuck", "shit", "bitch", "asshole", "bastard", "dick", "cunt", "slut",
  "whore", "nigger", "faggot", "retard",
];
function looksAbusive(text: string): boolean {
  const lower = text.toLowerCase();
  for (const w of PROFANITY) {
    const re = new RegExp(`\\b${w}\\b`, "i");
    if (re.test(lower)) return true;
  }
  // crude spam: too many links, or shouting in long messages
  const linkCount = (lower.match(/https?:\/\//g) ?? []).length;
  if (linkCount >= 3) return true;
  const letters = text.replace(/[^a-zA-Z]/g, "");
  if (letters.length > 30) {
    const upper = letters.replace(/[^A-Z]/g, "").length;
    if (upper / letters.length > 0.7) return true;
  }
  return false;
}

// ---------- REACTIONS ------------------------------------------------------

/** Public — counts of every reaction on an item, plus the caller's own set. */
export const listReactions = createServerFn({ method: "GET" })
  .inputValidator((data: { item_id: string }) => ({
    item_id: itemIdSchema.parse(data.item_id),
  }))
  .handler(async ({ data }) => {
    const { data: rows, error } = await supabasePublic
      .from("feed_reactions")
      .select("reaction, user_id")
      .eq("item_id", data.item_id);
    if (error) throw new Error(error.message);
    const counts: Record<ReactionKind, number> = { like: 0, fire: 0, love: 0, wow: 0 };
    for (const r of rows ?? []) {
      const k = r.reaction as ReactionKind;
      if (k in counts) counts[k] += 1;
    }
    return { counts };
  });

/** Auth — toggle a reaction (insert if missing, delete if present). */
export const toggleReaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { item_id: string; reaction: ReactionKind }) => ({
    item_id: itemIdSchema.parse(data.item_id),
    reaction: reactionSchema.parse(data.reaction),
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing, error: selErr } = await supabase
      .from("feed_reactions")
      .select("id")
      .eq("item_id", data.item_id)
      .eq("user_id", userId)
      .eq("reaction", data.reaction)
      .maybeSingle();
    if (selErr) throw new Error(selErr.message);

    if (existing) {
      const { error } = await supabase.from("feed_reactions").delete().eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { active: false };
    }
    const { error } = await supabase.from("feed_reactions").insert({
      item_id: data.item_id,
      user_id: userId,
      reaction: data.reaction,
    });
    if (error) throw new Error(error.message);
    return { active: true };
  });

/** Auth — every reaction this user has on a given item (for highlighted state). */
export const listMyReactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { item_id: string }) => ({
    item_id: itemIdSchema.parse(data.item_id),
  }))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("feed_reactions")
      .select("reaction")
      .eq("item_id", data.item_id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { mine: (rows ?? []).map((r) => r.reaction as ReactionKind) };
  });

// ---------- COMMENTS -------------------------------------------------------

export type CommentRow = {
  id: string;
  item_id: string;
  user_id: string;
  parent_id: string | null;
  body: string;
  status: "visible" | "hidden" | "reported" | "deleted";
  edited_at: string | null;
  created_at: string;
  author: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    verified: boolean;
  } | null;
};

/** Public — list visible comments for an item, attaching profile info. */
export const listComments = createServerFn({ method: "GET" })
  .inputValidator((data: { item_id: string }) => ({
    item_id: itemIdSchema.parse(data.item_id),
  }))
  .handler(async ({ data }): Promise<{ comments: CommentRow[] }> => {
    const { data: rows, error } = await supabasePublic
      .from("feed_comments")
      .select("id, item_id, user_id, parent_id, body, status, edited_at, created_at")
      .eq("item_id", data.item_id)
      .eq("status", "visible")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);

    const userIds = Array.from(new Set((rows ?? []).map((r) => r.user_id)));
    let profiles: Record<string, CommentRow["author"]> = {};
    if (userIds.length) {
      const { data: profs } = await supabasePublic
        .from("profiles")
        .select("id, display_name, avatar_url, verified")
        .in("id", userIds);
      for (const p of profs ?? []) {
        profiles[p.id] = {
          id: p.id,
          display_name: p.display_name,
          avatar_url: p.avatar_url,
          verified: !!p.verified,
        };
      }
    }
    const comments: CommentRow[] = (rows ?? []).map((r) => ({
      ...(r as any),
      author: profiles[r.user_id] ?? null,
    }));
    return { comments };
  });

const postCommentSchema = z.object({
  item_id: itemIdSchema,
  body: z.string().trim().min(1).max(1000),
  parent_id: z.string().uuid().nullable().optional(),
});

export const postComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { item_id: string; body: string; parent_id?: string | null }) =>
    postCommentSchema.parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Throttle: max 5 comments per user per 60s.
    const since = new Date(Date.now() - 60_000).toISOString();
    const { count: recent } = await supabase
      .from("feed_comments")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", since);
    if ((recent ?? 0) >= 5) {
      throw new Error("You're commenting too quickly. Please wait a moment.");
    }

    // Duplicate detection: same body + same item within last 5 min.
    const dupSince = new Date(Date.now() - 5 * 60_000).toISOString();
    const { data: dup } = await supabase
      .from("feed_comments")
      .select("id")
      .eq("user_id", userId)
      .eq("item_id", data.item_id)
      .eq("body", data.body)
      .gte("created_at", dupSince)
      .maybeSingle();
    if (dup) throw new Error("Looks like a duplicate of a recent comment.");

    const status = looksAbusive(data.body) ? "hidden" : "visible";
    const { data: inserted, error } = await supabase
      .from("feed_comments")
      .insert({
        item_id: data.item_id,
        user_id: userId,
        parent_id: data.parent_id ?? null,
        body: data.body,
        status,
      })
      .select("id, status")
      .single();
    if (error) throw new Error(error.message);
    return { id: inserted.id, status: inserted.status };
  });

const editCommentSchema = z.object({
  id: z.string().uuid(),
  body: z.string().trim().min(1).max(1000),
});

export const editComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; body: string }) => editCommentSchema.parse(data))
  .handler(async ({ data, context }) => {
    const status = looksAbusive(data.body) ? "hidden" : "visible";
    const { error } = await context.supabase
      .from("feed_comments")
      .update({ body: data.body, edited_at: new Date().toISOString(), status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true, status };
  });

export const deleteComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; reason?: string }) => ({
    id: z.string().uuid().parse(data.id),
    reason: data.reason ? z.string().trim().max(500).parse(data.reason) : undefined,
  }))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    // Snapshot the row before deletion so the audit log keeps a trace.
    const { data: snap } = await sb
      .from("feed_comments")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    const { error } = await sb.from("feed_comments").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await logModeration(sb, context.userId, "comment", data.id, "delete", data.reason, snap);
    return { ok: true };
  });

const reportCommentSchema = z.object({
  comment_id: z.string().uuid(),
  reason: z.string().trim().min(3).max(500),
});

export const reportComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { comment_id: string; reason: string }) =>
    reportCommentSchema.parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("feed_comment_reports").insert({
      comment_id: data.comment_id,
      reporter_id: context.userId,
      reason: data.reason,
    });
    if (error) {
      // Unique violation = already reported.
      if (error.code === "23505") return { ok: true, already: true };
      throw new Error(error.message);
    }
    // Auto-flag the comment so admins see it without having to dig.
    await context.supabase
      .from("feed_comments")
      .update({ status: "reported" })
      .eq("id", data.comment_id)
      .eq("status", "visible");
    return { ok: true, already: false };
  });

// ---------- ADMIN MODERATION ----------------------------------------------

async function assertAdmin(sb: any, userId: string) {
  const { data, error } = await sb
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error("Role check failed");
  if (!data) throw new Error("Forbidden — admin only");
}

/**
 * Append-only moderation audit log writer. Failures are swallowed (logged) so
 * a logging hiccup never blocks the actual moderation action — the underlying
 * `moderation_log` table also enforces append-only access via RLS.
 */
async function logModeration(
  sb: any,
  moderatorId: string,
  targetType: "comment" | "review",
  targetId: string,
  action: "approve" | "hide" | "delete" | "feature" | "reject" | "restore" | "publish" | "unpublish",
  reason: string | undefined,
  snapshot: unknown,
) {
  try {
    await sb.from("moderation_log").insert({
      moderator_id: moderatorId,
      target_type: targetType,
      target_id: targetId,
      action,
      reason: reason ?? null,
      snapshot: (snapshot as object | null) ?? null,
    });
  } catch (err) {
    console.error("[moderation_log] failed to record action", { action, targetType, targetId, err });
  }
}

export const adminListComments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { status?: "visible" | "hidden" | "reported" } | undefined) => ({
    status: data?.status,
  }))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    await assertAdmin(sb, context.userId);
    let q = sb
      .from("feed_comments")
      .select("id, item_id, user_id, parent_id, body, status, edited_at, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const userIds = Array.from(new Set((rows ?? []).map((r) => r.user_id)));
    let profiles: Record<string, any> = {};
    if (userIds.length) {
      const { data: profs } = await sb
        .from("profiles")
        .select("id, display_name, avatar_url, verified")
        .in("id", userIds);
      for (const p of profs ?? []) profiles[p.id] = p;
    }

    // Counts of reports per comment.
    const ids = (rows ?? []).map((r) => r.id);
    let reportsByComment: Record<string, number> = {};
    if (ids.length) {
      const { data: reps } = await sb
        .from("feed_comment_reports")
        .select("comment_id")
        .in("comment_id", ids);
      for (const r of reps ?? []) {
        reportsByComment[r.comment_id] = (reportsByComment[r.comment_id] ?? 0) + 1;
      }
    }

    return {
      comments: (rows ?? []).map((r) => ({
        ...r,
        author: profiles[r.user_id] ?? null,
        report_count: reportsByComment[r.id] ?? 0,
      })),
    };
  });

export const adminSetCommentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; status: "visible" | "hidden"; reason?: string }) => ({
    id: z.string().uuid().parse(data.id),
    status: z.enum(["visible", "hidden"]).parse(data.status),
    reason: data.reason ? z.string().trim().max(500).parse(data.reason) : undefined,
  }))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    await assertAdmin(sb, context.userId);
    const { data: snap } = await sb
      .from("feed_comments")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    const { error } = await sb
      .from("feed_comments")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await logModeration(
      context.userId,
      "comment",
      data.id,
      data.status === "visible" ? "approve" : "hide",
      data.reason,
      snap,
    );
    return { ok: true };
  });

// --- Reviews moderation (audited) -----------------------------------------

export const adminModerateReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      id: string;
      action: "approve" | "feature" | "reject" | "publish" | "unpublish";
      reason?: string;
    }) => ({
      id: z.string().uuid().parse(data.id),
      action: z.enum(["approve", "feature", "reject", "publish", "unpublish"]).parse(data.action),
      reason: data.reason ? z.string().trim().max(500).parse(data.reason) : undefined,
    }),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    await assertAdmin(sb, context.userId);
    const { data: snap } = await sb
      .from("testimonials")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();

    let patch: Record<string, unknown> = {};
    switch (data.action) {
      case "approve":
        patch = { status: "approved", published: true };
        break;
      case "feature":
        patch = { status: "featured", published: true, featured: true };
        break;
      case "reject":
        patch = { status: "rejected", published: false, featured: false };
        break;
      case "publish":
        patch = { published: true };
        break;
      case "unpublish":
        patch = { published: false };
        break;
    }
    const { error } = await sb.from("testimonials").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    await logModeration(sb, context.userId, "review", data.id, data.action, data.reason, snap);
    return { ok: true };
  });

// --- Audit log read --------------------------------------------------------

export const adminListModerationLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { target_type?: "comment" | "review"; limit?: number } | undefined) => ({
      target_type: data?.target_type,
      limit: Math.min(200, Math.max(1, data?.limit ?? 100)),
    }),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    await assertAdmin(sb, context.userId);
    let q = sb
      .from("moderation_log")
      .select("id, moderator_id, target_type, target_id, action, reason, created_at")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.target_type) q = q.eq("target_type", data.target_type);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const modIds = Array.from(
      new Set((rows ?? []).map((r: any) => r.moderator_id as string)),
    ) as string[];
    let profiles: Record<string, any> = {};
    if (modIds.length) {
      const { data: profs } = await sb
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", modIds);
      for (const p of profs ?? []) profiles[p.id] = p;
    }
    return {
      entries: (rows ?? []).map((r: any) => ({ ...r, moderator: profiles[r.moderator_id] ?? null })),
    };
  });

export const adminVerifyUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { user_id: string; verified: boolean }) => ({
    user_id: z.string().uuid().parse(data.user_id),
    verified: z.boolean().parse(data.verified),
  }))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    await assertAdmin(sb, context.userId);
    const { error } = await sb
      .from("profiles")
      .update({ verified: data.verified })
      .eq("id", data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
