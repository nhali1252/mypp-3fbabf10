import { createServerFn } from "@tanstack/react-start";

/**
 * Re-runs `tsc --noEmit` and writes a fresh build manifest.
 *
 * IMPORTANT: this only works in local dev (Node runtime). In production the
 * app runs in a Cloudflare Worker where child_process is a non-functional
 * stub — the handler catches the failure and returns a friendly error so the
 * UI can disable the button gracefully.
 */
export const refreshDiagnostics = createServerFn({ method: "POST" }).handler(
  async () => {
    try {
      const cp = await import("node:child_process");
      const path = await import("node:path");
      const url = await import("node:url");
      const fs = await import("node:fs/promises");

      // Resolve the script path relative to the project root.
      // process.cwd() is the project root in dev; in Workers this whole block
      // throws via the unenv stub before we get here.
      const root = process.cwd();
      const script = path.join(root, "scripts/generate-build-manifest.mjs");

      const start = Date.now();
      await new Promise<void>((resolve, reject) => {
        const child = cp.spawn("node", [script], {
          cwd: root,
          stdio: "ignore",
        });
        child.on("error", reject);
        child.on("exit", (code) =>
          code === 0 ? resolve() : reject(new Error(`exit ${code}`)),
        );
      });
      const durationMs = Date.now() - start;

      // Read the freshly-written manifest and return it.
      const manifestPath = path.join(root, "src/build-manifest.json");
      const raw = await fs.readFile(manifestPath, "utf8");
      const manifest = JSON.parse(raw);
      return { ok: true as const, durationMs, manifest };
    } catch (err: any) {
      return {
        ok: false as const,
        error: err?.message ?? String(err),
        hint: "Re-running typecheck only works in local dev. Run `bun run manifest` from the terminal instead.",
      };
    }
  },
);
