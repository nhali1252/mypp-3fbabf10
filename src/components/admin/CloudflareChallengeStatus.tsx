import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Copy, ExternalLink, RefreshCw, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import {
  probeServerFn,
  getCurrentHostname,
  type CfChallengeInfo,
} from "@/lib/cf-challenge";

const KIND_LABEL: Record<string, string> = {
  managed_challenge: "Managed Challenge / Bot Fight Mode",
  bot_fight: "Bot Fight Mode",
  rate_limit: "Rate Limiting",
  waf_block: "WAF Block",
  unknown_html: "HTML interstitial (likely Cloudflare)",
};

function copy(text: string, label: string) {
  navigator.clipboard.writeText(text).then(
    () => toast.success(`Copied ${label}`),
    () => toast.error("Copy failed"),
  );
}

export function CloudflareChallengeStatus() {
  const [info, setInfo] = useState<CfChallengeInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const host = getCurrentHostname();

  const run = async () => {
    setLoading(true);
    try {
      setInfo(await probeServerFn());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void run();
  }, []);

  const wafExpression = `(http.host eq "${host}" and starts_with(http.request.uri.path, "/_serverFn/"))`;

  return (
    <div className="rounded-lg border bg-card text-card-foreground">
      <div className="flex items-start justify-between gap-3 border-b p-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 text-muted-foreground" />
          <div>
            <h3 className="font-semibold leading-tight">Cloudflare server-function probe</h3>
            <p className="text-sm text-muted-foreground">
              Checks whether <code className="rounded bg-muted px-1">/_serverFn/*</code> on{" "}
              <code className="rounded bg-muted px-1">{host}</code> is being intercepted by
              Cloudflare (Bot Fight Mode, Managed Challenge, or WAF).
            </p>
          </div>
        </div>
        <button
          onClick={run}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Re-check
        </button>
      </div>

      <div className="p-4 space-y-4">
        {!info && loading && (
          <p className="text-sm text-muted-foreground">Probing…</p>
        )}

        {info && !info.detected && (
          <div className="flex items-start gap-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-500" />
            <div>
              <div className="font-medium">No Cloudflare challenge detected</div>
              <div className="text-muted-foreground">
                Server function endpoint responded with status {info.status} and a non-HTML
                body. Server functions can reach the worker.
              </div>
            </div>
          </div>
        )}

        {info?.detected && (
          <>
            <div className="flex items-start gap-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-500" />
              <div className="space-y-1">
                <div className="font-medium">
                  Challenge detected — {KIND_LABEL[info.kind ?? "unknown_html"]}
                </div>
                <div className="text-muted-foreground">
                  HTTP {info.status}
                  {info.cfMitigated && <> · cf-mitigated: <code>{info.cfMitigated}</code></>}
                  {info.rayId && <> · cf-ray: <code>{info.rayId}</code></>}
                </div>
                {info.snippet && (
                  <pre className="mt-2 max-h-24 overflow-auto rounded bg-background/60 p-2 text-xs">
                    {info.snippet}
                  </pre>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Fix — add a Cloudflare WAF Skip rule</h4>
              <p className="text-sm text-muted-foreground">
                In the Cloudflare dashboard for <code className="rounded bg-muted px-1">{host}</code>{" "}
                go to <strong>Security → WAF → Custom rules → Create rule</strong> and configure:
              </p>

              <div className="rounded-md border bg-muted/40 p-3 text-sm">
                <div className="grid gap-2 sm:grid-cols-[140px_1fr]">
                  <div className="font-medium">Rule name</div>
                  <div>
                    <code>Bypass challenges for server functions</code>
                  </div>
                  <div className="font-medium">When (Field / Op / Value)</div>
                  <div>
                    <code>URI Path</code> · <code>starts with</code> ·{" "}
                    <code>/_serverFn/</code>
                  </div>
                  <div className="font-medium">Or use expression</div>
                  <div className="flex items-start gap-2">
                    <code className="block flex-1 break-all rounded bg-background p-2 text-xs">
                      {wafExpression}
                    </code>
                    <button
                      onClick={() => copy(wafExpression, "WAF expression")}
                      className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs hover:bg-muted"
                    >
                      <Copy className="h-3 w-3" /> Copy
                    </button>
                  </div>
                  <div className="font-medium">Action</div>
                  <div>
                    <code>Skip</code>
                  </div>
                  <div className="font-medium">Skip features</div>
                  <div>
                    Check: <code>Bot Fight Mode</code>, <code>Super Bot Fight Mode</code>,{" "}
                    <code>All managed rules</code>, <code>Rate limiting rules</code>
                  </div>
                  <div className="font-medium">Place at</div>
                  <div>
                    Top of the list (priority 1) so it runs before any other custom rule.
                  </div>
                </div>
              </div>

              <div className="rounded-md border bg-muted/40 p-3 text-sm">
                <div className="font-medium mb-1">Also recommended</div>
                <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                  <li>
                    <strong>Security → Bots</strong>: turn <em>Bot Fight Mode</em> OFF for this
                    domain (it cannot be scoped per-path and breaks XHR/fetch).
                  </li>
                  <li>
                    <strong>Security → Settings → Security Level</strong>: set to{" "}
                    <em>Essentially Off</em> or <em>Low</em> for the app subdomain.
                  </li>
                  <li>
                    <strong>Speed → Optimization → Rocket Loader</strong>: OFF (interferes with
                    SSR hydration).
                  </li>
                  <li>
                    Add a second Skip rule for <code>/api/</code> if you serve public APIs.
                  </li>
                </ul>
              </div>

              <div className="flex flex-wrap gap-2">
                <a
                  href="https://dash.cloudflare.com/?to=/:account/:zone/security/waf/custom-rules"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
                >
                  <ExternalLink className="h-4 w-4" /> Open WAF custom rules
                </a>
                <a
                  href="https://dash.cloudflare.com/?to=/:account/:zone/security/bots"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
                >
                  <ExternalLink className="h-4 w-4" /> Bot Fight Mode settings
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
