import { useSiteSettings } from "@/hooks/useContent";

/**
 * Visible-but-not-ugly watermark overlay. Tiles a low-opacity diagonal
 * repeat of the brand mark across the media, plus a corner badge.
 *
 * Used both in feed cards and inside the lightbox. Pure CSS, sits above
 * media with `pointer-events:none` so taps still hit the underlying button.
 *
 * NOTE: This is a *deterrent*, not protection. For real protection we'd need
 * a server-side step that bakes the watermark into a derived preview image.
 * Tracked as a future enhancement.
 */
export function Watermark({
  text,
  size = "md",
  cornerBadge = true,
}: {
  text?: string | null;
  size?: "sm" | "md" | "lg";
  cornerBadge?: boolean;
}) {
  const { data: settings } = useSiteSettings();
  const brand =
    text?.trim() ||
    settings?.site_name?.trim() ||
    settings?.site_title?.split("—")[0]?.trim() ||
    "TasTaj";

  const tileFont = size === "lg" ? 22 : size === "sm" ? 12 : 16;
  const tileGap = size === "lg" ? 220 : size === "sm" ? 120 : 170;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
      {/* Diagonal repeating watermark grid */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.085] mix-blend-overlay"
        style={{
          transform: "rotate(-22deg) scale(1.4)",
          transformOrigin: "center",
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent 0,
            transparent ${tileGap - tileFont * 1.6}px,
            transparent ${tileGap}px
          )`,
        }}
      >
        <div
          className="absolute inset-0 flex flex-wrap content-start justify-start gap-x-12 gap-y-8 p-6"
          style={{
            fontSize: `${tileFont}px`,
          }}
        >
          {Array.from({ length: 60 }).map((_, i) => (
            <span
              key={i}
              className="font-black uppercase tracking-[0.35em] text-white whitespace-nowrap"
              style={{ textShadow: "0 1px 0 rgba(0,0,0,0.25)" }}
            >
              · {brand} ·
            </span>
          ))}
        </div>
      </div>

      {cornerBadge && (
        <div className="absolute bottom-2 right-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/55 backdrop-blur-sm border border-white/15 text-white">
          <span className="text-[9px] font-mono uppercase tracking-[0.22em]">
            © {brand}
          </span>
        </div>
      )}
    </div>
  );
}
