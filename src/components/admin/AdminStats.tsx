/**
 * Lightweight analytics widget for the admin dashboard.
 * Aggregates row counts from existing tables — no new schema required.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Inbox, Heart, MessageSquare, FolderOpen, Briefcase, Star, Image as ImageIcon,
} from "lucide-react";

type Stats = {
  messagesTotal: number;
  messagesUnread: number;
  reactions: number;
  comments: number;
  portfolioItems: number;
  projects: number;
  folders: number;
  reviewsCount: number | null;
};

async function count(table: string, match?: Record<string, any>) {
  let q = supabase.from(table as any).select("*", { count: "exact", head: true });
  if (match) {
    for (const [k, v] of Object.entries(match)) q = q.eq(k, v);
  }
  const { count: c } = await q;
  return c ?? 0;
}

export function AdminStats() {
  const [s, setS] = useState<Stats | null>(null);

  useEffect(() => {
    (async () => {
      const [
        messagesTotal, messagesUnread,
        reactions, comments,
        portfolioItems, projects, folders,
      ] = await Promise.all([
        count("messages"),
        count("messages", { is_read: false }),
        count("feed_reactions"),
        count("feed_comments", { status: "visible" }),
        count("portfolio_items", { active: true }),
        count("projects", { published: true }),
        count("portfolio_folders", { active: true }),
      ]);
      setS({
        messagesTotal, messagesUnread,
        reactions, comments,
        portfolioItems, projects, folders,
        reviewsCount: null,
      });
    })();
  }, []);

  const items = [
    { icon: Inbox, label: "Messages", value: s?.messagesTotal, sub: s?.messagesUnread ? `${s.messagesUnread} unread` : "all read" },
    { icon: Heart, label: "Reactions", value: s?.reactions },
    { icon: MessageSquare, label: "Comments", value: s?.comments },
    { icon: ImageIcon, label: "Portfolio items", value: s?.portfolioItems },
    { icon: FolderOpen, label: "Folders", value: s?.folders },
    { icon: Briefcase, label: "Projects", value: s?.projects },
  ];

  return (
    <section>
      <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
        At a glance
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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
            {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
          </div>
        ))}
      </div>
    </section>
  );
}
