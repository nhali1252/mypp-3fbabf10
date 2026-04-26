import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  CheckCircle2, AlertTriangle, RefreshCw, GitBranch, Hash,
  Clock, Cpu, FileCode2, Terminal, Loader2, ExternalLink, Activity, Eraser,
} from "lucide-react";
import { toast } from "sonner";
import {
  BUILD_MANIFEST,
  RUNTIME_BOOTED_AT,
  buildErrorLink,
  parseTscOutput,
  summarizeDiagnostics,
  type BuildManifest,
  type TsError,
  type TsErrorSource,
} from "@/lib/build-info";
import { clearLiveErrors, useLiveTsErrors } from "@/lib/live-ts-errors";
import { refreshDiagnostics } from "@/server/diagnostics.functions";

export const Route = createFileRoute("/_admin/admin/diagnostics")({
  component: DiagnosticsPage,
  head: () => ({ meta: [{ title: "Build diagnostics — Admin" }] }),
});

function fmtDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`;
  return `${Math.round(ms / 3_600_000)}h`;
}

function fmtAge(ms: number) {
  if (ms < 60_000) return "just now";
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)} min ago`;
  if (ms < 86_400_000) return `${Math.round(ms / 3_600_000)} h ago`;
  return `${Math.round(ms / 86_400_000)} d ago`;
}

