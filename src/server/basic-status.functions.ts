/**
 * Public server function returning R2 connection status + content counts
 * for the /basic page banner. No auth required: it only reports the SAME
 * data the public page already renders, plus whether R2 itself is reachable.
 * It does NOT leak credentials — only a short fingerprint of the access key.
 */
import { createServerFn } from "@tanstack/react-start";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { r2, bucket, readJson } from "./r2.server";
import { R2_KEYS } from "./r2-keys";

type SectionCount = {
  key: string;
  label: string;
  count: number | null;
  ok: boolean;
  error?: string;
};

export const getBasicR2Status = createServerFn({ method: "GET" }).handler(
  async () => {
    const startedAt = Date.now();
    const accessKey = process.env.R2_ACCESS_KEY_ID || "";
    const accessKeyPrefix = accessKey ? `${accessKey.slice(0, 6)}…` : null;
    const bucketName = process.env.R2_BUCKET || null;
    const endpointHost = (() => {
      try {
        return process.env.R2_ENDPOINT ? new URL(process.env.R2_ENDPOINT).host : null;
      } catch {
        return null;
      }
    })();

    // 1. Connection probe — list a single object to confirm credentials work.
    let connectionOk = false;
    let connectionError: string | null = null;
    try {
      await r2().send(new ListObjectsV2Command({ Bucket: bucket(), MaxKeys: 1 }));
      connectionOk = true;
    } catch (err: any) {
      connectionError = `${err?.name ?? "Error"}: ${err?.message ?? String(err)}`;
    }

    // 2. Per-section counts (always attempt, even if probe failed —
    //    individual reads might still succeed or surface the same error).
    const sections: SectionCount[] = [];
    async function loadCount(
      key: string,
      label: string,
      r2Key: string,
      pick: (doc: any) => unknown[] | null,
    ) {
      try {
        const doc = await readJson<any>(r2Key);
        const arr = doc ? pick(doc) : null;
        sections.push({
          key,
          label,
          count: Array.isArray(arr) ? arr.length : 0,
          ok: true,
        });
      } catch (err: any) {
        sections.push({
          key,
          label,
          count: null,
          ok: false,
          error: `${err?.name ?? "Error"}: ${err?.message ?? String(err)}`,
        });
      }
    }

    await Promise.all([
      loadCount("services", "Services", R2_KEYS.services, (d) =>
        Array.isArray(d) ? d : Array.isArray(d?.items) ? d.items : null,
      ),
      loadCount("activities", "Activities", R2_KEYS.about, (d) =>
        Array.isArray(d?.activities) ? d.activities : null,
      ),
      loadCount("education", "Education", R2_KEYS.about, (d) =>
        Array.isArray(d?.education) ? d.education : null,
      ),
    ]);

    return {
      checkedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      connection: {
        ok: connectionOk,
        error: connectionError,
        bucket: bucketName,
        endpointHost,
        accessKeyPrefix,
      },
      sections,
    };
  },
);
