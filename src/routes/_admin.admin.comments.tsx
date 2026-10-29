import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminListComments, adminSetCommentStatus, deleteComment } from "@/lib/fns/feed-social.functions";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Trash2, Flag, BadgeCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/comments")({
  component: CommentsModerationPage,
  head: () => ({ meta: [{ title: "Comment moderation — Admin" }] }),
});

type Filter = "all" | "visible" | "hidden" | "reported";

function CommentsModerationPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("reported");

  const q = useQuery({
    queryKey: ["admin_comments", filter],
    queryFn: () =>
      adminListComments({
        data: filter === "all" ? {} : { status: filter },
      }),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "visible" | "hidden" }) =>
      adminSetCommentStatus({ data: { id, status } }),
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["admin_comments"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const del = useMutation({
    mutationFn: async (id: string) => deleteComment({ data: { id } }),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin_comments"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const rows = q.data?.comments ?? [];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Comment moderation</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review reported and hidden comments. Visible by default; flagged content is auto-hidden.
          </p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-full border border-border bg-card">
          {(["reported", "hidden", "visible", "all"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] rounded-full transition-colors ${
                filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      {q.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl text-sm text-muted-foreground">
          Nothing in this queue.
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((c: any) => (
            <li key={c.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-muted overflow-hidden grid place-items-center text-xs font-bold shrink-0">
                  {c.author?.avatar_url ? (
                    <img src={c.author.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span>{(c.author?.display_name ?? "?").slice(0, 1).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    <span className="font-bold">{c.author?.display_name ?? "Unknown"}</span>
                    {c.author?.verified && <BadgeCheck className="w-3.5 h-3.5 text-primary" />}
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground font-mono text-[10px] uppercase tracking-[0.18em]">
                      {new Date(c.created_at).toLocaleString()}
                    </span>
                    <span
                      className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-[0.18em] ${
                        c.status === "visible"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : c.status === "hidden"
                          ? "bg-zinc-500/15 text-zinc-400"
                          : "bg-rose-500/15 text-rose-400"
                      }`}
                    >
                      {c.status}
                    </span>
                    {c.report_count > 0 && (
                      <span className="inline-flex items-center gap-1 text-rose-400 text-[10px] font-bold">
                        <Flag className="w-3 h-3" /> {c.report_count}
                      </span>
                    )}
                    <span className="ml-auto text-muted-foreground font-mono text-[10px] truncate max-w-[180px]">
                      item: {c.item_id}
                    </span>
                  </div>
                  <p className="mt-2 text-sm whitespace-pre-line break-words">{c.body}</p>
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    {c.status !== "visible" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setStatus.mutate({ id: c.id, status: "visible" })}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1.5" /> Approve
                      </Button>
                    )}
                    {c.status !== "hidden" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setStatus.mutate({ id: c.id, status: "hidden" })}
                      >
                        <EyeOff className="w-3.5 h-3.5 mr-1.5" /> Hide
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (confirm("Delete this comment permanently?")) del.mutate(c.id);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                    </Button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
