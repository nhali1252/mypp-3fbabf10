import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Send, MoreVertical, Trash2, Pencil, Flag, BadgeCheck, Reply, ArrowDownUp } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import {
  listComments,
  postComment,
  deleteComment,
  editComment,
  reportComment,
  type CommentRow,
} from "@/lib/fns/feed-social.functions";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function timeAgo(iso: string): string {
  const d = new Date(iso).getTime();
  const s = Math.max(1, Math.round((Date.now() - d) / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.round(s / 60)}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  if (s < 86400 * 7) return `${Math.round(s / 86400)}d`;
  return new Date(iso).toLocaleDateString();
}

type Sort = "newest" | "top";

export function CommentThread({ itemId, variant = "light" }: { itemId: string; variant?: "light" | "dark" }) {
  const qc = useQueryClient();
  const { user, isAdmin } = useAuth();
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [sort, setSort] = useState<Sort>("newest");

  const commentsQ = useQuery({
    queryKey: ["feed_comments", itemId],
    queryFn: () => listComments({ data: { item_id: itemId } }),
    staleTime: 5_000,
  });
  const all = commentsQ.data?.comments ?? [];

  const tree = useMemo(() => {
    const byParent: Record<string, CommentRow[]> = { __root: [] };
    for (const c of all) {
      const k = c.parent_id ?? "__root";
      (byParent[k] ??= []).push(c);
    }
    const roots = byParent.__root ?? [];
    if (sort === "top") {
      // No reaction count on comments; "top" approximates by reply count + recency.
      roots.sort(
        (a, b) =>
          (byParent[b.id]?.length ?? 0) - (byParent[a.id]?.length ?? 0) ||
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    }
    return { roots, byParent };
  }, [all, sort]);

  const post = useMutation({
    mutationFn: async () =>
      postComment({
        data: { item_id: itemId, body: body.trim(), parent_id: replyTo?.id ?? null },
      }),
    onSuccess: (res) => {
      setBody("");
      setReplyTo(null);
      if (res.status === "hidden") {
        toast.warning("Posted, but flagged for review", {
          description: "Our filter held it back. An admin will take a look.",
        });
      } else {
        toast.success("Comment posted");
      }
      qc.invalidateQueries({ queryKey: ["feed_comments", itemId] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Couldn't post"),
  });

  const isDark = variant === "dark";
  const wrapCls = isDark ? "text-white" : "text-foreground";
  const cardBg = isDark ? "bg-white/5 border-white/10" : "bg-card border-border";
  const muted = isDark ? "text-white/55" : "text-muted-foreground";

  return (
    <div className={`space-y-4 ${wrapCls}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-bold uppercase tracking-[0.22em]">
          {all.length} {all.length === 1 ? "comment" : "comments"}
        </div>
        <button
          type="button"
          onClick={() => setSort((s) => (s === "newest" ? "top" : "newest"))}
          className={`inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.2em] ${muted} hover:opacity-100`}
        >
          <ArrowDownUp className="w-3 h-3" />
          {sort === "newest" ? "Newest" : "Top"}
        </button>
      </div>

      {/* Composer */}
      {user ? (
        <div className={`rounded-xl border p-3 space-y-2 ${cardBg}`}>
          {replyTo && (
            <div className={`text-[11px] ${muted} flex items-center justify-between`}>
              <span>
                Replying to <strong className={isDark ? "text-white" : "text-foreground"}>{replyTo.name}</strong>
              </span>
              <button onClick={() => setReplyTo(null)} className="underline">
                Cancel
              </button>
            </div>
          )}
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, 1000))}
            placeholder="Write a thoughtful comment…"
            rows={2}
            className={isDark ? "bg-black/30 border-white/15 text-white placeholder:text-white/40" : ""}
          />
          <div className="flex items-center justify-between gap-2">
            <span className={`text-[10px] font-mono ${muted}`}>{body.length}/1000</span>
            <Button
              size="sm"
              onClick={() => post.mutate()}
              disabled={post.isPending || body.trim().length < 1}
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              {post.isPending ? "Posting…" : "Post"}
            </Button>
          </div>
        </div>
      ) : (
        <div className={`rounded-xl border p-4 text-sm ${cardBg}`}>
          <p className={muted}>
            Comments are open to verified accounts only — keeps the conversation real.
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center mt-2 text-xs font-bold uppercase tracking-[0.22em] text-primary hover:opacity-80"
          >
            Sign in to comment →
          </Link>
        </div>
      )}

      {/* List */}
      {commentsQ.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`h-16 rounded-xl border animate-pulse ${cardBg}`} />
          ))}
        </div>
      ) : tree.roots.length === 0 ? (
        <p className={`text-sm ${muted} text-center py-6`}>Be the first to comment.</p>
      ) : (
        <ul className="space-y-3">
          {tree.roots.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              replies={tree.byParent[c.id] ?? []}
              onReply={(name) => setReplyTo({ id: c.id, name })}
              isAdmin={isAdmin}
              currentUserId={user?.id ?? null}
              variant={variant}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function CommentItem({
  comment,
  replies,
  onReply,
  isAdmin,
  currentUserId,
  variant,
}: {
  comment: CommentRow;
  replies: CommentRow[];
  onReply: (authorName: string) => void;
  isAdmin: boolean;
  currentUserId: string | null;
  variant: "light" | "dark";
}) {
  const qc = useQueryClient();
  const isMine = currentUserId === comment.user_id;
  const canEdit = isMine && new Date(comment.created_at).getTime() > Date.now() - 15 * 60_000;
  const canDelete = isMine || isAdmin;
  const isDark = variant === "dark";
  const muted = isDark ? "text-white/55" : "text-muted-foreground";
  const cardBg = isDark ? "bg-white/5 border-white/10" : "bg-card border-border";

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);
  const [menuOpen, setMenuOpen] = useState(false);

  const del = useMutation({
    mutationFn: async () => deleteComment({ data: { id: comment.id } }),
    onSuccess: () => {
      toast.success("Comment removed");
      qc.invalidateQueries({ queryKey: ["feed_comments", comment.item_id] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Couldn't delete"),
  });

  const edit = useMutation({
    mutationFn: async () => editComment({ data: { id: comment.id, body: draft.trim() } }),
    onSuccess: () => {
      setEditing(false);
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["feed_comments", comment.item_id] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Couldn't save"),
  });

  const report = useMutation({
    mutationFn: async () => {
      const reason = window.prompt("Why are you reporting this comment?");
      if (!reason) throw new Error("Cancelled");
      return reportComment({ data: { comment_id: comment.id, reason } });
    },
    onSuccess: (res) => {
      toast.success(res.already ? "Already reported — thanks." : "Report sent. An admin will review.");
    },
    onError: (e: any) => {
      if (e?.message !== "Cancelled") toast.error(e?.message ?? "Couldn't report");
    },
  });

  const author = comment.author;
  const name = author?.display_name?.trim() || "Anonymous";
  const initial = name.slice(0, 1).toUpperCase();

  return (
    <li className={`rounded-xl border p-3 ${cardBg}`}>
      <div className="flex items-start gap-3">
        <div className="shrink-0 h-9 w-9 rounded-full overflow-hidden bg-muted grid place-items-center text-xs font-bold">
          {author?.avatar_url ? (
            <img src={author.avatar_url} alt={name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
          ) : (
            <span>{initial}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-bold truncate">{name}</span>
            {author?.verified && (
              <span title="Verified" className="inline-flex">
                <BadgeCheck className="w-3.5 h-3.5 text-primary" />
              </span>
            )}
            <span className={muted}>· {timeAgo(comment.created_at)}</span>
            {comment.edited_at && <span className={muted}>· edited</span>}
            <div className="ml-auto relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Comment actions"
                className={`p-1 rounded-md ${isDark ? "hover:bg-white/10" : "hover:bg-muted"}`}
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
              {menuOpen && (
                <div
                  className={`absolute right-0 top-full mt-1 z-20 min-w-[150px] rounded-lg border shadow-lg py-1 text-xs ${isDark ? "bg-black/95 border-white/10 text-white" : "bg-popover border-border text-foreground"}`}
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  {canEdit && (
                    <button
                      onClick={() => { setEditing(true); setMenuOpen(false); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-muted/30 inline-flex items-center gap-2"
                    >
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => { setMenuOpen(false); del.mutate(); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-muted/30 inline-flex items-center gap-2 text-destructive"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  )}
                  {!isMine && currentUserId && (
                    <button
                      onClick={() => { setMenuOpen(false); report.mutate(); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-muted/30 inline-flex items-center gap-2"
                    >
                      <Flag className="w-3 h-3" /> Report
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {editing ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value.slice(0, 1000))}
                rows={2}
                className={isDark ? "bg-black/30 border-white/15 text-white" : ""}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => edit.mutate()} disabled={edit.isPending}>Save</Button>
                <Button size="sm" variant="outline" onClick={() => { setEditing(false); setDraft(comment.body); }}>Cancel</Button>
              </div>
            </div>
          ) : (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 text-sm leading-relaxed whitespace-pre-line break-words"
            >
              {comment.body}
            </motion.p>
          )}

          {currentUserId && !editing && (
            <button
              type="button"
              onClick={() => onReply(name)}
              className={`mt-2 text-[10px] font-mono uppercase tracking-[0.2em] ${muted} hover:text-primary inline-flex items-center gap-1`}
            >
              <Reply className="w-3 h-3" /> Reply
            </button>
          )}

          {replies.length > 0 && (
            <ul className={`mt-3 space-y-2 pl-3 border-l ${isDark ? "border-white/10" : "border-border"}`}>
              {replies.map((r) => (
                <CommentItem
                  key={r.id}
                  comment={r}
                  replies={[]}
                  onReply={onReply}
                  isAdmin={isAdmin}
                  currentUserId={currentUserId}
                  variant={variant}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </li>
  );
}
