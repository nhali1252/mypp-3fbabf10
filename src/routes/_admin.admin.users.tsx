import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AdminPage, AdminCard, EmptyState } from "@/components/admin/AdminPage";
import { ConfirmDelete } from "@/components/admin/ConfirmDelete";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { UserPlus, Pencil } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/users")({ component: AdminUsers });

type AdminUser = {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  banned_until: string | null;
  roles: { role: "admin" | "editor"; is_active: boolean }[];
};

async function callAdminUsers(payload: any) {
  const { data, error } = await supabase.functions.invoke("admin-users", { body: payload });
  if (error) throw new Error(error.message);
  if ((data as any)?.error) throw new Error((data as any).error);
  return data;
}

function AdminUsers() {
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-users-list"],
    queryFn: async () => (await callAdminUsers({ action: "list" })) as { users: AdminUser[] },
    enabled: isAdmin,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-users-list"] });

  const createMut = useMutation({
    mutationFn: (input: { email: string; password: string; role: "admin" | "editor"; display_name: string }) =>
      callAdminUsers({ action: "create", ...input }),
    onSuccess: () => { toast.success("Account created"); refresh(); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: (input: any) => callAdminUsers({ action: "update", ...input }),
    onSuccess: () => { toast.success("Updated"); refresh(); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (user_id: string) => callAdminUsers({ action: "delete", user_id }),
    onSuccess: () => { toast.success("User deleted"); refresh(); },
    onError: (e: any) => toast.error(e.message),
  });

  if (!isAdmin) {
    return (
      <AdminPage title="Users" description="Admin only.">
        <AdminCard><p className="text-sm text-muted-foreground">You need the admin role to manage users.</p></AdminCard>
      </AdminPage>
    );
  }

  return (
    <AdminPage
      title="Users"
      description="Create editor accounts, set roles, activate or deactivate access."
      actions={<CreateUserDialog onSubmit={(v) => createMut.mutateAsync(v)} />}
    >
      <AdminCard>
        {isLoading ? (
          <p className="text-sm">Loading…</p>
        ) : error ? (
          <p className="text-sm text-destructive">Failed to load: {(error as any).message}</p>
        ) : !data?.users?.length ? (
          <EmptyState message="No users yet." />
        ) : (
          <ul className="divide-y divide-border">
            {data.users.map((u) => {
              const primary = u.roles[0];
              const active = primary?.is_active !== false && !u.banned_until;
              return (
                <li key={u.id} className="py-3 flex justify-between gap-4 items-center flex-wrap">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{u.display_name || u.email || u.id}</div>
                    <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                  </div>
                  <div className="flex gap-2 items-center flex-wrap">
                    {primary ? (
                      <Badge variant={primary.role === "admin" ? "default" : "secondary"}>
                        {primary.role}
                      </Badge>
                    ) : (
                      <Badge variant="outline">no role</Badge>
                    )}
                    <Badge variant={active ? "default" : "outline"} className={active ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/20" : ""}>
                      {active ? "active" : "inactive"}
                    </Badge>
                    <EditUserDialog
                      user={u}
                      onSubmit={(v) => updateMut.mutateAsync({ user_id: u.id, ...v })}
                    />
                    {u.id !== user?.id && (
                      <ConfirmDelete
                        title="Delete user?"
                        description={`Permanently delete ${u.email}.`}
                        onConfirm={() => { deleteMut.mutate(u.id); }}
                        trigger={<Button size="sm" variant="destructive">Delete</Button>}
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </AdminCard>
      <AdminCard title="About roles">
        <p className="text-sm text-muted-foreground">
          <strong>Admin</strong> manages all content and users. <strong>Editor</strong> is reserved for content editors.
          Public sign-up is disabled — only admins can create accounts here.
        </p>
      </AdminCard>
    </AdminPage>
  );
}

function CreateUserDialog({ onSubmit }: { onSubmit: (v: any) => Promise<any> }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [display_name, setDisplay] = useState("");
  const [role, setRole] = useState<"editor" | "admin">("editor");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { toast.error("Password must be at least 8 chars"); return; }
    setBusy(true);
    try {
      await onSubmit({ email, password, role, display_name });
      setOpen(false);
      setEmail(""); setPassword(""); setDisplay(""); setRole("editor");
    } finally { setBusy(false); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><UserPlus size={14} className="mr-1.5" /> New user</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create account</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label>Display name</Label>
            <Input value={display_name} onChange={(e) => setDisplay(e.target.value)} placeholder="Jane Editor" />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label>Temporary password</Label>
            <Input type="text" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
          </div>
          <div>
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={busy}>{busy ? "Creating…" : "Create account"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({ user, onSubmit }: { user: AdminUser; onSubmit: (v: any) => Promise<any> }) {
  const [open, setOpen] = useState(false);
  const [display_name, setDisplay] = useState(user.display_name ?? "");
  const [role, setRole] = useState<"editor" | "admin">((user.roles[0]?.role as any) ?? "editor");
  const [is_active, setActive] = useState(user.roles[0]?.is_active !== false && !user.banned_until);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const payload: any = { display_name, role, is_active };
      if (password) {
        if (password.length < 8) { toast.error("Password must be at least 8 chars"); setBusy(false); return; }
        payload.password = password;
      }
      await onSubmit(payload);
      setOpen(false);
      setPassword("");
    } finally { setBusy(false); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Pencil size={13} className="mr-1.5" /> Edit</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit user — {user.email}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label>Display name</Label>
            <Input value={display_name} onChange={(e) => setDisplay(e.target.value)} />
          </div>
          <div>
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between border border-border rounded-lg px-3 py-2">
            <div>
              <Label className="mb-0">Active</Label>
              <p className="text-xs text-muted-foreground">Inactive users cannot sign in.</p>
            </div>
            <Switch checked={is_active} onCheckedChange={setActive} />
          </div>
          <div>
            <Label>Reset password (optional)</Label>
            <Input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Leave empty to keep current" />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
