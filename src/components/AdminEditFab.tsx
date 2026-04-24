import { Link, useLocation } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

/**
 * Floating "Edit in admin" pill, visible only to signed-in admins/editors.
 * Resolves to the most relevant admin page for the current public route.
 */
export function AdminEditFab() {
  const { user, isAdmin, isEditor, loading } = useAuth();
  const location = useLocation();

  if (loading || !user || (!isAdmin && !isEditor)) return null;

  const target = resolveAdminTarget(location.pathname);

  return (
    <Link
      to={target.to}
      aria-label={`Edit ${target.label} in admin`}
      className="fixed bottom-5 right-5 z-50 group inline-flex items-center gap-2 rounded-full bg-foreground text-background pl-3 pr-4 py-2.5 text-xs font-bold uppercase tracking-[0.18em] shadow-[0_18px_40px_-12px_rgba(0,0,0,0.55)] hover:scale-[1.03] active:scale-[0.98] transition-transform"
    >
      <span className="grid place-items-center w-7 h-7 rounded-full bg-primary text-primary-foreground">
        <Pencil className="w-3.5 h-3.5" />
      </span>
      Edit · {target.label}
    </Link>
  );
}

function resolveAdminTarget(pathname: string): { to: string; label: string } {
  if (pathname.startsWith("/basic")) return { to: "/admin/hero", label: "Basic" };
  if (pathname.startsWith("/about-and-skills")) return { to: "/admin/about", label: "About & Skills" };
  if (pathname.startsWith("/portfolio")) return { to: "/admin/portfolio", label: "Portfolio" };
  if (pathname.startsWith("/projects")) return { to: "/admin/projects", label: "Projects" };
  if (pathname.startsWith("/services")) return { to: "/admin/skills", label: "Services" };
  if (pathname.startsWith("/contact")) return { to: "/admin/contact", label: "Contact" };
  if (pathname === "/" || pathname === "") return { to: "/admin/launcher", label: "Launcher" };
  return { to: "/admin", label: "Admin" };
}
