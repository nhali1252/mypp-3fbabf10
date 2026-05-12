import { createFileRoute } from "@tanstack/react-router";
import { Server, MapPin, Activity, RefreshCw, Loader2 } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";

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
};

function RuntimePage() {
  const [info, setInfo] = useState<ServerInfo | null>(null);
  const [ping, setPing] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [pinging, setPinging] = useState(false);

  const loadInfo = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/server-info", { cache: "no-store" });
      const data = await res.json();
      setInfo(data);
    } catch {
      setInfo(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const measurePing = useCallback(async () => {
    setPinging(true);
    try {
      const samples: number[] = [];
      for (let i = 0; i < 5; i++) {
        const t = performance.now();
        await fetch("/api/server-info?ping=1", { cache: "no-store" });
        samples.push(performance.now() - t);
      }
      samples.sort((a, b) => a - b);
      setPing(Math.round(samples[Math.floor(samples.length / 2)]));
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
