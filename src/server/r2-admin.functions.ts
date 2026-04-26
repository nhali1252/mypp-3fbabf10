/**
 * Admin server functions for runtime R2 management.
 * - reinitializeR2: drops the cached S3 client so updated env vars (R2_ENDPOINT,
 *   R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET) take effect on the next
 *   request without redeploying. Verifies the new credentials with a probe.
 * - r2Status: read-only diagnostics about the currently cached client.
 *
 * Admin-only. Editor role is NOT sufficient — this can disrupt every page load.
 */
import { createServerFn } from "@tanstack/react-start";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { r2, bucket, resetR2Client, r2ClientInfo } from "./r2.server";

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin");
  if (error) throw new Error("Role check failed");
  if (!data?.length) throw new Error("Forbidden — admin role required");
}

export const r2Status = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    return {
      ok: true,
      info: r2ClientInfo(),
      env: {
        hasEndpoint: !!process.env.R2_ENDPOINT,
        hasAccessKey: !!process.env.R2_ACCESS_KEY_ID,
        hasSecret: !!process.env.R2_SECRET_ACCESS_KEY,
        hasBucket: !!process.env.R2_BUCKET,
        hasPublicBase: !!process.env.R2_PUBLIC_BASE_URL,
      },
      checkedAt: new Date().toISOString(),
    };
  });

export const reinitializeR2 = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);

    const before = resetR2Client();
    const startedAt = Date.now();

    // Force rebuild + probe the new credentials so we surface auth errors here
    // instead of letting them blow up on the next public page load.
    let probeOk = false;
    let probeError: string | null = null;
    let objectCount: number | null = null;
    try {
      const out = await r2().send(
        new ListObjectsV2Command({ Bucket: bucket(), MaxKeys: 1 }),
      );
      probeOk = true;
      objectCount = out.KeyCount ?? 0;
    } catch (err: any) {
      probeError = `${err?.name ?? "Error"}: ${err?.message ?? String(err)}`;
      // If the probe failed we DON'T leave a half-broken cached client around —
      // resetR2Client again so the next caller retries fresh.
      resetR2Client();
    }

    const after = r2ClientInfo();
    return {
      ok: probeOk,
      durationMs: Date.now() - startedAt,
      probe: { ok: probeOk, error: probeError, sampleObjectCount: objectCount },
      previous: before,
      current: { fingerprint: after.fingerprint, envFingerprint: after.envFingerprint },
      reinitializedAt: new Date().toISOString(),
    };
  });
