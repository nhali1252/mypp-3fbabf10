import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMessages, updateMessage, deleteMessage } from "@/server/messages.functions";
import { migrateMessagesToR2 } from "@/server/migrate-messages.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AdminPage, AdminCard, EmptyState } from "@/components/admin/AdminPage";
import { ConfirmDelete } from "@/components/admin/ConfirmDelete";
import { Mail, MailOpen, Reply, Trash2, DatabaseBackup, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/messages")({ component: AdminMessages });

function AdminMessages() {
  const qc = useQueryClient();
  const list = useServerFn(listMessages);
  const update = useServerFn(updateMessage);
  const del = useServerFn(deleteMessage);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-messages"],
    queryFn: () => list(),
  });

  const updateMut = useMutation({
    mutationFn: (vars: { id: string; is_read?: boolean; is_replied?: boolean }) =>
      update({ data: vars }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-messages"] }),
    onError: (e: any) => toast.error(e?.message || "Update failed"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-messages"] });
    },
    onError: (e: any) => toast.error(e?.message || "Delete failed"),
  });

  const migrate = useServerFn(migrateMessagesToR2);
  const migrateMut = useMutation({
    mutationFn: () => migrate(),
    onSuccess: (r: any) => {
      toast.success(`Migrated ${r.copied} message${r.copied === 1 ? "" : "s"} (total ${r.total}).`);
      qc.invalidateQueries({ queryKey: ["admin-messages"] });
    },
    onError: (e: any) => toast.error(e?.message || "Migration failed"),
  });

  if (isLoading) return <div className="p-6">Loading…</div>;
  const rows = data?.messages ?? [];
  const unread = rows.filter((r) => !r.is_read).length;
  const storageError = data && !data.ok ? data : null;

  return (
    <AdminPage title="Messages" description={`Contact form submissions${unread ? ` · ${unread} unread` : ""}.`}>
      {(isError || storageError) && (
        <div className="rounded-2xl border border-destructive/35 bg-destructive/10 p-4 text-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-destructive">Messages could not load</div>
              <p className="mt-1 text-muted-foreground">
                {storageError?.error || error?.message || "Unable to reach messages storage."}
              </p>
              {storageError?.detail && (
                <p className="mt-2 break-words font-mono text-xs text-muted-foreground">{storageError.detail}</p>
              )}
            </div>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </div>
      )}
      <div className="mb-4">
        <Button size="sm" variant="outline" onClick={() => migrateMut.mutate()} disabled={migrateMut.isPending}>
          <DatabaseBackup className="w-3.5 h-3.5 mr-1.5" />
          {migrateMut.isPending ? "Migrating…" : "Import legacy DB messages"}
        </Button>
      </div>
      {rows.length === 0 ? <EmptyState message="No messages yet." /> : (
        rows.map((m) => (
          <AdminCard key={m.id} className={m.is_read ? "" : "ring-1 ring-primary/40"}>
            <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
              <div>
                <div className="font-bold">{m.name} <span className="font-normal text-muted-foreground">· {m.email}</span></div>
                {m.phone && <div className="text-xs text-muted-foreground">{m.phone}</div>}
                <div className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()}</div>
              </div>
              <div className="flex gap-1.5">
                {!m.is_read && <Badge>New</Badge>}
                {m.is_replied && <Badge variant="secondary">Replied</Badge>}
              </div>
            </div>
            {m.subject && <div className="font-semibold mb-1">{m.subject}</div>}
            <p className="text-sm whitespace-pre-wrap mb-4">{m.message}</p>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" onClick={() => updateMut.mutate({ id: m.id, is_read: !m.is_read })}>
                {m.is_read ? <><Mail className="w-3.5 h-3.5 mr-1.5" />Mark unread</> : <><MailOpen className="w-3.5 h-3.5 mr-1.5" />Mark read</>}
              </Button>
              <Button size="sm" variant="outline" onClick={() => updateMut.mutate({ id: m.id, is_replied: !m.is_replied })}>
                <Reply className="w-3.5 h-3.5 mr-1.5" />{m.is_replied ? "Unmark replied" : "Mark replied"}
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject || "Your message")}`}>Reply by email</a>
              </Button>
              <ConfirmDelete onConfirm={() => deleteMut.mutate(m.id)} trigger={<Button size="sm" variant="outline"><Trash2 className="w-3.5 h-3.5 mr-1.5" />Delete</Button>} />
            </div>
          </AdminCard>
        ))
      )}
    </AdminPage>
  );
}
