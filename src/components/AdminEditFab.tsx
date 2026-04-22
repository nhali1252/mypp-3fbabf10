import { Link, useLocation } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

/**
 * Floating "Edit in admin" button shown on every public page,
 * but only when the visitor is signed in as an admin or editor.
 *
 * The target admin route is chosen based on the current pathname.
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
  if (pathname.startsWith("/B")) return { to: "/admin/hero", label: "Page B" };
  if (pathname.startsWith("/F")) return { to: "/admin/f-page", label: "Page F" };
  if (pathname.startsWith("/P")) return { to: "/admin/projects", label: "Page P" };
  if (pathname === "/" || pathname === "") return { to: "/admin/launcher", label: "Launcher" };
  return { to: "/admin", label: "Admin" };
}
