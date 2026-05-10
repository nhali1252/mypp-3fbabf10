/**
 * Admin dashboard — page-block grid.
 *
 * One card per entry in PAGE_BLOCKS. Cards overlay metadata from the matching
 * `launcher_pages` row (thumbnail, accent gradient, badge) when one exists,
 * so the dashboard mirrors the public "Pick a page" launcher.
 *
 * Unknown launcher rows (slugs not in PAGE_BLOCKS) appear at the bottom in
 * an "Unregistered pages" strip so they're never silently lost — clicking
 * one routes through /admin/page/$slug with the empty-section placeholder.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { listMessages } from "@/server/messages.functions";
import { useAuth } from "@/hooks/useAuth";
import {
  ShieldCheck, ShieldAlert, ClipboardCheck, ArrowRight, Inbox,
  Sparkles, User, FolderOpen, Layers, Briefcase, Mail, Star,
  Plus, ChevronDown, ChevronUp, Database,
} from "lucide-react";
import { PAGE_BLOCKS, type PageBlock } from "@/admin/page-blocks";
import { AdminStats } from "@/components/admin/AdminStats";

export const Route = createFileRoute("/_admin/admin/")({
  component: AdminDashboard,
});

const ICON_MAP: Record<string, any> = {
  Sparkles, User, FolderOpen, Layers, Briefcase, Mail, Star,
};

type LauncherRow = {
  id: string;
  label: string | null;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  accent: string | null;
  badge: string | null;
  route: string | null;
};

function AdminDashboard() {
  const { user, isAdmin, isEditor, roles, loading: authLoading } = useAuth();
  const list = useServerFn(listMessages);

  const [unread, setUnread] = useState<number | null>(null);
  const [launcher, setLauncher] = useState<LauncherRow[]>([]);
  const [showLegacy, setShowLegacy] = useState(false);

  useEffect(() => {
    (async () => {
      const [msgs, lp] = await Promise.all([
        list().catch(() => [] as any[]),
        supabase.from("launcher_pages").select("*").order("sort_order"),
      ]);
      const arr = Array.isArray(msgs) ? msgs : msgs?.messages ?? [];
      setUnread(arr.filter((m: any) => !m.is_read).length);
      setLauncher((lp.data ?? []) as LauncherRow[]);
    })();
  }, [list]);

  // Match launcher rows to PAGE_BLOCKS by slug == lowercased label.
  const launcherBySlug = new Map<string, LauncherRow>();
  for (const row of launcher) {
    const slug = (row.label ?? "").toLowerCase().trim();
    if (slug) launcherBySlug.set(slug, row);
  }

  const knownSlugs = new Set(PAGE_BLOCKS.map((b) => b.slug));
  const unregistered = launcher.filter(
    (r) => !knownSlugs.has((r.label ?? "").toLowerCase().trim()),
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black mb-1">Pages</h1>
          <p className="text-muted-foreground text-sm">
            One card per page. Click to edit everything for that page in one place.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/launcher"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold hover:border-primary/40"
          >
            <Layers className="h-3.5 w-3.5" /> Manage modules
          </Link>
          <Link
            to="/admin/messages"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold hover:border-primary/40"
          >
            <Inbox className="h-3.5 w-3.5" />
            Inbox
            {unread ? (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                {unread}
              </span>
            ) : null}
          </Link>
          <Link
            to="/admin/checklist"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold hover:border-primary/40"
          >
            <ClipboardCheck className="h-3.5 w-3.5" /> Checklist
          </Link>
          <Link
            to="/admin/backup"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold hover:border-primary/40"
          >
            <Database className="h-3.5 w-3.5" /> Backup
          </Link>
        </div>
      </header>

      <section
        className={`rounded-2xl p-4 border flex flex-wrap items-center gap-3 text-sm ${
          isAdmin
            ? "border-primary/30 bg-primary/5"
            : "border-destructive/40 bg-destructive/5"
        }`}
      >
        {isAdmin
          ? <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
          : <ShieldAlert className="w-5 h-5 text-destructive shrink-0" />}
        <div className="min-w-0 flex-1">
          <div className="font-semibold">
            {authLoading
              ? "Verifying admin access…"
              : isAdmin ? "Admin access verified" : "Admin role missing"}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            <span className="font-mono">{user?.email}</span>
            {" · "}
            Roles: {roles.length ? roles.join(", ") : isEditor ? "editor" : "none"}
          </div>
        </div>
      </section>

      <AdminStats />

      {/* Page-block grid — the heart of the new admin. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PAGE_BLOCKS.map((block) => (
          <PageCard
            key={block.slug}
            block={block}
            launcher={launcherBySlug.get(block.slug)}
          />
        ))}
      </div>

      {unregistered.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Unregistered launcher pages
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {unregistered.map((row) => {
              const slug = (row.label ?? "").toLowerCase().trim() || row.id;
              return (
                <Link
                  key={row.id}
                  to="/admin/page/$slug"
                  params={{ slug }}
                  className="rounded-2xl border border-dashed border-border bg-card/60 p-4 hover:border-primary/40 transition"
                >
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-2">
                    <Plus className="h-3.5 w-3.5" /> Auto-card
                  </div>
                  <div className="font-semibold truncate">{row.title || row.label}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {row.description ?? "No editors registered yet — quote block available."}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-card">
        <button
          onClick={() => setShowLegacy((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-3 text-sm font-semibold"
        >
          <span>Legacy editors (still available while we migrate)</span>
          {showLegacy ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {showLegacy && (
          <div className="px-5 pb-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 text-sm">
            {LEGACY_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to as any}
                className="rounded-lg border border-border px-3 py-2 hover:bg-muted/40"
              >
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function PageCard({ block, launcher }: { block: PageBlock; launcher?: LauncherRow }) {
  const Icon = ICON_MAP[block.icon] ?? Sparkles;
  const accent = launcher?.accent ?? "from-primary/30 to-primary/5";
  const thumbnail = launcher?.thumbnail_url ?? null;
  const badge = launcher?.badge ?? null;

  return (
    <Link
      to="/admin/page/$slug"
      params={{ slug: block.slug }}
      className={`group relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${accent} p-5 transition hover:border-primary/50 hover:shadow-[0_20px_60px_-30px_color-mix(in_oklab,var(--primary)_60%,transparent)]`}
    >
      {thumbnail && (
        <div
          aria-hidden
          className="absolute inset-0 opacity-20 group-hover:opacity-30 transition"
          style={{
            backgroundImage: `url(${thumbnail})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      )}
      <div className="relative flex items-start justify-between mb-8">
        <div className="h-11 w-11 rounded-xl bg-background/70 backdrop-blur grid place-items-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        {badge && (
          <span className="rounded-full bg-background/70 backdrop-blur px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
            {badge}
          </span>
        )}
      </div>
      <div className="relative">
        <div className="font-bold text-lg">{block.title}</div>
        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{block.description}</div>
        <div className="mt-4 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {block.sections.length} section{block.sections.length === 1 ? "" : "s"}
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-primary opacity-0 group-hover:opacity-100 transition">
            Edit <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

/** Per-feature admin routes that haven't been migrated yet. Removed in Step 4. */
const LEGACY_LINKS: { to: string; label: string }[] = [
  { to: "/admin/launcher",     label: "Launcher" },
  { to: "/admin/hero",         label: "Hero" },
  { to: "/admin/about",        label: "About" },
  { to: "/admin/skills",       label: "Skills" },
  { to: "/admin/activities",   label: "Activities" },
  { to: "/admin/education",    label: "Education" },
  { to: "/admin/portfolio",    label: "Portfolio" },
  { to: "/admin/projects",     label: "Projects" },
  { to: "/admin/contact",      label: "Contact" },
  { to: "/admin/reviews",      label: "Reviews" },
  { to: "/admin/navigation",   label: "Navigation" },
  { to: "/admin/footer-apps",  label: "Footer apps" },
  { to: "/admin/footer-cta",   label: "Footer CTA" },
  { to: "/admin/ticker",       label: "Ticker" },
  { to: "/admin/seo",          label: "SEO" },
  { to: "/admin/page-loader",  label: "Page loader" },
  { to: "/admin/folders",      label: "Folders" },
  { to: "/admin/slots",        label: "Slots" },
];