function DiagnosticsPage() {
  const [manifest, setManifest] = useState<BuildManifest>(BUILD_MANIFEST);
  const summary = useMemo(() => summarizeDiagnostics(manifest, RUNTIME_BOOTED_AT), [manifest]);
  const liveErrors = useLiveTsErrors();
  const buildErrors = useMemo(
    () =>
      parseTscOutput(
        manifest.tsc?.output,
        manifest.tsc?.ranAt ?? manifest.builtAt,
        "build",
      ),
    [manifest],
  );
  const allErrors = useMemo(
    () =>
      [...liveErrors, ...buildErrors].sort(
        (a, b) => new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime(),
      ),
    [liveErrors, buildErrors],
  );

  const refresh = useMutation({
    mutationFn: async () => refreshDiagnostics(),
    onSuccess: (res: any) => {
      if (res.ok) {
        setManifest(res.manifest);
        toast.success(`Typecheck refreshed in ${fmtDuration(res.durationMs)}`);
      } else {
        toast.error(res.error ?? "Refresh failed", { description: res.hint });
      }
    },
    onError: (e: any) =>
      toast.error("Refresh failed", { description: e?.message ?? "Unknown error" }),
  });

  const verdictColor =
    summary.verdict === "match"
      ? "text-emerald-400 border-emerald-500/40 bg-emerald-500/10"
      : summary.verdict === "mismatch"
      ? "text-amber-400 border-amber-500/40 bg-amber-500/10"
      : "text-zinc-400 border-zinc-500/40 bg-zinc-500/10";
  const VerdictIcon = summary.verdict === "match" ? CheckCircle2 : AlertTriangle;
  const tscOk = manifest.tsc?.ok ?? false;

  return (
    <div className="space-y-6 max-w-4xl">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Build diagnostics</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Last <code className="px-1 rounded bg-muted font-mono text-[11px]">tsc --noEmit</code>{" "}
            result, build identifier, and a verdict on whether the running UI
            bundle matches the typecheck output.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refresh.mutate()}
          disabled={refresh.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-[0.2em] hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {refresh.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Re-run typecheck
        </button>
      </header>

      {/* Verdict */}
      <section
        className={`rounded-2xl border p-5 flex items-start gap-4 ${verdictColor}`}
        aria-live="polite"
      >
        <VerdictIcon className="h-6 w-6 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold uppercase tracking-[0.18em]">
            {summary.verdict === "match"
              ? "Bundle matches typecheck"
              : summary.verdict === "mismatch"
              ? "Possible mismatch"
              : "Unknown — manifest incomplete"}
          </p>
          {summary.reasons.length > 0 ? (
            <ul className="mt-2 text-xs space-y-1 list-disc list-inside text-current/90">
              {summary.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs mt-1 opacity-80">
              No issues detected. The running bundle was built with a clean tsc pass.
            </p>
          )}
          <p className="mt-2 text-[11px] font-mono uppercase tracking-[0.18em] opacity-70">
            Bundle age: {fmtAge(summary.buildAgeMs)}
          </p>
        </div>
      </section>

      {/* Detail grid */}
      <section className="grid sm:grid-cols-2 gap-4">
        <DetailCard
          icon={FileCode2}
          label="Typecheck"
          value={tscOk ? "Passing" : `${manifest.tsc?.errorCount ?? "?"} errors`}
          tone={tscOk ? "ok" : "bad"}
          rows={[
            ["Ran", new Date(manifest.tsc?.ranAt ?? manifest.builtAt).toLocaleString()],
            ["Duration", fmtDuration(manifest.tsc?.durationMs ?? 0)],
          ]}
        />
        <DetailCard
          icon={Hash}
          label="Build ID"
          value={manifest.gitShort}
          tone={manifest.gitHash === "unknown" ? "warn" : "neutral"}
          rows={[
            ["Build ID", manifest.buildId],
            ["Built at", new Date(manifest.builtAt).toLocaleString()],
            ["Bundle booted", new Date(RUNTIME_BOOTED_AT).toLocaleString()],
          ]}
          mono
        />
        <DetailCard
          icon={GitBranch}
          label="Git"
          value={manifest.gitBranch}
          tone={manifest.gitDirty ? "warn" : "neutral"}
          rows={[
            ["Hash", manifest.gitHash],
            ["Dirty", manifest.gitDirty ? "yes (uncommitted changes)" : "no"],
          ]}
          mono
        />
        <DetailCard
          icon={Cpu}
          label="Environment"
          value={manifest.platform}
          tone="neutral"
          rows={[
            ["Node", manifest.node],
            ["Mode", import.meta.env.DEV ? "development" : "production"],
          ]}
          mono
        />
      </section>

      {/* Side-by-side diff */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-2">
          <Clock className="h-4 w-4" /> Bundle vs typecheck timeline
        </h2>
        <div className="mt-3 grid sm:grid-cols-3 gap-3 text-xs font-mono">
          <TimelineCell label="tsc ran" value={manifest.tsc?.ranAt ?? "—"} />
          <TimelineCell label="bundle built" value={manifest.builtAt} />
          <TimelineCell label="bundle booted" value={RUNTIME_BOOTED_AT} />
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          tsc and bundle build come from the same{" "}
          <code className="font-mono">prebuild</code> step, so their timestamps
          should be within a few seconds of each other. A large gap between
          "bundle built" and "bundle booted" means a stale bundle is cached in
          the browser — hard reload to fix.
        </p>
      </section>

      {/* Activity timeline — live + build errors with file:line links */}
      <ActivityTimeline
        errors={allErrors}
        gitHash={manifest.gitHash}
        gitBranch={manifest.gitBranch}
        liveCount={liveErrors.length}
        buildCount={buildErrors.length}
      />

      {/* Raw tsc output (collapsed reference) */}
      {!tscOk && manifest.tsc?.output && (
        <details className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 group">
          <summary className="text-sm font-bold uppercase tracking-[0.18em] text-amber-400 flex items-center gap-2 cursor-pointer select-none">
            <Terminal className="h-4 w-4" /> Raw tsc output (last 4KB)
          </summary>
          <pre className="mt-3 text-[11px] font-mono whitespace-pre-wrap break-all max-h-[360px] overflow-auto p-3 rounded-lg bg-black/40 border border-amber-500/20 text-amber-100/90">
            {manifest.tsc.output}
          </pre>
        </details>
      )}
    </div>
  );
}

function DetailCard({
  icon: Icon, label, value, rows, tone = "neutral", mono = false,
}: {
  icon: any;
  label: string;
  value: string;
  rows: [string, string][];
  tone?: "ok" | "warn" | "bad" | "neutral";
  mono?: boolean;
}) {
  const toneRing =
    tone === "ok"
      ? "border-emerald-500/30"
      : tone === "warn"
      ? "border-amber-500/30"
      : tone === "bad"
      ? "border-rose-500/30"
      : "border-border";
  const valueColor =
    tone === "ok"
      ? "text-emerald-400"
      : tone === "warn"
      ? "text-amber-400"
      : tone === "bad"
      ? "text-rose-400"
      : "text-foreground";
  return (
    <div className={`rounded-2xl border ${toneRing} bg-card p-4`}>
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className={`mt-2 text-base font-bold tracking-tight ${valueColor} ${mono ? "font-mono break-all" : ""}`}>
        {value || "—"}
      </div>
      <dl className="mt-3 space-y-1 text-[11px]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-start justify-between gap-3">
            <dt className="text-muted-foreground uppercase tracking-[0.16em] font-bold text-[10px] mt-0.5">{k}</dt>
            <dd className={`${mono ? "font-mono" : ""} text-right break-all max-w-[60%]`}>{v || "—"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function TimelineCell({ label, value }: { label: string; value: string }) {
  const parsed = value && value !== "—" ? new Date(value) : null;
  return (
    <div className="rounded-xl border border-border bg-background/40 p-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-xs">{parsed ? parsed.toLocaleString() : value}</div>
      {parsed && (
        <div className="mt-0.5 text-[10px] text-muted-foreground">
          {fmtAge(Date.now() - parsed.getTime())}
        </div>
      )}
    </div>
  );
}

/* ---------- Activity timeline ---------- */

const SOURCE_META: Record<
  TsErrorSource,
  { label: string; classes: string; description: string }
> = {
  editor: {
    label: "Editor",
    classes: "border-rose-500/40 bg-rose-500/10 text-rose-300",
    description: "Captured live in the running preview (window error).",
  },
  "dev-server": {
    label: "Dev server",
    classes: "border-sky-500/40 bg-sky-500/10 text-sky-300",
    description: "Reported by Vite HMR while you were browsing.",
  },
  build: {
    label: "Last build",
    classes: "border-amber-500/40 bg-amber-500/10 text-amber-300",
    description: "From the last successful manifest build (tsc --noEmit).",
  },
};

function ActivityTimeline({
  errors,
  gitHash,
  gitBranch,
  liveCount,
  buildCount,
}: {
  errors: TsError[];
  gitHash: string;
  gitBranch: string;
  liveCount: number;
  buildCount: number;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-2">
            <Activity className="h-4 w-4" /> Activity timeline
          </h2>
          <p className="mt-1 text-[11px] text-muted-foreground">
            TypeScript errors observed in this session, tagged by source. Click
            a file to jump to the exact line in your editor.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          <span>
            {liveCount} live · {buildCount} build
          </span>
          {liveCount > 0 && (
            <button
              type="button"
              onClick={() => clearLiveErrors()}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-border hover:bg-muted transition-colors"
            >
              <Eraser className="h-3 w-3" /> Clear live
            </button>
          )}
        </div>
      </header>

      {errors.length === 0 ? (
        <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          No TypeScript errors detected from any source.
        </div>
      ) : (
        <ol className="mt-4 space-y-2">
          {errors.map((e) => (
            <ErrorRow key={e.id} err={e} gitHash={gitHash} gitBranch={gitBranch} />
          ))}
        </ol>
      )}
    </section>
  );
}

function ErrorRow({
  err,
  gitHash,
  gitBranch,
}: {
  err: TsError;
  gitHash: string;
  gitBranch: string;
}) {
  const meta = SOURCE_META[err.source];
  const link = buildErrorLink(err, { gitHash, gitBranch });
  const fileLabel = `${err.file}:${err.line}:${err.column}`;
  return (
    <li className="rounded-xl border border-border bg-background/40 p-3">
      <div className="flex items-start gap-3 flex-wrap">
        <span
          title={meta.description}
          className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-[0.18em] ${meta.classes}`}
        >
          {meta.label}
        </span>
        <div className="flex-1 min-w-[200px]">
          <div className="text-xs font-mono break-all">
            {link ? (
              <a
                href={link}
                target={import.meta.env.DEV ? undefined : "_blank"}
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                {fileLabel}
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            ) : (
              <span className="text-foreground">{fileLabel}</span>
            )}
          </div>
          <div className="mt-1 text-xs text-foreground/90">
            {err.code && (
              <span className="font-mono text-[10px] mr-1.5 px-1 rounded bg-muted text-muted-foreground">
                TS{err.code}
              </span>
            )}
            {err.message}
          </div>
        </div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground shrink-0">
          {new Date(err.observedAt).toLocaleTimeString()}
        </div>
      </div>
    </li>
  );
}

