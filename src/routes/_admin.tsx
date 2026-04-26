import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import AdminLayout from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/_admin")({
  component: AdminGuard,
  head: () => ({ meta: [{ title: "Admin — Portfolio CMS" }] }),
});

function AdminGuard() {
  const { user, loading, isAdmin, isEditor } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth" });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!user) return null;

  // Logged-in users without admin/editor get a friendly forbidden screen
  // rather than a blank dashboard. The data layer also enforces this via RLS.
  if (!isAdmin && !isEditor) {
    return (
      <div className="min-h-screen grid place-items-center bg-background px-6">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-2xl font-black tracking-tight">Admin access required</h1>
          <p className="text-sm text-muted-foreground">
            Your account doesn't have an admin or editor role. If you believe this is a mistake, ask
            an existing admin to grant you access.
          </p>
        </div>
      </div>
    );
  }

  return <AdminLayout />;
}
