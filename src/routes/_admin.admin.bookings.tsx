import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listBookings,
  updateBookingStatus,
  deleteBooking,
  type Booking,
} from "@/lib/fns/bookings.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AdminPage, AdminCard, EmptyState } from "@/components/admin/AdminPage";
import { ConfirmDelete } from "@/components/admin/ConfirmDelete";
import { Calendar, Clock, Mail, Phone, Trash2, CheckCircle2, XCircle, CircleDashed } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/bookings")({
  component: AdminBookings,
});

const STATUSES: Booking["status"][] = ["pending", "confirmed", "completed", "cancelled"];

function statusTone(s: Booking["status"]) {
  switch (s) {
    case "confirmed":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/30";
    case "completed":
      return "bg-blue-500/10 text-blue-600 border-blue-500/30";
    case "cancelled":
      return "bg-destructive/10 text-destructive border-destructive/30";
    default:
      return "bg-amber-500/10 text-amber-600 border-amber-500/30";
  }
}

function AdminBookings() {
  const qc = useQueryClient();
  const list = useServerFn(listBookings);
  const setStatus = useServerFn(updateBookingStatus);
  const del = useServerFn(deleteBooking);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: () => list(),
  });

  const updateMut = useMutation({
    mutationFn: (vars: { id: string; status: Booking["status"] }) =>
      setStatus({ data: vars }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-bookings"] });
      toast.success("Status updated");
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to update"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-bookings"] });
      toast.success("Booking deleted");
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to delete"),
  });

  const bookings = data?.bookings ?? [];

  return (
    <AdminPage
      title="Bookings"
      description="Booking requests submitted from the public booking form."
      actions={
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Refresh
        </Button>
      }
    >
      {isLoading ? (
        <AdminCard><p className="text-muted-foreground">Loading…</p></AdminCard>
      ) : isError || (data && !data.ok) ? (
        <AdminCard>
          <p className="text-destructive">
            {(data && !data.ok && data.error) || (error as any)?.message || "Failed to load."}
          </p>
        </AdminCard>
      ) : bookings.length === 0 ? (
        <EmptyState message="No bookings yet — submissions from the /booking page will show up here." />
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <AdminCard key={b.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-semibold">{b.name}</h3>
                    <Badge className={`border ${statusTone(b.status)}`} variant="outline">
                      {b.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      <a href={`mailto:${b.email}`} className="hover:underline">{b.email}</a>
                    </span>
                    {b.phone ? (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" />
                        {b.phone}
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {b.preferred_date}
                    </span>
                    {b.preferred_time ? (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {b.preferred_time}
                      </span>
                    ) : null}
                  </div>
                  {b.service ? (
                    <p className="mt-2 text-sm">
                      <span className="text-muted-foreground">Service: </span>
                      {b.service}
                    </p>
                  ) : null}
                  {b.notes ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                      {b.notes}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-muted-foreground/70">
                    Submitted {new Date(b.created_at).toLocaleString()}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <select
                    value={b.status}
                    disabled={updateMut.isPending}
                    onChange={(e) =>
                      updateMut.mutate({
                        id: b.id,
                        status: e.target.value as Booking["status"],
                      })
                    }
                    className="form-input text-sm"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <ConfirmDelete
                    onConfirm={() => deleteMut.mutate(b.id)}
                    title="Delete booking?"
                    description={`This will permanently remove the booking from ${b.name}.`}
                    trigger={
                      <Button variant="ghost" size="sm" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    }
                  />
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </AdminPage>
  );
}
