import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AdminPage, AdminCard, EmptyState } from "@/components/admin/AdminPage";
import { ConfirmDelete } from "@/components/admin/ConfirmDelete";
import { Mail, MailOpen, Reply, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/messages")({ component: AdminMessages });

function AdminMessages() {
  const qc = useQueryClient();
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-messages"],
    queryFn: async () => {
      const { data } = await supabase.from("messages").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  async function toggleRead(id: string, val: boolean) {
    const { error } = await supabase.from("messages").update({ is_read: val }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-messages"] });
  }
  async function toggleReplied(id: string, val: boolean) {
    const { error } = await supabase.from("messages").update({ is_replied: val }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-messages"] });
  }
  async function remove(id: string) {
    const { error } = await supabase.from("messages").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin-messages"] });
  }

  if (isLoading) return <div className="p-6">Loading…</div>;
  const unread = rows.filter((r: any) => !r.is_read).length;

  return (
    <AdminPage title="Messages" description={`Contact form submissions${unread ? ` · ${unread} unread` : ""}.`}>
      {rows.length === 0 ? <EmptyState message="No messages yet." /> : (
        rows.map((m: any) => (
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
              <Button size="sm" variant="outline" onClick={() => toggleRead(m.id, !m.is_read)}>
                {m.is_read ? <><Mail className="w-3.5 h-3.5 mr-1.5" />Mark unread</> : <><MailOpen className="w-3.5 h-3.5 mr-1.5" />Mark read</>}
              </Button>
              <Button size="sm" variant="outline" onClick={() => toggleReplied(m.id, !m.is_replied)}>
                <Reply className="w-3.5 h-3.5 mr-1.5" />{m.is_replied ? "Unmark replied" : "Mark replied"}
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject || "Your message")}`}>Reply by email</a>
              </Button>
              <ConfirmDelete onConfirm={() => remove(m.id)} trigger={<Button size="sm" variant="outline"><Trash2 className="w-3.5 h-3.5 mr-1.5" />Delete</Button>} />
            </div>
          </AdminCard>
        ))
      )}
    </AdminPage>
  );
}
