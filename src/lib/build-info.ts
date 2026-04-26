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
