import { createFileRoute, Link } from "@tanstack/react-router";
import {
  useLoaderTimings,
  DEFAULT_LOADER_TIMINGS,
  LOADER_MIN_MS,
  LOADER_MAX_MS,
} from "@/hooks/useLoaderTimings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export const Route = createFileRoute("/debug")({
  component: DebugLoaderPage,
  head: () => ({
    meta: [
      { title: "Debug · PageLoader timings" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function DebugLoaderPage() {
  const { timings, update, reset } = useLoaderTimings();

  return (
    <div className="min-h-screen bg-background text-foreground px-6 py-12">
      <div className="max-w-xl mx-auto space-y-8">
        <header className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary">
            Debug
          </p>
          <h1 className="text-3xl font-black tracking-tight">PageLoader timings</h1>
          <p className="text-sm text-muted-foreground">
            Adjust how long the brand loader stays visible. Values are clamped to{" "}
            {LOADER_MIN_MS}–{LOADER_MAX_MS}ms (3–5s) and persist in this browser
            (localStorage). Defaults: {DEFAULT_LOADER_TIMINGS.initialMs}ms /{" "}
            {DEFAULT_LOADER_TIMINGS.routeMs}ms.
          </p>
        </header>

        <TimingControl
          label="Initial load (initialMs)"
          value={timings.initialMs}
          onChange={(v) => update({ initialMs: v })}
        />
        <TimingControl
          label="Route transitions (routeMs)"
          value={timings.routeMs}
          onChange={(v) => update({ routeMs: v })}
        />

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button variant="outline" onClick={reset}>
            Reset to defaults
          </Button>
          <Button asChild variant="secondary">
            <Link to="/">Go to launcher</Link>
          </Button>
          <span className="text-xs text-muted-foreground">
            Tip: navigate between routes to verify the new <code>routeMs</code> value.
          </span>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 text-xs text-muted-foreground">
          <p className="font-mono">
            current: initialMs={timings.initialMs} · routeMs={timings.routeMs}
          </p>
        </div>
      </div>
    </div>
  );
}

function TimingControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-4">
        <Label className="text-sm font-semibold">{label}</Label>
        <Input
          type="number"
          min={LOADER_MIN_MS}
          max={LOADER_MAX_MS}
          step={100}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-28 text-right"
        />
      </div>
      <Slider
        min={LOADER_MIN_MS}
        max={LOADER_MAX_MS}
        step={100}
        value={[Math.min(LOADER_MAX_MS, Math.max(LOADER_MIN_MS, value))]}
        onValueChange={(v) => onChange(v[0] ?? LOADER_MIN_MS)}
      />
      <p className="text-[11px] text-muted-foreground">
        {(value / 1000).toFixed(1)}s
      </p>
    </div>
  );
}
