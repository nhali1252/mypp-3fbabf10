import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { AdminPage, AdminCard, EmptyState } from "@/components/admin/AdminPage";

export const Route = createFileRoute("/_admin/admin/users")({ component: AdminUsers });

function AdminUsers() {
  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["admin-users-roles"],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("user_id, role, created_at");
      return data ?? [];
    },
  });
  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-users-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, display_name, created_at");
      return data ?? [];
    },
  });

  const grouped = roles.reduce((acc: Record<string, string[]>, r: any) => {
    (acc[r.user_id] ??= []).push(r.role);
    return acc;
  }, {} as Record<string, string[]>);

  const userIds = Array.from(
    new Set([...roles.map((r: any) => r.user_id), ...profiles.map((p: any) => p.id)])
  );

  return (
    <AdminPage title="Users" description="Accounts with roles. Editing roles and inviting users is admin-only.">
      <AdminCard>
        {isLoading ? <p className="text-sm">Loading…</p> :
         userIds.length === 0 ? <EmptyState message="No users." /> : (
          <ul className="divide-y divide-border">
            {userIds.map((uid) => {
              const profile: any = profiles.find((p: any) => p.id === uid);
              const userRoles = grouped[uid] || [];
              return (
                <li key={uid} className="py-3 flex justify-between gap-4 items-center flex-wrap">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{profile?.display_name || "—"}</div>
                    <div className="text-xs text-muted-foreground truncate">{uid}</div>
                  </div>
                  <div className="flex gap-1.5">
                    {userRoles.length === 0 ? <Badge variant="secondary">no role</Badge> :
                      userRoles.map((r) => (
                        <Badge key={r} variant={r === "admin" ? "default" : "secondary"}>{r}</Badge>
                      ))}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </AdminCard>
      <AdminCard title="About roles">
        <p className="text-sm text-muted-foreground">
          The <strong>admin</strong> role has full control over all content. The <strong>editor</strong> role is reserved for future use. Adding/removing users currently requires running a migration or using the backend Users panel.
        </p>
      </AdminCard>
    </AdminPage>
  );
}
