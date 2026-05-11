import { useEffect, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listMessages,
  updateMessage,
  deleteMessage,
  getMessageEmailStatuses,
  retryMessageEmail,
  type EmailStatusRow,
  type EmailLeg,
} from "@/server/messages.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AdminPage, AdminCard, EmptyState } from "@/components/admin/AdminPage";
import { ConfirmDelete } from "@/components/admin/ConfirmDelete";
import { Mail, MailOpen, Reply, Trash2, AlertTriangle, CheckCircle2, Clock, XCircle, Inbox, Send as SendIcon, RefreshCw } from "lucide-react";
import { WorkerHealthGate } from "@/components/admin/WorkerHealthGate";

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

  const messageIds = useMemo(
    () => (data?.messages ?? []).map((m) => m.id),
    [data],
  );

  const fetchStatuses = useServerFn(getMessageEmailStatuses);
  const statusesQuery = useQuery({
    queryKey: ["admin-messages-email-status", messageIds],
    queryFn: () => fetchStatuses({ data: { ids: messageIds } }),
    enabled: messageIds.length > 0,
    refetchInterval: 15000,
  });

  // Realtime: refetch statuses whenever a relevant email_send_log row arrives.
  useEffect(() => {
    if (messageIds.length === 0) return;
    const idSet = new Set(messageIds);
    const channel = supabase
      .channel("admin-email-send-log")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "email_send_log" },
        (payload: any) => {
          const mid: string | undefined = payload?.new?.message_id;
          if (!mid) return;
          const rowId = mid.replace(/^(notify|confirm)-/, "");
          if (rowId !== mid && idSet.has(rowId)) {
            qc.invalidateQueries({ queryKey: ["admin-messages-email-status"] });
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [messageIds, qc]);

  const statusByMessage = useMemo(() => {
    const map = new Map<string, { notify?: EmailStatusRow; confirm?: EmailStatusRow }>();
    for (const row of statusesQuery.data?.rows ?? []) {
      const entry = map.get(row.message_row_id) ?? {};
      entry[row.leg] = row;
      map.set(row.message_row_id, entry);
    }
    return map;
  }, [statusesQuery.data]);

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

  if (isLoading) return <div className="p-6">Loading…</div>;
  const rows = data?.messages ?? [];
  const unread = rows.filter((r) => !r.is_read).length;
  const storageError = data && !data.ok ? data : null;

  return (
    <AdminPage title="Messages" description={`Contact form submissions${unread ? ` · ${unread} unread` : ""}.`}>
      <WorkerHealthGate feature="messages">
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
            <p className="text-sm whitespace-pre-wrap mb-3">{m.message}</p>
            <EmailDeliveryRow status={statusByMessage.get(m.id)} />
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
      </WorkerHealthGate>
    </AdminPage>
  );
}

function EmailDeliveryRow({
  status,
}: {
  status?: { notify?: EmailStatusRow; confirm?: EmailStatusRow };
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
      <span className="text-muted-foreground uppercase tracking-wider text-[10px] font-semibold">Email delivery</span>
      <EmailLegBadge label="Inbox notify" icon={<Inbox className="w-3 h-3" />} row={status?.notify} />
      <EmailLegBadge label="Sender confirm" icon={<SendIcon className="w-3 h-3" />} row={status?.confirm} />
    </div>
  );
}

function EmailLegBadge({
  label,
  icon,
  row,
}: {
  label: string;
  icon: React.ReactNode;
  row?: EmailStatusRow;
}) {
  const status = row?.status ?? "queued";
  const tone = statusTone(status);
  const StatusIcon = tone.icon;
  const tip = row?.error_message
    ? `${status} — ${row.error_message}`
    : row?.updated_at
      ? `${status} · ${new Date(row.updated_at).toLocaleString()}`
      : "Not yet logged";
  return (
    <span
      title={tip}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 ${tone.cls}`}
    >
      {icon}
      <span className="text-muted-foreground">{label}:</span>
      <StatusIcon className="w-3 h-3" />
      <span className="font-medium capitalize">{status}</span>
    </span>
  );
}

function statusTone(status: string): { cls: string; icon: typeof CheckCircle2 } {
  switch (status) {
    case "sent":
      return { cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300", icon: CheckCircle2 };
    case "failed":
    case "dlq":
    case "bounced":
    case "complained":
    case "suppressed":
      return { cls: "border-destructive/50 bg-destructive/10 text-destructive", icon: XCircle };
    case "pending":
    default:
      return { cls: "border-amber-500/40 bg-amber-500/10 text-amber-300", icon: Clock };
  }
}
