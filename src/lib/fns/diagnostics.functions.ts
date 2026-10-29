import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Re-runs `tsc --noEmit` and writes a fresh build manifest.
 *
 * Auth: requires a signed-in user with the `admin` role. The handler also
 * only does real work in local dev (Node runtime). In production (Cloudflare
 * Worker) `child_process` is a non-functional stub — the handler catches the
 * failure and returns a friendly error so the UI can disable the button.
 */
export const refreshDiagnostics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Admin-only — defense in depth on top of the client-side admin route guard.
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) {
      return {
        ok: false as const,
        error: "Admin only",
        hint: "You must be signed in as an admin to refresh diagnostics.",
      };
    }

    try {
      const cp = await import("node:child_process");
      const path = await import("node:path");
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
  });
