import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listEmailLogs, type EmailLogRow } from "@/server/email-logs.functions";
import { AdminPage, AdminCard, EmptyState } from "@/components/admin/AdminPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, Clock, XCircle, AlertTriangle, ShieldAlert, Inbox,
  RefreshCw, Search,
} from "lucide-react";

export const Route = createFileRoute("/_admin/admin/email-logs")({ component: EmailLogsPage });

type Range = "24h" | "7d" | "30d" | "all";
type StatusOpt = "all" | "sent" | "failed" | "dlq" | "suppressed" | "pending" | "bounced" | "complained";

const PAGE_SIZE = 50;

function rangeToDates(r: Range): { start?: string; end?: string } {
  if (r === "all") return {};
  const now = new Date();
  const start = new Date(now);
  if (r === "24h") start.setHours(start.getHours() - 24);
  if (r === "7d") start.setDate(start.getDate() - 7);
  if (r === "30d") start.setDate(start.getDate() - 30);
  return { start: start.toISOString(), end: now.toISOString() };
}

function EmailLogsPage() {
  const [range, setRange] = useState<Range>("7d");
  const [template, setTemplate] = useState<string>("all");
  const [status, setStatus] = useState<StatusOpt>("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [offset, setOffset] = useState(0);

  const fn = useServerFn(listEmailLogs);
  const filterArgs = useMemo(
    () => ({
      ...rangeToDates(range),
      template,
      status,
      search: search || undefined,
      limit: PAGE_SIZE,
      offset,
    }),
    [range, template, status, search, offset],
  );

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-email-logs", filterArgs],
    queryFn: () => fn({ data: filterArgs }),
    refetchInterval: 30_000,
  });

  function applySearch() {
    setOffset(0);
    setSearch(searchInput.trim());
  }
  function resetFilters() {
    setRange("7d"); setTemplate("all"); setStatus("all");
    setSearch(""); setSearchInput(""); setOffset(0);
  }

  const stats = data?.stats ?? { total: 0, sent: 0, failed: 0, dlq: 0, suppressed: 0, pending: 0 };
  const templates = data?.templates ?? [];
  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <AdminPage
      title="Email logs"
      description="Delivery status and errors from the email queue. Each row is the latest state per message_id."
    >
      {/* Filters */}
      <AdminCard>
        <div className="flex flex-wrap items-end gap-3">
          <FilterGroup label="Range">
            {(["24h", "7d", "30d", "all"] as const).map((r) => (
              <Pill key={r} active={range === r} onClick={() => { setRange(r); setOffset(0); }}>
                {r === "24h" ? "Last 24h" : r === "7d" ? "7 days" : r === "30d" ? "30 days" : "All time"}
              </Pill>
            ))}
          </FilterGroup>

          <FilterGroup label="Template">
            <select
              value={template}
              onChange={(e) => { setTemplate(e.target.value); setOffset(0); }}
              className="h-9 rounded-md border border-border bg-background px-2 text-sm"
            >
              <option value="all">All templates</option>
              {templates.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </FilterGroup>

          <FilterGroup label="Status">
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value as StatusOpt); setOffset(0); }}
              className="h-9 rounded-md border border-border bg-background px-2 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="sent">Sent</option>
              <option value="pending">Pending / queued</option>
              <option value="failed">Failed</option>
              <option value="dlq">Dead-letter (DLQ)</option>
              <option value="suppressed">Suppressed</option>
              <option value="bounced">Bounced</option>
              <option value="complained">Complained</option>
            </select>
          </FilterGroup>

          <FilterGroup label="Search">
            <div className="flex items-center gap-1.5">
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") applySearch(); }}
                placeholder="email, message id, error…"
                className="h-9 w-56"
              />
              <Button size="sm" variant="outline" onClick={applySearch}>
                <Search className="w-3.5 h-3.5" />
              </Button>
            </div>
          </FilterGroup>

          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={resetFilters}>Reset</Button>
            <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </AdminCard>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Unique" value={stats.total} icon={<Inbox className="w-4 h-4" />} tone="default" />
        <StatCard label="Sent" value={stats.sent} icon={<CheckCircle2 className="w-4 h-4" />} tone="success" />
        <StatCard label="Pending" value={stats.pending} icon={<Clock className="w-4 h-4" />} tone="warn" />
        <StatCard label="Failed" value={stats.failed} icon={<XCircle className="w-4 h-4" />} tone="danger" />
        <StatCard label="DLQ" value={stats.dlq} icon={<ShieldAlert className="w-4 h-4" />} tone="danger" />
        <StatCard label="Suppressed" value={stats.suppressed} icon={<AlertTriangle className="w-4 h-4" />} tone="muted" />
      </div>

      {/* Table */}
      <AdminCard>
        {isLoading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Loading email logs…</div>
        ) : rows.length === 0 ? (
          <EmptyState message="No email log entries match the current filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3 font-semibold">When</th>
                  <th className="py-2 pr-3 font-semibold">Template</th>
                  <th className="py-2 pr-3 font-semibold">Recipient</th>
                  <th className="py-2 pr-3 font-semibold">Status</th>
                  <th className="py-2 pr-3 font-semibold text-right">Tries</th>
                  <th className="py-2 pr-3 font-semibold">Detail</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => <LogRow key={(r.message_id ?? "") + i} row={r} />)}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <div>
              Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}>
                Previous
              </Button>
              <span className="px-2">Page {currentPage} / {pages}</span>
              <Button size="sm" variant="outline" disabled={offset + PAGE_SIZE >= total} onClick={() => setOffset(offset + PAGE_SIZE)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </AdminCard>
    </AdminPage>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">{children}</div>
    </div>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 rounded-md border px-3 text-xs font-medium transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}

