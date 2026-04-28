/**
 * Detects whether a fetch response from a /_serverFn/ call has been intercepted
 * by Cloudflare's Bot Fight Mode / Managed Challenge / WAF. When that happens,
 * Cloudflare returns an HTML interstitial ("Just a moment...") instead of the
 * JSON the server function would normally produce.
 */

export type CfChallengeKind =
  | "managed_challenge"
  | "bot_fight"
  | "rate_limit"
  | "waf_block"
  | "unknown_html";

export interface CfChallengeInfo {
  detected: boolean;
  kind?: CfChallengeKind;
  status: number;
  rayId?: string;
  cfMitigated?: string;
  server?: string;
  snippet?: string;
}

const HTML_MARKERS = [
  "Just a moment...",
  "challenge-platform",
  "cf-chl-",
  "__cf_chl_",
  "cf_chl_opt",
  "Attention Required! | Cloudflare",
  "Sorry, you have been blocked",
];

export function looksLikeCloudflareHtml(body: string): boolean {
  const head = body.slice(0, 4000);
  return HTML_MARKERS.some((m) => head.includes(m));
}

export function classifyChallenge(body: string, headers: Headers): CfChallengeKind {
  const mitigated = headers.get("cf-mitigated")?.toLowerCase();
  if (mitigated === "challenge") return "managed_challenge";
  if (body.includes("Sorry, you have been blocked")) return "waf_block";
  if (body.includes("Bot Fight") || body.includes("bot_fight")) return "bot_fight";
  if (body.includes("rate") && body.includes("limit")) return "rate_limit";
  if (body.includes("Just a moment") || body.includes("challenge-platform"))
    return "managed_challenge";
  return "unknown_html";
}

export async function probeServerFn(path = "/_serverFn/src_server_diagnostics_functions_ts--refreshDiagnostics_createServerFn_handler"): Promise<CfChallengeInfo> {
  // We don't care if the fn exists — we only want to see if Cloudflare lets us
  // through. A real 404/405 from the worker is fine; an HTML page from CF isn't.
  let res: Response;
  try {
    res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: "{}",
      credentials: "include",
    });
  } catch (e) {
    return { detected: false, status: 0, snippet: String(e) };
  }

  const ct = res.headers.get("content-type") ?? "";
  const text = await res.text().catch(() => "");
  const isHtml = ct.includes("text/html") || looksLikeCloudflareHtml(text);

  if (!isHtml) {
    return { detected: false, status: res.status };
  }

  return {
    detected: true,
    kind: classifyChallenge(text, res.headers),
    status: res.status,
    rayId: res.headers.get("cf-ray") ?? undefined,
    cfMitigated: res.headers.get("cf-mitigated") ?? undefined,
    server: res.headers.get("server") ?? undefined,
    snippet: text.slice(0, 280),
  };
}

export function getCurrentHostname(): string {
  if (typeof window === "undefined") return "your-domain.com";
  return window.location.hostname;
}
