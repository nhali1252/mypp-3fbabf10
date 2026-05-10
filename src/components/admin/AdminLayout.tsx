import { Link, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, Inbox, Image as ImageIcon, ClipboardCheck,
  Settings, Users, LogOut, ExternalLink, Menu, X,
  RefreshCw, MessageSquare, Shield, Activity, KeyRound,
  ChevronRight, Home,
} from "lucide-react";

// Static label map for breadcrumb segments (covers nav items + extras)
const SEGMENT_LABELS: Record<string, string> = {
  admin: "Admin",
  checklist: "Pre-publish",
  messages: "Messages",
  comments: "Comments",
  audit: "Audit log",
  diagnostics: "Diagnostics",
  "env-import": "Env import",
  runtime: "Runtime",
  media: "Media library",
  users: "Users",
  settings: "Site settings",
  about: "About",
  activities: "Activities",
  contact: "Contact",
  education: "Education",
  folders: "Folders",
  "footer-apps": "Footer apps",
  "footer-cta": "Footer CTA",
  hero: "Hero",
  launcher: "Launcher",
  navigation: "Navigation",
  "page-loader": "Page loader",
  page: "Page",
  portfolio: "Portfolio",
  projects: "Projects",
  reviews: "Reviews",
  seo: "SEO",
  skills: "Skills",
  slots: "Slots",
  ticker: "Ticker",
};

function labelize(seg: string) {
  return SEGMENT_LABELS[seg] ?? seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

type Item = { to: string; label: string; Icon: any; end?: boolean };
type Group = { label: string; items: Item[] };

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
      { to: "/admin/diagnostics", label: "Diagnostics", Icon: Activity },
      { to: "/admin/env-import", label: "Env import", Icon: KeyRound },
      { to: "/admin/runtime", label: "Runtime", Icon: RefreshCw },
      { to: "/admin/media", label: "Media library", Icon: ImageIcon },
      { to: "/admin/users", label: "Users", Icon: Users },
      { to: "/admin/settings", label: "Site settings", Icon: Settings },
    ],
  },
];

export default function AdminLayout() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  async function handleLogout() {
    await signOut();
    navigate({ to: "/auth" });
  }

  function isActive(to: string, end?: boolean) {
    if (end) return location.pathname === to;
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  }

  const segments = useMemo(() => {
    const parts = location.pathname.split("/").filter(Boolean);
    return parts.map((seg, i) => ({
      seg,
      label: labelize(seg),
      to: "/" + parts.slice(0, i + 1).join("/"),
      isLast: i === parts.length - 1,
    }));
  }, [location.pathname]);

  const currentTitle = segments.length > 0 ? segments[segments.length - 1].label : "Admin";

  const sidebar = (
    <>
      <div className="px-3 py-4 mb-3 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-background/40 mb-1">Admin</div>
          <div className="text-lg font-black">Portfolio CMS</div>
        </div>
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
      <aside className="hidden lg:flex w-[260px] shrink-0 bg-foreground text-background flex-col p-4 sticky top-0 h-screen">
        {sidebar}
      </aside>

      <div className="lg:hidden fixed top-0 inset-x-0 z-40 bg-background/85 backdrop-blur border-b border-border flex items-center justify-between px-4 h-14">
        <button onClick={() => setOpen(true)} className="p-2 rounded-lg hover:bg-muted" aria-label="Open admin menu">
          <Menu size={20} />
        </button>
        <div className="text-sm font-black">Portfolio CMS</div>
        <a href="/" target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-muted" aria-label="View site">
          <ExternalLink size={18} />
        </a>
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[280px] bg-foreground text-background flex flex-col p-4 animate-in slide-in-from-left">
            {sidebar}
          </aside>
        </div>
      )}

      <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-x-auto pt-[72px] lg:pt-6">
        <Outlet />
      </main>
    </div>
  );
}
