/**
 * Image/asset proxy that streams objects directly from R2 using server-side
 * S3 credentials. Bypasses any Cloudflare hotlink/bot challenge that the
 * public R2 domain (e.g. i.alii.uk) may apply to browser requests.
 *
 * Usage from the client:
 *   /api/public/media/<key>          (key is the R2 object key)
 *   /api/public/media/?url=<full>    (full public URL — key derived)
 */
import { createFileRoute } from "@tanstack/react-router";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { r2, bucket } from "@/server/r2.server";

function deriveKey(pathnameSplat: string, url: URL): string | null {
  const qUrl = url.searchParams.get("url");
  if (qUrl) {
    try {
      const u = new URL(qUrl);
      return u.pathname.replace(/^\/+/, "");
    } catch {
      return null;
    }
  }
  const k = (pathnameSplat || "").replace(/^\/+/, "");
  return k || null;
}

export const Route = createFileRoute("/api/public/media/$")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const url = new URL(request.url);
        const splat = (params as { _splat?: string })._splat ?? "";
        const key = deriveKey(splat, url);
        if (!key) return new Response("missing key", { status: 400 });

        try {
          const out = await r2().send(
            new GetObjectCommand({ Bucket: bucket(), Key: key }),
          );
          const body = out.Body as ReadableStream | undefined;
          if (!body) return new Response("not found", { status: 404 });

          const headers = new Headers();
          headers.set(
            "Content-Type",
            out.ContentType || "application/octet-stream",
          );
          if (out.ContentLength)
            headers.set("Content-Length", String(out.ContentLength));
          headers.set("Cache-Control", "public, max-age=300");
          return new Response(body as any, { status: 200, headers });
        } catch (err: any) {
          const status = err?.$metadata?.httpStatusCode ?? 500;
          if (status === 404 || err?.name === "NoSuchKey")
            return new Response("not found", { status: 404 });
          return new Response(`proxy error: ${err?.message ?? "unknown"}`, {
            status: 502,
          });
        }
      },
    },
  },
});
