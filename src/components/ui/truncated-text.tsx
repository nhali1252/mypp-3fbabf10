import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/**
 * TruncatedText
 * -------------
 * One-line, ellipsised display for long unbroken strings (URLs, @handles,
 * wallet addresses, tokens, file names). Solves the common conflict
 * between `truncate` (needs `min-width: 0` on the parent + can't be
 * selected past the ellipsis on touch) and the project's global
 * `overflow-wrap: anywhere` rule on links/code (which would *wrap*
 * instead of truncating).
 *
 * Behaviour:
 *  - Always renders on a single line with an ellipsis.
 *  - Tap / click anywhere on the text copies the *full* value to the
 *    clipboard and shows a toast + inline ✓ feedback for 1.5s.
 *  - Native title tooltip shows the full value on desktop hover.
 *  - If `href` is provided, renders as <a> (still copy-on-tap via long
 *    press / right-click affordance — the explicit copy icon is shown).
 *  - Respects the global overflow-safeguard: parent gets `min-w-0` so
 *    the ellipsis actually triggers inside flex/grid layouts.
 *
 * Usage:
 *   <TruncatedText value="https://example.com/very/long/path?with=query" />
 *   <TruncatedText value={user.email} className="text-sm text-muted-foreground" />
 *   <TruncatedText value={url} href={url} showIcon />
 */
export interface TruncatedTextProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "onCopy" | "children"> {
  /** The full string to display + copy. */
  value: string;
  /** Optional display override (e.g. show "@alice" but copy full URL). */
  display?: React.ReactNode;
  /** Render as link instead of span. */
  href?: string;
  /** Show a copy-icon affordance on the right. Defaults to false. */
  showIcon?: boolean;
  /** Toast message on successful copy. */
  copyMessage?: string;
  /** Disable the copy-on-tap behaviour (still truncates). */
  disableCopy?: boolean;
}

export function TruncatedText({
  value,
  display,
  href,
  showIcon = false,
  copyMessage = "Copied to clipboard",
  disableCopy = false,
  className,
  ...rest
}: TruncatedTextProps) {
  const [copied, setCopied] = React.useState(false);
  const timeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
  }, []);

  const handleCopy = React.useCallback(
    async (e?: React.MouseEvent | React.KeyboardEvent) => {
      if (disableCopy) return;
      // Don't hijack normal link navigation on Cmd/Ctrl-click or middle click.
      if (e && "metaKey" in e && (e.metaKey || e.ctrlKey)) return;
      try {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        toast.success(copyMessage);
        if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(() => setCopied(false), 1500);
      } catch {
        toast.error("Couldn't copy — try long-pressing the text");
      }
    },
    [value, copyMessage, disableCopy],
  );

  // The truncating element. `min-w-0` MUST be on the parent for `truncate`
  // to win inside flex/grid; we add it on the wrapper below as a safety net.
  const truncatedClasses = cn(
    "block min-w-0 flex-1 truncate whitespace-nowrap",
    // Override the global `overflow-wrap: anywhere` rule on a[href] so
    // links truncate cleanly instead of breaking mid-URL.
    "[overflow-wrap:normal] [word-break:normal]",
    !disableCopy && "cursor-pointer",
  );

  const content = display ?? value;

  const wrapperClasses = cn(
    "inline-flex min-w-0 max-w-full items-center gap-1.5 align-middle",
    className,
  );

  const sharedProps = {
    title: value,
    "aria-label": disableCopy ? undefined : `${value} (tap to copy)`,
    onClick: handleCopy,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (disableCopy) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleCopy(e);
      }
    },
    tabIndex: disableCopy ? undefined : 0,
  };

  const Icon = copied ? Check : Copy;

  if (href) {
    return (
      <span className={wrapperClasses} {...rest}>
        <a
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          className={truncatedClasses}
          {...sharedProps}
        >
          {content}
        </a>
        {showIcon && (
          <Icon
            className={cn(
              "h-3.5 w-3.5 shrink-0 transition-colors",
              copied ? "text-primary" : "text-muted-foreground",
            )}
            aria-hidden
          />
        )}
      </span>
    );
  }

  return (
    <span className={wrapperClasses} {...rest}>
      <span className={truncatedClasses} role={disableCopy ? undefined : "button"} {...sharedProps}>
        {content}
      </span>
      {showIcon && (
        <Icon
          className={cn(
            "h-3.5 w-3.5 shrink-0 transition-colors",
            copied ? "text-primary" : "text-muted-foreground",
          )}
          aria-hidden
        />
      )}
    </span>
  );
}

/**
 * Imperative helper — copy any string with the same toast UX, e.g.
 * inside dropdowns or share buttons.
 */
export async function copyToClipboard(value: string, message = "Copied to clipboard") {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(message);
    return true;
  } catch {
    toast.error("Couldn't copy to clipboard");
    return false;
  }
}
