import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { listMessages } from "@/server/messages.functions";
import { useAuth } from "@/hooks/useAuth";
import {
  FolderKanban, GraduationCap, Activity, Inbox, Image as ImageIcon,
  Sparkles, User, PhoneCall, ShieldCheck, ShieldAlert, ClipboardCheck,
  Rocket, Lightbulb, Compass, Search, Settings, Megaphone, AppWindow, Users as UsersIcon,
} from "lucide-react";

export const Route = createFileRoute("/_admin/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { user, isAdmin, isEditor, roles, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    projects: 0, education: 0, activities: 0, messages: 0, unread: 0,
  });
  const [recent, setRecent] = useState<any[]>([]);
  const list = useServerFn(listMessages);

  useEffect(() => {
    (async () => {
      const [p, ed, ac, msgs] = await Promise.all([
        supabase.from("projects").select("id", { count: "exact", head: true }),
        supabase.from("education").select("id", { count: "exact", head: true }),
        supabase.from("activities").select("id", { count: "exact", head: true }),
        list().catch(() => [] as any[]),
      ]);
      const messagesArr = Array.isArray(msgs) ? msgs : [];
      setStats({
        projects: p.count ?? 0,
        education: ed.count ?? 0,
        activities: ac.count ?? 0,
        messages: messagesArr.length,
        unread: messagesArr.filter((m: any) => !m.is_read).length,
      });
      setRecent(messagesArr.slice(0, 5));
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
  ];

  const quickEdits = [
    { label: "Welcome / Launcher", Icon: Rocket, to: "/admin/launcher" as const },
    { label: "Edit Hero", Icon: Sparkles, to: "/admin/hero" as const },
    { label: "Edit About", Icon: User, to: "/admin/about" as const },
    { label: "Edit Portfolio", Icon: FolderKanban, to: "/admin/portfolio" as const },
    { label: "Edit Projects", Icon: FolderKanban, to: "/admin/projects" as const },
    { label: "Edit Education", Icon: GraduationCap, to: "/admin/education" as const },
    { label: "Edit Skills", Icon: Lightbulb, to: "/admin/skills" as const },
    { label: "Edit Activities", Icon: Activity, to: "/admin/activities" as const },
    { label: "Edit Reviews", Icon: Sparkles, to: "/admin/reviews" as const },
    { label: "Edit Ticker", Icon: Megaphone, to: "/admin/ticker" as const },
    { label: "Edit Navigation", Icon: Compass, to: "/admin/navigation" as const },
    { label: "Edit Contact", Icon: PhoneCall, to: "/admin/contact" as const },
    { label: "Footer Apps", Icon: AppWindow, to: "/admin/footer-apps" as const },
    { label: "Media Library", Icon: ImageIcon, to: "/admin/media" as const },
    { label: "SEO Settings", Icon: Search, to: "/admin/seo" as const },
    { label: "Site Settings", Icon: Settings, to: "/admin/settings" as const },
    { label: "Manage Users", Icon: UsersIcon, to: "/admin/users" as const },
  ];

  const pageEditors = [
    {
      label: "Welcome page (/)",
      sub: "Launcher cards",
      Icon: Rocket,
      to: "/admin/launcher" as const,
      accent: "from-amber-400/30 to-rose-500/10",
    },
    {
      label: "About & Skills",
      sub: "Skills · About",
      Icon: Lightbulb,
      to: "/admin/about" as const,
      accent: "from-violet-500/30 to-fuchsia-500/10",
    },
    {
      label: "Portfolio",
      sub: "Folders & items",
      Icon: FolderKanban,
      to: "/admin/portfolio" as const,
      accent: "from-emerald-400/30 to-cyan-500/10",
    },
    {
      label: "Page /B",
      sub: "Hero · About · Contact",
      Icon: Sparkles,
      to: "/admin/hero" as const,
      accent: "from-sky-400/30 to-indigo-500/10",
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl">
      <header>
        <h1 className="text-3xl font-black mb-1">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Overview of your portfolio content.</p>
      </header>

      <section
        className={`rounded-2xl p-5 border flex flex-wrap items-center justify-between gap-4 ${
          isAdmin
            ? "border-primary/40 bg-primary/5"
            : "border-destructive/40 bg-destructive/5"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {isAdmin ? (
            <ShieldCheck className="w-6 h-6 text-primary shrink-0" />
          ) : (
            <ShieldAlert className="w-6 h-6 text-destructive shrink-0" />
          )}
          <div className="min-w-0">
            <div className="font-bold text-sm">
              {authLoading
                ? "Verifying admin access…"
                : isAdmin
                  ? "Admin access verified"
                  : "Admin role missing"}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              Signed in as <span className="font-mono">{user?.email}</span>
              {" · "}
              Roles: {roles.length ? roles.join(", ") : isEditor ? "editor" : "none"}
            </div>
          </div>
        </div>
        <Link
          to="/admin/checklist"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary hover:underline"
        >
          <ClipboardCheck className="w-4 h-4" /> Pre-publish checklist
        </Link>
      </section>

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
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">Edit pages</h2>
          <span className="text-xs text-muted-foreground">Jump straight into a page editor</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {pageEditors.map((p) => (
            <Link
              key={p.label}
              to={p.to}
              className={`relative overflow-hidden border border-border rounded-2xl p-5 hover:border-primary/50 transition group bg-gradient-to-br ${p.accent}`}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="w-10 h-10 rounded-xl bg-background/60 backdrop-blur grid place-items-center">
                  <p.Icon size={18} className="text-primary" />
                </div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground opacity-0 group-hover:opacity-100 transition">
                  Open →
                </span>
              </div>
              <div className="font-bold text-sm">{p.label}</div>
              <div className="text-xs text-muted-foreground">{p.sub}</div>
            </Link>
          ))}
        </div>
      </section>

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
