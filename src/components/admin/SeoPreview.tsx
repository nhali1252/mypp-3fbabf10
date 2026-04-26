/**
 * Live previews for SEO meta: Google SERP, Facebook/OG, Twitter card.
 * Pure presentational — no data fetching.
 */
import { cn } from "@/lib/utils";

export type SeoPreviewProps = {
  pageKey: string;
  title: string;
  description: string;
  ogImage?: string | null;
  siteUrl?: string;
};

const FALLBACK_SITE = "alii.uk";

function truncate(s: string, n: number) {
  if (!s) return "";
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
}

export function SeoPreview({ pageKey, title, description, ogImage, siteUrl = FALLBACK_SITE }: SeoPreviewProps) {
  const path = pageKey === "home" || pageKey === "index" ? "" : `/${pageKey}`;
  const displayUrl = `${siteUrl}${path}`;
  const t = title?.trim() || "Untitled page";
  const d = description?.trim() || "No description provided.";

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Google */}
      <div className="rounded-lg border border-border bg-background p-4">
        <div className="text-xs font-medium text-muted-foreground mb-2">Google search result</div>
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground truncate">{displayUrl}</div>
          <div className="text-[18px] leading-snug text-blue-700 dark:text-blue-400 hover:underline cursor-pointer truncate">
            {truncate(t, 60)}
          </div>
          <div className="text-[13px] leading-snug text-muted-foreground line-clamp-2">
            {truncate(d, 160)}
          </div>
        </div>
      </div>

      {/* Facebook / OG */}
      <div className="rounded-lg border border-border bg-background overflow-hidden">
        <div className="text-xs font-medium text-muted-foreground px-4 pt-4 pb-2">Facebook / Open Graph</div>
        <div className="border-t border-border">
          {ogImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ogImage} alt="OG preview" className="w-full aspect-[1.91/1] object-cover bg-muted" />
          ) : (
            <div className="w-full aspect-[1.91/1] bg-muted flex items-center justify-center text-xs text-muted-foreground">
              No OG image
            </div>
          )}
          <div className="px-4 py-3 bg-muted/40">
            <div className="text-[11px] uppercase text-muted-foreground tracking-wide">{siteUrl}</div>
            <div className="text-sm font-semibold leading-tight mt-0.5 line-clamp-2">{truncate(t, 88)}</div>
            <div className="text-xs text-muted-foreground leading-snug mt-1 line-clamp-2">{truncate(d, 200)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export type CounterProps = {
  value: string;
  min?: number;
  ideal: [number, number];
  max: number;
};

export function CharCounter({ value, min = 0, ideal, max }: CounterProps) {
  const len = value?.length ?? 0;
  const tooShort = len < min || len < ideal[0];
  const tooLong = len > max;
  const inIdeal = len >= ideal[0] && len <= ideal[1];
  const status = tooLong ? "error" : inIdeal ? "ok" : tooShort ? "warn" : "warn";
  return (
    <div className="flex items-center gap-2 text-xs mt-1">
      <span
        className={cn(
          "tabular-nums font-medium",
          status === "ok" && "text-green-600 dark:text-green-400",
          status === "warn" && "text-amber-600 dark:text-amber-400",
          status === "error" && "text-destructive",
        )}
      >
        {len} / {max}
      </span>
      <span className="text-muted-foreground">
        ideal {ideal[0]}–{ideal[1]}
      </span>
    </div>
  );
}
