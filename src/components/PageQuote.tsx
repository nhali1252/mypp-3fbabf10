/**
 * Per-page quote/highlight block.
 *
 * Reads from the `pageQuotes` doc (slug-keyed). Renders nothing if the
 * row is missing, inactive, or has an empty quote — so dropping it in is
 * safe even before content has been authored for a page.
 *
 * Usage (from any public page):
 *   <PageQuote slug="about" />
 */
import { useContentDoc } from "@/hooks/useContentDoc";

type QuoteRow = {
  page_slug: string;
  eyebrow?: string | null;
  quote: string;
  author?: string | null;
  active?: boolean;
};

type Props = {
  slug: string;
  className?: string;
};

export function PageQuote({ slug, className }: Props) {
  const { data } = useContentDoc<Record<string, QuoteRow>>("pageQuotes");
  const row = data?.[slug];
  if (!row || row.active === false) return null;
  const quote = (row.quote ?? "").trim();
  if (!quote) return null;

  return (
    <section
      aria-label="Highlighted quote"
      className={`relative mx-auto my-16 w-full max-w-4xl px-6 ${className ?? ""}`}
    >
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-8 sm:p-12 shadow-2xl shadow-primary/10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl"
        />
        {row.eyebrow ? (
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-primary/80">
            {row.eyebrow}
          </p>
        ) : null}
        <blockquote className="relative">
          <span
            aria-hidden
            className="absolute -left-2 -top-6 select-none font-serif text-6xl leading-none text-primary/30 sm:-left-4 sm:text-7xl"
          >
            “
          </span>
          <p className="text-balance text-2xl font-medium leading-snug text-foreground sm:text-3xl">
            {quote}
          </p>
        </blockquote>
        {row.author ? (
          <footer className="mt-6 text-sm text-muted-foreground">
            — <span className="font-medium text-foreground/90">{row.author}</span>
          </footer>
        ) : null}
      </div>
    </section>
  );
}

export default PageQuote;
