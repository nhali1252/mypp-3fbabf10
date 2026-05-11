import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

/**
 * <BreakToken />
 * --------------
 * Standard wrapper for any user-supplied or programmatic string that
 * MIGHT contain a long unbroken token (URL, hash, handle, file path,
 * id, address). Future components should reach for this instead of
 * remembering the exact CSS class name.
 *
 * Why a component:
 *   - Single import, single source of truth — `.break-token` /
 *     `.break-token-hard` class names can change without touching call
 *     sites.
 *   - `asChild` lets you keep the semantic element (a, span, code, p…)
 *     while still inheriting the wrap behaviour.
 *   - The `mode` prop documents intent at the call site:
 *       "soft"  → friendly wrap (default, real words break at spaces)
 *       "hard"  → aggressive wrap (single-character break-anywhere,
 *                 for tiny columns where even one token won't fit)
 *
 * Usage:
 *   <BreakToken>{user.handle}</BreakToken>
 *   <BreakToken asChild><a href={url}>{url}</a></BreakToken>
 *   <BreakToken asChild mode="hard"><code>{txHash}</code></BreakToken>
 *
 * For *single-line ellipsis* (truncation, not wrapping), use
 * <TruncatedText /> instead.
 */
export type BreakTokenMode = "soft" | "hard";

export interface BreakTokenProps extends React.HTMLAttributes<HTMLElement> {
  /** "soft" = friendly (default), "hard" = aggressive break-anywhere. */
  mode?: BreakTokenMode;
  /** Render onto the child element instead of a <span>. */
  asChild?: boolean;
}

const MODE_CLASS: Record<BreakTokenMode, string> = {
  soft: "break-token",
  hard: "break-token-hard",
};

export const BreakToken = React.forwardRef<HTMLElement, BreakTokenProps>(
  ({ mode = "soft", asChild = false, className, ...rest }, ref) => {
    const Comp = asChild ? Slot : "span";
    return (
      <Comp
        ref={ref as React.Ref<HTMLSpanElement>}
        className={cn(MODE_CLASS[mode], className)}
        {...rest}
      />
    );
  },
);
BreakToken.displayName = "BreakToken";

/**
 * Imperative helper — returns the class name to apply when you can't
 * use the component (e.g. inside a string template, a className prop on
 * a third-party component, or a head() title).
 *
 *   <SomeThirdParty className={breakTokenClass()} />
 *   <SomeThirdParty className={breakTokenClass("hard")} />
 */
export function breakTokenClass(mode: BreakTokenMode = "soft"): string {
  return MODE_CLASS[mode];
}
