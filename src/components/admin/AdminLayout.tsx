import { Link, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useR2AutoResync } from "@/hooks/useR2AutoResync";
import R2SyncAlert from "@/components/admin/R2SyncAlert";
import {
  LayoutDashboard, Inbox, Image as ImageIcon, ClipboardCheck,
  Settings, Users, LogOut, ExternalLink, Loader2, Menu, X, Cloud,
  RefreshCw, CheckCircle2, AlertTriangle, CircleDashed, MessageSquare, Shield,
} from "lucide-react";

type Item = { to: string; label: string; Icon: any; end?: boolean };
type Group = { label: string; items: Item[] };

// Page-content editors live behind the dashboard cards now.
// The sidebar only carries system / cross-page tools.
const groups: Group[] = [
  {
    label: "Overview",
    items: [
      { to: "/admin", label: "Pages", Icon: LayoutDashboard, end: true },
      { to: "/admin/checklist", label: "Pre-publish", Icon: ClipboardCheck },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/admin/messages", label: "Messages", Icon: Inbox },
      { to: "/admin/comments", label: "Comments", Icon: MessageSquare },
      { to: "/admin/audit", label: "Audit log", Icon: Shield },
      { to: "/admin/media", label: "Media library", Icon: ImageIcon },
      { to: "/admin/users", label: "Users", Icon: Users },
      { to: "/admin/r2-migration", label: "R2 migration", Icon: Cloud },
      { to: "/admin/settings", label: "Site settings", Icon: Settings },
    ],
  },
];

export default function AdminLayout() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const sync = useR2AutoResync();

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [location.pathname]);

  async function handleLogout() {
    await signOut();
    navigate({ to: "/auth" });
  }

  function isActive(to: string, end?: boolean) {
    if (end) return location.pathname === to;
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  }

  const sidebar = (
    <>
      <div className="px-3 py-4 mb-3 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-background/40 mb-1">Admin</div>
          <div className="text-lg font-black">Portfolio CMS</div>
        </div>
        <button onClick={() => setOpen(false)} className="lg:hidden p-2 rounded-lg text-background/70 hover:bg-background/10" aria-label="Close menu">
          <X size={18} />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto space-y-4 pr-1">
        {groups.map((group) => (
          <div key={group.label} className="space-y-1">
            <div className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-background/35">
              {group.label}
            </div>
            {group.items.map((it) => {
              const active = isActive(it.to, it.end);
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-background/70 hover:text-background hover:bg-background/5"
                  }`}
                >
                  <it.Icon size={16} />
                  {it.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="mt-3 pt-3 border-t border-background/10 space-y-2">
        <R2SyncPill sync={sync} />
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-background/60 hover:text-background"
        >
          <ExternalLink size={14} /> View site
        </a>
        <div className="px-3 py-1 text-[0.7rem] text-background/40 truncate">{user?.email}</div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-background/70 hover:bg-background/5 hover:text-background"
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[260px] shrink-0 bg-foreground text-background flex-col p-4 sticky top-0 h-screen">
        {sidebar}
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 bg-background/85 backdrop-blur border-b border-border flex items-center justify-between px-4 h-14">
        <button onClick={() => setOpen(true)} className="p-2 rounded-lg hover:bg-muted" aria-label="Open admin menu">
          <Menu size={20} />
        </button>
        <div className="text-sm font-black">Portfolio CMS</div>
        <a href="/" target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-muted" aria-label="View site">
          <ExternalLink size={18} />
        </a>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[280px] bg-foreground text-background flex flex-col p-4 animate-in slide-in-from-left">
            {sidebar}
          </aside>
        </div>
      )}

      <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-x-auto pt-[72px] lg:pt-6">
        <R2SyncAlert sync={sync} />
        <Outlet />
      </main>
    </div>
  );
}

function R2SyncPill({ sync }: { sync: ReturnType<typeof useR2AutoResync> }) {
  const { status, lastSyncedAt, error, syncNow } = sync;
  const fmt = (d: Date | null) => {
    if (!d) return "never";
    const s = Math.round((Date.now() - d.getTime()) / 1000);
    if (s < 5) return "just now";
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.round(s / 60)}m ago`;
    return d.toLocaleTimeString();
  };

  const meta =
    status === "syncing" ? { Icon: Loader2, text: "Syncing R2…", cls: "text-primary animate-pulse", spin: true } :
    status === "pending" ? { Icon: CircleDashed, text: "Changes pending…", cls: "text-amber-400", spin: false } :
    status === "error"   ? { Icon: AlertTriangle, text: error ?? "Sync failed", cls: "text-destructive", spin: false } :
    status === "ok"      ? { Icon: CheckCircle2, text: `R2 synced · ${fmt(lastSyncedAt)}`, cls: "text-emerald-400", spin: false } :
                           { Icon: Cloud, text: lastSyncedAt ? `R2 synced · ${fmt(lastSyncedAt)}` : "R2 in sync", cls: "text-background/60", spin: false };

  return (
    <button
      onClick={syncNow}
      disabled={status === "syncing"}
      title="Force resync R2 from database now"
      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs bg-background/5 hover:bg-background/10 transition-colors disabled:opacity-60"
    >
      <meta.Icon size={14} className={`${meta.cls} ${meta.spin ? "animate-spin" : ""}`} />
      <span className={`flex-1 text-left truncate ${meta.cls}`}>{meta.text}</span>
      <RefreshCw size={12} className="text-background/40" />
    </button>
  );
}
