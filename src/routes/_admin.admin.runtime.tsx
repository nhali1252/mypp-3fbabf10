import { createFileRoute } from "@tanstack/react-router";
import { Server, MapPin, Activity, RefreshCw, Loader2, Clock, BarChart3 } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from "recharts";

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
      setPing(Math.round(sorted[Math.floor(sorted.length / 2)]));
    } catch {
      setPing(null);
    } finally {
      setPinging(false);
    }
  }, []);

  useEffect(() => {
    loadInfo();
    measurePing();
  }, [loadInfo, measurePing]);

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
          <div className="text-lg font-semibold">{location}</div>
          <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
            {info?.colo && <div>Edge: <span className="font-mono">{info.colo}</span></div>}
            {info?.timezone && <div>TZ: <span className="font-mono">{info.timezone}</span></div>}
            {info?.ip && <div>IP: <span className="font-mono">{info.ip}</span></div>}
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
            Median of 5 round-trips from your browser to the edge.
          </div>
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

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={loadInfo} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh location
        </Button>
        <Button variant="outline" size="sm" onClick={measurePing} disabled={pinging}>
          {pinging ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Activity className="h-4 w-4 mr-2" />}
          Re-measure ping
        </Button>
      </div>
    </div>
  );
}
