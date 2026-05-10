/**
 * Lightweight analytics widget for the admin dashboard.
 * Aggregates row counts from existing tables — no new schema required.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { prunePageViews } from "@/server/analytics.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Inbox, Heart, MessageSquare, FolderOpen, Briefcase, Image as ImageIcon, Eye, Trash2,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

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

type DayPoint = { day: string; views: number };

export function AdminStats() {
  const [s, setS] = useState<Stats | null>(null);
  const [topPages, setTopPages] = useState<{ path: string; views: number }[]>([]);
  const [series, setSeries] = useState<DayPoint[]>([]);

  useEffect(() => {
    (async () => {
      const now = Date.now();
      const d7 = new Date(now - 7 * 86400_000);
      const d30 = new Date(now - 30 * 86400_000);
      const d14 = new Date(now - 14 * 86400_000);

      const [
        messagesTotal, messagesUnread,
        reactions, comments,
        portfolioItems, projects, folders,
        views7d, views30d,
        recent,
        last14,
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
        supabase
          .from("page_views")
          .select("created_at")
          .gte("created_at", d14.toISOString())
          .limit(10000),
      ]);

      const tally = new Map<string, number>();
      for (const r of (recent.data ?? []) as { path: string }[]) {
        tally.set(r.path, (tally.get(r.path) ?? 0) + 1);
      }
      const top = Array.from(tally.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([path, views]) => ({ path, views }));

      // Build a contiguous 14-day series (oldest → newest)
      const buckets = new Map<string, number>();
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now - i * 86400_000);
        buckets.set(d.toISOString().slice(0, 10), 0);
      }
      for (const r of (last14.data ?? []) as { created_at: string }[]) {
        const k = r.created_at.slice(0, 10);
        if (buckets.has(k)) buckets.set(k, (buckets.get(k) ?? 0) + 1);
      }
      const points: DayPoint[] = Array.from(buckets.entries()).map(([k, v]) => ({
        day: k.slice(5), // MM-DD
        views: v,
      }));

      setS({
        messagesTotal, messagesUnread,
        reactions, comments,
        portfolioItems, projects, folders,
        views7d, views30d,
      });
      setTopPages(top);
      setSeries(points);
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

      {series.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Page views — last 14 days
            </div>
            <div className="text-[11px] text-muted-foreground tabular-nums">
              {series.reduce((a, b) => a + b.views, 0).toLocaleString()} total
            </div>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#viewsFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

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
