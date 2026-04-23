import { Link, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, Sparkles, User, GraduationCap, Lightbulb, FolderKanban,
  Activity, Megaphone, PhoneCall, Inbox, Image as ImageIcon,
  Search, Settings, Users, LogOut, ExternalLink, Compass, AppWindow, ClipboardCheck,
  Folder, LayoutGrid, Car, Rocket,
} from "lucide-react";

const items = [
  { to: "/admin", label: "Dashboard", Icon: LayoutDashboard, end: true },
  { to: "/admin/welcome", label: "Welcome page", Icon: Sparkles },
  { to: "/admin/launcher", label: "Launcher cards", Icon: Rocket },
  { to: "/admin/f-page", label: "Page F editor", Icon: Lightbulb },
  { to: "/admin/checklist", label: "Pre-publish", Icon: ClipboardCheck },
  { to: "/admin/folders", label: "Folders", Icon: Folder },
  { to: "/admin/slots", label: "Slots", Icon: LayoutGrid },
  { to: "/admin/services-cms", label: "Taxi Services", Icon: Car },
  { to: "/admin/hero", label: "Hero", Icon: Sparkles },
  { to: "/admin/about", label: "About", Icon: User },
  { to: "/admin/education", label: "Education", Icon: GraduationCap },
  { to: "/admin/skills", label: "Skills", Icon: Lightbulb },
  { to: "/admin/projects", label: "Projects", Icon: FolderKanban },
  { to: "/admin/activities", label: "Activities", Icon: Activity },
  { to: "/admin/ticker", label: "Ticker", Icon: Megaphone },
  { to: "/admin/navigation", label: "Navigation", Icon: Compass },
  { to: "/admin/contact", label: "Contact Info", Icon: PhoneCall },
  { to: "/admin/footer-apps", label: "Footer Apps", Icon: AppWindow },
  { to: "/admin/messages", label: "Messages", Icon: Inbox },
  { to: "/admin/media", label: "Media Library", Icon: ImageIcon },
  { to: "/admin/seo", label: "SEO Settings", Icon: Search },
  { to: "/admin/settings", label: "Site Settings", Icon: Settings },
  { to: "/admin/users", label: "Users", Icon: Users },
] as const;

export default function AdminLayout() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogout() {
    await signOut();
    navigate({ to: "/auth" });
  }

  function isActive(to: string, end?: boolean) {
    if (end) return location.pathname === to;
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  }

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-[260px] shrink-0 bg-foreground text-background flex flex-col p-4 sticky top-0 h-screen">
        <div className="px-3 py-4 mb-3">
          <div className="text-xs uppercase tracking-wider text-background/40 mb-1">Admin</div>
          <div className="text-lg font-black">Portfolio CMS</div>
        </div>
        <nav className="flex-1 overflow-y-auto space-y-1">
          {items.map((it) => {
            const active = isActive(it.to, (it as any).end);
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
                <it.Icon size={17} />
                {it.label}
              </Link>
            );
          })}
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
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-x-auto">
        <Outlet />
      </main>
    </div>
  );
}
