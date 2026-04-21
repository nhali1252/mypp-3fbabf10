import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  FolderKanban, GraduationCap, Activity, Inbox, Image as ImageIcon,
  Sparkles, User, PhoneCall,
} from "lucide-react";

export const Route = createFileRoute("/_admin/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const [stats, setStats] = useState({
    projects: 0, education: 0, activities: 0, messages: 0,
    media: 0, unread: 0,
  });
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [p, ed, ac, m, md, unread, recentMsgs] = await Promise.all([
        supabase.from("projects").select("id", { count: "exact", head: true }),
        supabase.from("education").select("id", { count: "exact", head: true }),
        supabase.from("activities").select("id", { count: "exact", head: true }),
        supabase.from("messages").select("id", { count: "exact", head: true }),
        supabase.from("media").select("id", { count: "exact", head: true }),
        supabase.from("messages").select("id", { count: "exact", head: true }).eq("is_read", false),
        supabase.from("messages").select("*").order("created_at", { ascending: false }).limit(5),
      ]);
      setStats({
        projects: p.count ?? 0,
        education: ed.count ?? 0,
        activities: ac.count ?? 0,
        messages: m.count ?? 0,
        media: md.count ?? 0,
        unread: unread.count ?? 0,
      });
      setRecent(recentMsgs.data ?? []);
    })();
  }, []);

  const cards = [
    { label: "Projects", value: stats.projects, Icon: FolderKanban, to: "/admin/projects" as const },
    { label: "Education", value: stats.education, Icon: GraduationCap, to: "/admin/education" as const },
    { label: "Activities", value: stats.activities, Icon: Activity, to: "/admin/activities" as const },
    {
      label: "Messages",
      value: stats.messages,
      sub: stats.unread ? `${stats.unread} unread` : undefined,
      Icon: Inbox,
      to: "/admin/messages" as const,
    },
    { label: "Media items", value: stats.media, Icon: ImageIcon, to: "/admin/media" as const },
  ];

  const quickEdits = [
    { label: "Edit Hero", Icon: Sparkles, to: "/admin/hero" as const },
    { label: "Edit About", Icon: User, to: "/admin/about" as const },
    { label: "Edit Projects", Icon: FolderKanban, to: "/admin/projects" as const },
    { label: "Edit Education", Icon: GraduationCap, to: "/admin/education" as const },
    { label: "Edit Contact", Icon: PhoneCall, to: "/admin/contact" as const },
  ];

  return (
    <div className="space-y-8 max-w-5xl">
      <header>
        <h1 className="text-3xl font-black mb-1">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Overview of your portfolio content.</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            to={c.to}
            className="bg-card border border-border rounded-2xl p-5 hover:border-primary/50 transition"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</span>
              <div className="w-9 h-9 rounded-xl bg-primary/15 grid place-items-center">
                <c.Icon size={16} className="text-primary" />
              </div>
            </div>
            <div className="text-3xl font-black">{c.value}</div>
            {c.sub && <div className="text-xs text-primary mt-1">{c.sub}</div>}
          </Link>
        ))}
      </div>

      <section className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-bold mb-4">Quick edits</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {quickEdits.map((q) => (
            <Link
              key={q.label}
              to={q.to}
              className="border border-border rounded-xl p-4 hover:bg-muted/40 transition flex flex-col items-center gap-2 text-center"
            >
              <q.Icon className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold">{q.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">Recent messages</h2>
          <Link to="/admin/messages" className="text-xs font-semibold text-primary hover:underline">
            View all →
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No messages yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {recent.map((m) => (
              <li key={m.id} className="py-3 flex justify-between gap-4 text-sm">
                <div className="min-w-0">
                  <div className="font-semibold truncate">
                    {m.name} <span className="text-muted-foreground font-normal">· {m.email}</span>
                  </div>
                  <div className="text-muted-foreground truncate">{m.subject || m.message}</div>
                </div>
                <div className="text-xs text-muted-foreground shrink-0">
                  {new Date(m.created_at).toLocaleDateString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
