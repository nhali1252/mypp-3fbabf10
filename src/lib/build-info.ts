import manifest from "@/build-manifest.json";

export type BuildManifest = typeof manifest;

/**
 * Manifest baked into the bundle at build time (or the last `bun run manifest`).
 */
export const BUILD_MANIFEST: BuildManifest = manifest;

/**
 * Captured the moment this module is first evaluated by the runtime —
 * effectively when the bundle is loaded by the browser. Combined with the
 * manifest's builtAt this lets us flag bundles that have been sitting in
 * client cache long after a new build was published.
 */
export const RUNTIME_BOOTED_AT = new Date().toISOString();

export type DiagnosticsVerdict = "match" | "mismatch" | "unknown";

/** Where a TypeScript error was observed. */
export type TsErrorSource = "build" | "dev-server" | "editor";

export type TsError = {
  /** Stable id so React lists/keys are predictable. */
  id: string;
  source: TsErrorSource;
  /** Project-relative file path, e.g. "src/components/Foo.tsx". */
  file: string;
  line: number;
  column: number;
  /** TS error code without the "TS" prefix, e.g. "2304". */
  code?: string;
  message: string;
  /** ISO timestamp the error was observed (build = manifest.tsc.ranAt). */
  observedAt: string;
};

/**
 * Parse the captured `tsc --noEmit` output into structured errors.
 *
 * Matches the standard tsc format:
 *   src/foo/bar.tsx(12,34): error TS2304: Cannot find name 'Baz'.
 * and the pretty/colorless format:
 *   src/foo/bar.tsx:12:34 - error TS2304: Cannot find name 'Baz'.
 */
export function parseTscOutput(
  output: string | undefined,
  observedAt: string,
  source: TsErrorSource = "build",
): TsError[] {
  if (!output) return [];
  const re =
    /^(.+?)(?:\((\d+),(\d+)\)|:(\d+):(\d+))\s*[-:]?\s*error\s+TS(\d+):\s*(.+)$/gm;
  const out: TsError[] = [];
  let i = 0;
  for (const m of output.matchAll(re)) {
    const file = m[1].trim();
    const line = Number(m[2] ?? m[4]);
    const column = Number(m[3] ?? m[5]);
    const code = m[6];
    const message = m[7].trim();
    out.push({
      id: `${source}:${file}:${line}:${column}:${code}:${i++}`,
      source,
      file,
      line,
      column,
      code,
      message,
      observedAt,
    });
  }
  return out;
}

/**
 * Build a link for a file:line that opens in the user's editor when running
 * locally (Vite's `/__open-in-editor` endpoint), and falls back to a GitHub
 * blob URL in production when `VITE_REPO_URL` is set, otherwise null.
 */
export function buildErrorLink(
  err: Pick<TsError, "file" | "line" | "column">,
  opts: { gitHash?: string; gitBranch?: string } = {},
): string | null {
  if (import.meta.env.DEV) {
    const params = new URLSearchParams({
      file: err.file,
      line: String(err.line),
      column: String(err.column),
    });
    return `/__open-in-editor?${params.toString()}`;
  }
  const repo = (import.meta.env.VITE_REPO_URL as string | undefined)?.replace(/\/$/, "");
  if (!repo) return null;
  const ref =
    opts.gitHash && opts.gitHash !== "unknown"
      ? opts.gitHash
      : opts.gitBranch && opts.gitBranch !== "unknown"
      ? opts.gitBranch
      : "main";
  return `${repo}/blob/${ref}/${err.file}#L${err.line}`;
}


export type DiagnosticsSummary = {
  verdict: DiagnosticsVerdict;
  buildAgeMs: number;
  reasons: string[];
};

/**
 * Compare the bundle's manifest against runtime expectations and return a
 * concise verdict for the diagnostics panel.
 */
export function summarizeDiagnostics(
  m: BuildManifest = BUILD_MANIFEST,
  bootedAt: string = RUNTIME_BOOTED_AT,
): DiagnosticsSummary {
  const reasons: string[] = [];
  const buildAgeMs = Math.max(
    0,
    new Date(bootedAt).getTime() - new Date(m.builtAt).getTime(),
  );

  if (!m.tsc?.ok) reasons.push(`tsc reported ${m.tsc?.errorCount ?? "?"} error(s)`);
  if (m.gitDirty) reasons.push("Uncommitted changes were present at build time");
  if (m.gitHash === "unknown") reasons.push("Git hash unavailable at build time");
  // 24h is generous; flag anything older as suspicious.
  if (buildAgeMs > 24 * 60 * 60 * 1000) reasons.push("Bundle is over 24h old");

  let verdict: DiagnosticsVerdict = "match";
  if (m.gitHash === "unknown" && !m.tsc?.ok) verdict = "unknown";
  else if (reasons.length > 0) verdict = "mismatch";

  return { verdict, buildAgeMs, reasons };
}
