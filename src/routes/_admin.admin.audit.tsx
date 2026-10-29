import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminListModerationLog } from "@/lib/fns/feed-social.functions";
import { Loader2, MessageSquare, Star, Shield, FileX, Eye, EyeOff, Flag, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/audit")({
  component: AuditPage,
  head: () => ({ meta: [{ title: "Moderation audit log — Admin" }] }),
});

type Filter = "all" | "comment" | "review";

const ACTION_ICON: Record<string, any> = {
  approve: Eye,
  hide: EyeOff,
  delete: FileX,
  feature: Sparkles,
  reject: Flag,
  restore: Eye,
  publish: Eye,
  unpublish: EyeOff,
};

const ACTION_TONE: Record<string, string> = {
  approve: "bg-emerald-500/15 text-emerald-400",
  publish: "bg-emerald-500/15 text-emerald-400",
  feature: "bg-primary/15 text-primary",
  hide: "bg-zinc-500/15 text-zinc-400",
  unpublish: "bg-zinc-500/15 text-zinc-400",
  delete: "bg-rose-500/15 text-rose-400",
  reject: "bg-rose-500/15 text-rose-400",
  restore: "bg-sky-500/15 text-sky-400",
};

function AuditPage() {
  const [filter, setFilter] = useState<Filter>("all");

  const q = useQuery({
    queryKey: ["moderation_log", filter],
    queryFn: () =>
      adminListModerationLog({
        data: filter === "all" ? { limit: 150 } : { target_type: filter, limit: 150 },
      }),
  });

  const rows = q.data?.entries ?? [];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" /> Moderation audit log
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Append-only record of every approve, hide, feature, delete, publish or reject action
            taken on comments and reviews. Visible to admins only.
          </p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-full border border-border bg-card">
          {(["all", "comment", "review"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] rounded-full transition-colors ${
                filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? "All" : f + "s"}
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
          No moderation actions recorded yet.
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((entry: any) => {
            const Icon = ACTION_ICON[entry.action] ?? Shield;
            const TargetIcon = entry.target_type === "review" ? Star : MessageSquare;
            const tone = ACTION_TONE[entry.action] ?? "bg-muted text-muted-foreground";
            const snippet =
              entry.snapshot &&
              typeof entry.snapshot === "object"
                ? (entry.snapshot.body ?? entry.snapshot.review ?? "").toString().slice(0, 140)
                : "";
            return (
              <li
                key={entry.id}
                className="rounded-xl border border-border bg-card p-3 flex items-start gap-3"
              >
                <span
                  className={`shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full ${tone}`}
                >
                  <Icon className="w-4 h-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    <span className="font-bold uppercase tracking-[0.18em] text-[10px]">
                      {entry.action}
                    </span>
                    <span className="inline-flex items-center gap-1 text-muted-foreground text-[10px] uppercase tracking-[0.18em]">
                      <TargetIcon className="w-3 h-3" /> {entry.target_type}
                    </span>
                    <span className="text-muted-foreground">·</span>
                    <span className="font-bold text-foreground">
                      {entry.moderator?.display_name ?? "Unknown moderator"}
                    </span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground font-mono text-[10px]">
                      {new Date(entry.created_at).toLocaleString()}
                    </span>
                    <span className="ml-auto font-mono text-[10px] text-muted-foreground truncate max-w-[200px]">
                      #{entry.target_id.slice(0, 8)}
                    </span>
                  </div>
                  {snippet && (
                    <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{snippet}</p>
                  )}
                  {entry.reason && (
                    <p className="mt-1 text-xs text-rose-400">Reason: {entry.reason}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
