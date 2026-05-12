import { createFileRoute } from "@tanstack/react-router";

/**
 * GET /api/server-info
 *
 * Returns edge-location info (Cloudflare cf-* request headers when present)
 * plus a tiny payload for ping measurement. No auth required — only exposes
 * non-sensitive request metadata about where the edge served from.
 */

function handle(request: Request) {
  const h = request.headers;
  const url = new URL(request.url);
  const isPing = url.searchParams.get("ping") === "1";

  if (isPing) {
    return new Response("pong", {
      status: 200,
      headers: {
        "content-type": "text/plain",
        "cache-control": "no-store",
      },
    });
  }

  const body = {
    colo: h.get("cf-ray")?.split("-")[1] ?? null,
    city: h.get("cf-ipcity") ?? null,
    country: h.get("cf-ipcountry") ?? null,
    region: h.get("cf-region") ?? null,
    timezone: h.get("cf-timezone") ?? null,
    ip: h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    serverTime: new Date().toISOString(),
  };

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });
}

export const Route = createFileRoute("/api/server-info")({
  server: {
    handlers: {
      GET: ({ request }) => handle(request),
    },
  },
});
