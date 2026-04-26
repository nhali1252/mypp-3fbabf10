/**
 * Bridge editor: renders a "Open editor" call-to-action that links to the
 * existing per-feature admin route. Used while we migrate editors into the
 * page-block shell one section at a time. Inline editors (like QuoteSectionEditor)
 * replace this in the registry as they're wired up.
 */
import { Link } from "@tanstack/react-router";
import { ArrowRight, Settings2 } from "lucide-react";

export type SectionLinkProps = {
  /** Absolute admin route to open, e.g. "/admin/hero". */
  to: string;
  /** Short label describing what the linked editor manages. */
  label: string;
  /** Optional helper line under the label. */
  hint?: string;
};

export default function SectionLink({ to, label, hint }: SectionLinkProps) {
  return (
    <Link
      to={to}
      className="group flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/20 p-4 transition-colors hover:border-primary/40 hover:bg-muted/40"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Settings2 className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-semibold text-foreground">{label}</div>
          {hint && (
            <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>
          )}
        </div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
    </Link>
  );
}

/** Factory: build a registry-compatible component for a given target route. */
export function makeSectionLink(to: string, label: string, hint?: string) {
  return function SectionLinkBound() {
    return <SectionLink to={to} label={label} hint={hint} />;
  };
}
