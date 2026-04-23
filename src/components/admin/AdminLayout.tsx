import { Link, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, Sparkles, User, GraduationCap, Lightbulb, FolderKanban,
  Activity, Megaphone, PhoneCall, Inbox, Image as ImageIcon,
  Search, Settings, Users, LogOut, ExternalLink, Compass, AppWindow, ClipboardCheck,
  Folder, LayoutGrid, Car, Rocket, Briefcase, Wrench,
} from "lucide-react";

type Item = { to: string; label: string; Icon: any; end?: boolean };
type Group = { label: string; items: Item[] };

const groups: Group[] = [
  {
    label: "Overview",
    items: [
      { to: "/admin", label: "Dashboard", Icon: LayoutDashboard, end: true },
      { to: "/admin/checklist", label: "Pre-publish", Icon: ClipboardCheck },
    ],
  },
  {
    label: "Home page",
    items: [
      { to: "/admin/welcome", label: "Welcome header", Icon: Sparkles },
      { to: "/admin/launcher", label: "Launcher cards", Icon: Rocket },
    ],
  },
  {
    label: "Public pages",
    items: [
      { to: "/admin/portfolio-page", label: "Portfolio page", Icon: Briefcase },
      { to: "/admin/services-page", label: "Services page", Icon: Wrench },
      { to: "/admin/f-page", label: "About & Skills page", Icon: Lightbulb },
      { to: "/admin/hero", label: "Basic info hero", Icon: Sparkles },
      { to: "/admin/about", label: "About content", Icon: User },
      { to: "/admin/education", label: "Education", Icon: GraduationCap },
      { to: "/admin/skills", label: "Skills (legacy)", Icon: Lightbulb },
      { to: "/admin/projects", label: "Projects (legacy)", Icon: FolderKanban },
      { to: "/admin/activities", label: "Activities", Icon: Activity },
    ],
  },
  {
    label: "TasTaj services",
    items: [
      { to: "/admin/folders", label: "Folders", Icon: Folder },
      { to: "/admin/slots", label: "Slots", Icon: LayoutGrid },
      { to: "/admin/services-cms", label: "Taxi Services", Icon: Car },
    ],
  },
  {
    label: "Site-wide",
    items: [
      { to: "/admin/ticker", label: "Ticker", Icon: Megaphone },
      { to: "/admin/navigation", label: "Navigation", Icon: Compass },
      { to: "/admin/contact", label: "Contact info", Icon: PhoneCall },
      { to: "/admin/footer-apps", label: "Footer apps", Icon: AppWindow },
      { to: "/admin/messages", label: "Messages", Icon: Inbox },
      { to: "/admin/media", label: "Media library", Icon: ImageIcon },
    ],
  },
  {
    label: "Settings",
    items: [
      { to: "/admin/seo", label: "SEO", Icon: Search },
      { to: "/admin/settings", label: "Site settings", Icon: Settings },
      { to: "/admin/users", label: "Users", Icon: Users },
    ],
  },
];

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
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
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
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-x-auto">
        <Outlet />
      </main>
    </div>
  );
}
