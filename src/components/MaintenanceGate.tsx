import { useLocation, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useMaintenance } from "@/hooks/useMaintenance";
import { Wrench, ShieldCheck } from "lucide-react";
import { useSiteSettings as useChromeSettings } from "@/hooks/useContent";

/**
 * Renders a full-screen maintenance page when admin has flipped the toggle.
 * Bypassed for /admin/*, /auth, and any signed-in admin so the owner can
 * keep working. Renders children unchanged otherwise.
 */
export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const { enabled, message } = useMaintenance();
  const { isAdmin } = useAuth();
  const { pathname } = useLocation();
  const { data: chrome } = useChromeSettings();

  const isAdminArea =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/forgot-password");

  if (!enabled || isAdmin || isAdminArea) return <>{children}</>;

  const siteName = chrome?.site_name || chrome?.site_title || "This site";

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background px-6">
      <div className="max-w-lg text-center space-y-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Wrench className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight">{siteName} is getting an update</h1>
          <p className="text-muted-foreground whitespace-pre-line">
            {message?.trim() ||
              "We're making a few improvements right now. Please check back in a little while."}
          </p>
        </div>
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Site owner? Sign in
        </Link>
      </div>
    </div>
  );
}
