import { createFileRoute } from "@tanstack/react-router";
import { Server, MapPin, Activity, RefreshCw, Loader2, Clock, BarChart3, ChevronDown, Copy } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/runtime")({
  component: RuntimePage,
  head: () => ({ meta: [{ title: "Runtime — Admin" }] }),
});

type ServerInfo = {
  colo?: string;
  city?: string;
  country?: string;
  region?: string;
  timezone?: string;
  ip?: string;
  serverTime?: string;
  rawHeaders?: Record<string, string>;
};

function RuntimePage() {
  const [info, setInfo] = useState<ServerInfo | null>(null);
  const [ping, setPing] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [pinging, setPinging] = useState(false);
  const [skewMs, setSkewMs] = useState<number | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());

  const loadInfo = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/server-info", { cache: "no-store" });
      const data = await res.json();
      setInfo(data);
      if (data?.serverTime) {
        const parsed = new Date(data.serverTime).getTime();
        if (!Number.isNaN(parsed)) setSkewMs(parsed - Date.now());
      }
    } catch {
      setInfo(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const [samples, setSamples] = useState<number[]>([]);

  type Reading = {
    at: number;
    location: string;
    colo: string | null;
    min: number;
    avg: number;
    max: number;
    median: number;
  };
  const [timeline, setTimeline] = useState<Reading[]>([]);
  const infoRef = useRef<ServerInfo | null>(null);
  useEffect(() => { infoRef.current = info; }, [info]);

  const measurePing = useCallback(async () => {
    setPinging(true);
    setSamples([]);
    try {
      const collected: number[] = [];
      for (let i = 0; i < 10; i++) {
        const t = performance.now();
        await fetch("/api/server-info?ping=1", { cache: "no-store" });
        const dt = performance.now() - t;
        collected.push(dt);
        setSamples([...collected]);
      }
      const sorted = [...collected].sort((a, b) => a - b);
      const median = Math.round(sorted[Math.floor(sorted.length / 2)]);
      setPing(median);
      const i = infoRef.current;
      const loc = i
        ? [i.city, i.region, i.country].filter(Boolean).join(", ") || i.colo || "Unknown"
        : "Unknown";
      const reading: Reading = {
        at: Date.now(),
        location: loc,
        colo: i?.colo ?? null,
        min: Math.round(Math.min(...collected)),
        max: Math.round(Math.max(...collected)),
        avg: Math.round(collected.reduce((a, b) => a + b, 0) / collected.length),
        median,
      };
      setTimeline((prev) => [...prev, reading].slice(-30));
    } catch {
      setPing(null);
    } finally {
      setPinging(false);
    }
  }, []);

  const [autoRefresh, setAutoRefresh] = useState(false);
  const [intervalSec, setIntervalSec] = useState(15);
  const [privacy, setPrivacy] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("runtime.privacy") === "1";
  });
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("runtime.privacy", privacy ? "1" : "0");
    }
  }, [privacy]);
  const busyRef = useRef(false);

  const maskIp = (ip: string) => {
    if (ip.includes(":")) return ip.split(":").slice(0, 2).join(":") + "::•••";
    const parts = ip.split(".");
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.•••.•••`;
    return "•••";
  };

  useEffect(() => {
    loadInfo();
    measurePing();
  }, [loadInfo, measurePing]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(async () => {
      if (busyRef.current) return;
      busyRef.current = true;
      try {
        await loadInfo();
        await measurePing();
      } finally {
        busyRef.current = false;
      }
    }, intervalSec * 1000);
    return () => clearInterval(id);
  }, [autoRefresh, intervalSec, loadInfo, measurePing]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const tz = info?.timezone || "UTC";
  const serverNow = new Date(now + (skewMs ?? 0));
  let timeStr = "—";
  let dateStr = "";
  let offsetStr = "";
  try {
    timeStr = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(serverNow);
    dateStr = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(serverNow);
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    }).formatToParts(serverNow);
    offsetStr = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
  } catch {
    timeStr = serverNow.toISOString().slice(11, 19) + " UTC";
  }

  const location = info
    ? [info.city, info.region, info.country].filter(Boolean).join(", ") || info.colo || "Unknown"
    : "—";

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-black tracking-tight">Runtime</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-xl">
          Content is served directly from the database. No external storage
          client to manage.
        </p>
      </header>

      <section className="rounded-2xl border border-border bg-card p-5 flex items-start gap-3">
        <Server className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
        <div className="text-sm text-muted-foreground">
          Database-backed runtime active. Public pages read live from Supabase
          tables — no caching layer to refresh.
        </div>
      </section>

      <section className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Server location</h2>
          </div>
          <div className="text-lg font-semibold">
            {privacy ? (info?.colo ? `Edge ${info.colo}` : "Hidden") : location}
          </div>
          <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
            {info?.colo && <div>Edge: <span className="font-mono">{info.colo}</span></div>}
            {!privacy && info?.timezone && <div>TZ: <span className="font-mono">{info.timezone}</span></div>}
            {info?.ip && (
              <div>IP: <span className="font-mono">{privacy ? maskIp(info.ip) : info.ip}</span></div>
            )}
            {privacy && (
              <div className="italic opacity-70">City &amp; full IP hidden by privacy mode.</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Server ping</h2>
          </div>
          <div className="text-lg font-semibold">
            {ping != null ? `${ping} ms` : "—"}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Median of 10 round-trips from your browser to the edge.
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 sm:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Latency samples</h2>
            <span className="ml-auto text-xs text-muted-foreground">
              {samples.length}/10 samples
            </span>
          </div>
          {samples.length > 0 ? (
            <>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <Stat label="Min" value={`${Math.round(Math.min(...samples))} ms`} tone="ok" />
                <Stat
                  label="Avg"
                  value={`${Math.round(samples.reduce((a, b) => a + b, 0) / samples.length)} ms`}
                />
                <Stat label="Max" value={`${Math.round(Math.max(...samples))} ms`} tone="bad" />
              </div>
              <div className="h-48 -ml-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={samples.map((ms, i) => ({ name: `#${i + 1}`, ms: Math.round(ms) }))}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} unit=" ms" width={56} />
                    <Tooltip
                      cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(v: number) => [`${v} ms`, "Latency"]}
                    />
                    <ReferenceLine
                      y={samples.reduce((a, b) => a + b, 0) / samples.length}
                      stroke="hsl(var(--primary))"
                      strokeDasharray="4 4"
                      label={{ value: "avg", fill: "hsl(var(--primary))", fontSize: 10, position: "right" }}
                    />
                    <Bar dataKey="ms" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground py-8 text-center">
              {pinging ? "Measuring…" : "Click \"Re-measure ping\" to collect samples."}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 sm:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Server clock</h2>
          </div>
          <div className="text-3xl font-mono font-semibold tabular-nums">{timeStr}</div>
          <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
            {dateStr && <div>{dateStr}</div>}
            <div>
              Timezone: <span className="font-mono">{tz}</span>
              {offsetStr && <> · <span className="font-mono">{offsetStr}</span></>}
            </div>
            {skewMs != null && (
              <div>Clock skew vs your browser: <span className="font-mono">{skewMs >= 0 ? "+" : ""}{skewMs} ms</span></div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Timeline</h2>
          <span className="ml-auto text-xs text-muted-foreground">
            Last {timeline.length}/30 readings (in-memory, this session)
          </span>
          {timeline.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setTimeline([])}
            >
              Clear
            </Button>
          )}
        </div>
        {timeline.length > 0 ? (
          <>
            <div className="h-56 -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={timeline.map((r) => ({
                    t: new Date(r.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
                    min: r.min,
                    avg: r.avg,
                    max: r.max,
                  }))}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="t" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} unit=" ms" width={56} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} iconSize={10} />
                  <Line type="monotone" dataKey="min" stroke="hsl(var(--primary) / 0.5)" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="avg" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="max" stroke="hsl(var(--destructive) / 0.7)" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 rounded-lg border border-border overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/40 text-[10px] uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2">Time</th>
                    <th className="text-left px-3 py-2">Location</th>
                    <th className="text-right px-3 py-2">Min</th>
                    <th className="text-right px-3 py-2">Avg</th>
                    <th className="text-right px-3 py-2">Median</th>
                    <th className="text-right px-3 py-2">Max</th>
                  </tr>
                </thead>
                <tbody>
                  {[...timeline].reverse().map((r) => (
                    <tr key={r.at} className="border-t">
                      <td className="px-3 py-1.5 font-mono text-muted-foreground whitespace-nowrap">
                        {new Date(r.at).toLocaleTimeString()}
                      </td>
                      <td className="px-3 py-1.5">
                        {r.location}
                        {r.colo && <span className="ml-1 text-muted-foreground font-mono">({r.colo})</span>}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono tabular-nums">{r.min} ms</td>
                      <td className="px-3 py-1.5 text-right font-mono tabular-nums">{r.avg} ms</td>
                      <td className="px-3 py-1.5 text-right font-mono tabular-nums">{r.median} ms</td>
                      <td className="px-3 py-1.5 text-right font-mono tabular-nums">{r.max} ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="text-sm text-muted-foreground py-8 text-center">
            No readings yet — each ping sweep adds an entry. Enable auto-refresh to build a series.
          </div>
        )}
      </section>


      <Collapsible className="rounded-2xl border border-border bg-card">
        <CollapsibleTrigger className="group flex w-full items-center gap-2 px-5 py-4 text-left">
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
          <span className="text-sm font-semibold">Raw edge headers</span>
          <span className="ml-2 text-xs text-muted-foreground">
            {info?.rawHeaders ? `${Object.keys(info.rawHeaders).length} headers` : "—"}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!info?.rawHeaders) return;
              navigator.clipboard.writeText(JSON.stringify(info.rawHeaders, null, 2));
              toast.success("Copied raw headers");
            }}
            className="ml-auto inline-flex items-center justify-center h-7 w-7 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Copy raw headers"
            title="Copy as JSON"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-5 pb-5">
            <p className="text-xs text-muted-foreground mb-3">
              Cloudflare <code className="font-mono">cf-*</code> request headers used to compute
              location, timezone, and IP. Forwarded by the edge — not user-supplied.
            </p>
            {info?.rawHeaders && Object.keys(info.rawHeaders).length > 0 ? (
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-xs">
                  <tbody>
                    {Object.entries(info.rawHeaders)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([k, v]) => (
                        <tr key={k} className="border-t first:border-t-0">
                          <td className="px-3 py-1.5 font-mono text-muted-foreground whitespace-nowrap align-top">
                            {k}
                          </td>
                          <td className="px-3 py-1.5 font-mono break-all">{v}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground py-3 text-center">
                No <code className="font-mono">cf-*</code> headers present (likely not running behind
                Cloudflare in this environment).
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={loadInfo} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh location
        </Button>
        <Button variant="outline" size="sm" onClick={measurePing} disabled={pinging}>
          {pinging ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Activity className="h-4 w-4 mr-2" />}
          Re-measure ping
        </Button>

        <div className="ml-auto flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-1.5">
          <div className="flex items-center gap-2">
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
            <Label htmlFor="auto-refresh" className="text-xs cursor-pointer">
              Auto-refresh
            </Label>
          </div>
          <Select
            value={String(intervalSec)}
            onValueChange={(v) => setIntervalSec(Number(v))}
            disabled={!autoRefresh}
          >
            <SelectTrigger className="h-7 w-[88px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5s</SelectItem>
              <SelectItem value="15">15s</SelectItem>
              <SelectItem value="30">30s</SelectItem>
              <SelectItem value="60">1m</SelectItem>
              <SelectItem value="300">5m</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "ok" | "bad" }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div
        className={`text-base font-mono font-semibold mt-0.5 tabular-nums ${
          tone === "ok" ? "text-emerald-400" : tone === "bad" ? "text-destructive" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}
