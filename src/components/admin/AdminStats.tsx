/**
 * Lightweight analytics widget for the admin dashboard.
 * Aggregates row counts from existing tables — no new schema required.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Inbox, Heart, MessageSquare, FolderOpen, Briefcase, Image as ImageIcon, Eye,
} from "lucide-react";

type Stats = {
  messagesTotal: number;
  messagesUnread: number;
  reactions: number;
  comments: number;
  portfolioItems: number;
  projects: number;
  folders: number;
  views7d: number;
  views30d: number;
};

async function count(table: string, match?: Record<string, any>) {
  let q = supabase.from(table as any).select("*", { count: "exact", head: true });
  if (match) for (const [k, v] of Object.entries(match)) q = q.eq(k, v);
  const { count: c } = await q;
  return c ?? 0;
}

async function countSince(table: string, since: Date) {
  const { count: c } = await supabase
    .from(table as any)
    .select("*", { count: "exact", head: true })
    .gte("created_at", since.toISOString());
  return c ?? 0;
}

export function AdminStats() {
  const [s, setS] = useState<Stats | null>(null);
  const [topPages, setTopPages] = useState<{ path: string; views: number }[]>([]);

  useEffect(() => {
    (async () => {
      const now = Date.now();
      const d7 = new Date(now - 7 * 86400_000);
      const d30 = new Date(now - 30 * 86400_000);

      const [
        messagesTotal, messagesUnread,
        reactions, comments,
        portfolioItems, projects, folders,
        views7d, views30d,
        recent,
      ] = await Promise.all([
        count("messages"),
        count("messages", { is_read: false }),
        count("feed_reactions"),
        count("feed_comments", { status: "visible" }),
        count("portfolio_items", { active: true }),
        count("projects", { published: true }),
        count("portfolio_folders", { active: true }),
        countSince("page_views", d7),
        countSince("page_views", d30),
        supabase
          .from("page_views")
          .select("path")
          .gte("created_at", d30.toISOString())
          .limit(1000),
      ]);

      const tally = new Map<string, number>();
      for (const r of (recent.data ?? []) as { path: string }[]) {
        tally.set(r.path, (tally.get(r.path) ?? 0) + 1);
      }
      const top = Array.from(tally.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([path, views]) => ({ path, views }));

      setS({
        messagesTotal, messagesUnread,
        reactions, comments,
        portfolioItems, projects, folders,
        views7d, views30d,
      });
      setTopPages(top);
    })();
  }, []);

  const items = [
    { icon: Eye, label: "Views (7d)", value: s?.views7d, sub: s ? `${s.views30d.toLocaleString()} in 30d` : undefined },
    { icon: Inbox, label: "Messages", value: s?.messagesTotal, sub: s?.messagesUnread ? `${s.messagesUnread} unread` : "all read" },
    { icon: Heart, label: "Reactions", value: s?.reactions },
    { icon: MessageSquare, label: "Comments", value: s?.comments },
    { icon: ImageIcon, label: "Portfolio", value: s?.portfolioItems },
    { icon: FolderOpen, label: "Folders", value: s?.folders },
    { icon: Briefcase, label: "Projects", value: s?.projects },
  ];

  return (
    <section className="space-y-4">
      <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        At a glance
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {items.map(({ icon: Icon, label, value, sub }) => (
          <div
            key={label}
            className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-1"
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <Icon className="h-4 w-4" />
              <span className="text-[10px] uppercase tracking-wider">{label}</span>
            </div>
            <div className="text-2xl font-black tabular-nums">
              {value === undefined ? "—" : value.toLocaleString()}
            </div>
            {sub && <div className="text-[11px] text-muted-foreground truncate">{sub}</div>}
          </div>
        ))}
      </div>

      {topPages.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Top pages (last 30 days)
          </div>
          <ul className="space-y-2 text-sm">
            {topPages.map((p) => (
              <li key={p.path} className="flex items-center justify-between gap-3">
                <span className="font-mono truncate">{p.path}</span>
                <span className="tabular-nums text-muted-foreground">{p.views.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
