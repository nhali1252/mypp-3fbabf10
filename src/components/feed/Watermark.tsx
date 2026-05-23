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
    settings?.watermark_text?.trim() ||
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
        className="absolute inset-0 opacity-[0.22]"
        style={{
          transform: "rotate(-22deg) scale(1.4)",
          transformOrigin: "center",
        }}
      >
        <div
          className="absolute inset-0 flex flex-wrap content-start justify-start gap-x-10 gap-y-6 p-6"
          style={{
            fontSize: `${tileFont}px`,
          }}
        >
          {Array.from({ length: 60 }).map((_, i) => (
            <span
              key={i}
              className="font-black uppercase tracking-[0.35em] text-white whitespace-nowrap"
              style={{
                textShadow:
                  "0 2px 4px rgba(0,0,0,0.55), 0 1px 0 rgba(0,0,0,0.35), 0 0 12px rgba(0,0,0,0.3)",
              }}
            >
              · {brand} ·
            </span>
          ))}
        </div>
      </div>

      {cornerBadge && (
        <div className="absolute bottom-2 right-2 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-black/70 backdrop-blur-sm border border-white/20 text-white shadow-lg">
          <span className="text-[10px] font-bold font-mono uppercase tracking-[0.22em]">
            © {brand}
          </span>
        </div>
      )}
    </div>
  );
}
