#!/usr/bin/env node
/**
 * Generates src/build-manifest.json with:
 *   - buildId          (timestamp + short git hash)
 *   - gitHash          (full)
 *   - gitShort         (first 7)
 *   - gitBranch
 *   - gitDirty         (true if uncommitted changes)
 *   - builtAt          (ISO)
 *   - tsc              ({ ok, durationMs, ranAt, errorCount, output? })
 *   - node, platform
 *
 * The file is imported directly by the diagnostics page so the running bundle
 * always carries the manifest values that match its source revision.
 *
 * Designed to be safe even when git is unavailable or tsc fails.
 */

import { execSync, spawnSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = resolve(ROOT, "src/build-manifest.json");

function safe(fn, fallback) {
  try { return fn(); } catch { return fallback; }
}

const gitHash = safe(
  () => execSync("git rev-parse HEAD", { cwd: ROOT, encoding: "utf8" }).trim(),
  "unknown",
);
const gitShort = gitHash === "unknown" ? "unknown" : gitHash.slice(0, 7);
const gitBranch = safe(
  () => execSync("git rev-parse --abbrev-ref HEAD", { cwd: ROOT, encoding: "utf8" }).trim(),
  "unknown",
);
const gitDirty = safe(
  () => execSync("git status --porcelain", { cwd: ROOT, encoding: "utf8" }).trim().length > 0,
  false,
);

const builtAt = new Date().toISOString();
const buildId = `${builtAt.replace(/[:.]/g, "-")}_${gitShort}`;

console.log(`[build-manifest] running tsc --noEmit …`);
const tscStart = Date.now();
const tscRes = spawnSync("bunx", ["tsc", "--noEmit", "-p", "tsconfig.json"], {
  cwd: ROOT,
  encoding: "utf8",
  shell: false,
});
const tscMs = Date.now() - tscStart;
const tscOk = tscRes.status === 0;
const tscOutput = (tscRes.stdout ?? "") + (tscRes.stderr ?? "");
const errorCount = (tscOutput.match(/error TS\d+:/g) ?? []).length;

const manifest = {
  buildId,
  gitHash,
  gitShort,
  gitBranch,
  gitDirty,
  builtAt,
  node: process.version,
  platform: `${process.platform}-${process.arch}`,
  tsc: {
    ok: tscOk,
    ranAt: new Date(tscStart).toISOString(),
    durationMs: tscMs,
    errorCount,
    // Truncate to keep the bundle small.
    output: tscOk ? "" : tscOutput.slice(-4000),
  },
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(manifest, null, 2) + "\n");
console.log(`[build-manifest] wrote ${OUT} — tsc ${tscOk ? "OK" : `FAIL (${errorCount} errors)`} in ${tscMs}ms`);
