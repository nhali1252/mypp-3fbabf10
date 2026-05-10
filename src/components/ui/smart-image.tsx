import { useState, type ImgHTMLAttributes, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

type SmartImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "loading"> & {
  /** Aspect ratio as W/H (e.g. 16/9, 1, 4/5). Locks layout to prevent CLS. */
  aspect?: number;
  /** Use eager loading for above-the-fold images. Default lazy. */
  eager?: boolean;
  /** Skeleton shimmer behind the image while it loads. Default true. */
  shimmer?: boolean;
  /** Object fit when aspect is set. Default "cover". */
  fit?: "cover" | "contain";
  wrapperClassName?: string;
  wrapperStyle?: CSSProperties;
};

/**
 * Thin <img> wrapper that:
 *   - Reserves layout space via CSS aspect-ratio (no CLS)
 *   - Lazy-loads + async-decodes by default; eager only above the fold
 *   - Fades in once decoded; falls back gracefully on error
 *   - Optional shimmer skeleton while loading
 *   - Honors prefers-reduced-motion (instant swap, no fade)
 */
export function SmartImage({
  aspect,
  eager = false,
  shimmer = true,
  fit = "cover",
  className,
  wrapperClassName,
  wrapperStyle,
  onLoad,
  onError,
  alt,
  ...rest
}: SmartImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const wrapStyle: CSSProperties = {
    aspectRatio: aspect ? String(aspect) : undefined,
    ...wrapperStyle,
  };

  return (
    <span
      className={cn(
        "smart-img relative block overflow-hidden",
        shimmer && !loaded && !errored && "skeleton-shimmer",
        wrapperClassName,
      )}
      style={wrapStyle}
    >
      {!errored && (
        <img
          {...rest}
          alt={alt ?? ""}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={eager ? "high" : "auto"}
          onLoad={(e) => {
            setLoaded(true);
            onLoad?.(e);
          }}
          onError={(e) => {
            setErrored(true);
            onError?.(e);
          }}
          className={cn(
            "smart-img__img absolute inset-0 h-full w-full",
            fit === "cover" ? "object-cover" : "object-contain",
            "transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            loaded ? "opacity-100" : "opacity-0",
            className,
          )}
        />
      )}
      {errored && (
        <span className="absolute inset-0 flex items-center justify-center bg-muted/40 text-xs text-muted-foreground">
          Image unavailable
        </span>
      )}
    </span>
  );
}