function StatCard({
  label, value, icon, tone,
}: {
  label: string; value: number; icon: React.ReactNode;
  tone: "default" | "success" | "warn" | "danger" | "muted";
}) {
  const toneCls = {
    default: "border-border",
    success: "border-emerald-500/40 bg-emerald-500/5 text-emerald-300",
    warn: "border-amber-500/40 bg-amber-500/5 text-amber-300",
    danger: "border-destructive/40 bg-destructive/5 text-destructive",
    muted: "border-border bg-muted/30 text-muted-foreground",
  }[tone];
  return (
    <div className={`rounded-xl border p-3 ${toneCls}`}>
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider opacity-80">
        {icon}{label}
      </div>
      <div className="mt-1 text-2xl font-black tabular-nums">{value}</div>
    </div>
  );
}

function LogRow({ row }: { row: EmailLogRow }) {
  const tone = statusTone(row.status);
  return (
    <tr className="border-b border-border/60 align-top hover:bg-muted/30">
      <td className="py-2.5 pr-3 whitespace-nowrap text-xs text-muted-foreground">
        {new Date(row.created_at).toLocaleString()}
      </td>
      <td className="py-2.5 pr-3 font-medium">{row.template_name}</td>
      <td className="py-2.5 pr-3 break-all">{row.recipient_email}</td>
      <td className="py-2.5 pr-3">
        <Badge variant="outline" className={tone.cls}>
          <tone.Icon className="w-3 h-3 mr-1" />
          <span className="capitalize">{row.status}</span>
        </Badge>
      </td>
      <td className="py-2.5 pr-3 text-right tabular-nums text-xs">{row.attempts}</td>
      <td className="py-2.5 pr-3">
        {row.error_message ? (
          <div className="text-xs text-destructive break-words font-mono">{row.error_message}</div>
        ) : (
          <div className="text-[11px] text-muted-foreground break-all font-mono">{row.message_id}</div>
        )}
      </td>
    </tr>
  );
}

function statusTone(status: string): { cls: string; Icon: typeof CheckCircle2 } {
  switch (status) {
    case "sent":
      return { cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300", Icon: CheckCircle2 };
    case "pending":
    case "queued":
      return { cls: "border-amber-500/40 bg-amber-500/10 text-amber-300", Icon: Clock };
    case "dlq":
      return { cls: "border-destructive/60 bg-destructive/15 text-destructive", Icon: ShieldAlert };
    case "suppressed":
      return { cls: "border-muted-foreground/40 bg-muted/30 text-muted-foreground", Icon: AlertTriangle };
    default:
      return { cls: "border-destructive/50 bg-destructive/10 text-destructive", Icon: XCircle };
  }
}
