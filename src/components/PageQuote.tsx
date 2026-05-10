/**
 * Per-page editorial quote block.
 *
 * Reads from the `pageQuotes` doc (slug-keyed). Renders nothing if the
 * row is missing, inactive, or has an empty quote.
 *
 * Visual matches the editorial card on About & Skills:
 *   ┌────────────────────────────────────────┐
 *   │  ”                                      │
 *   │  large serif italic blockquote …        │
 *   │  ◉  Eyebrow                             │
 *   │     AUTHOR / TAGLINE                    │
 *   └────────────────────────────────────────┘
 */
import { Quote, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
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

  const eyebrow = (row.eyebrow ?? "").trim();
  const author = (row.author ?? "").trim();

  return (
    <section
      aria-label="Highlighted quote"
      className={`px-5 sm:px-6 md:px-10 py-10 ${className ?? ""}`}
    >
      <div className="max-w-[1100px] mx-auto">
        <motion.figure
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-[24px] border border-border bg-card overflow-hidden p-7 sm:p-10 md:p-14"
        >
          <Quote className="w-10 h-10 sm:w-12 sm:h-12 text-primary/40 mb-4" />
          <blockquote
            className="font-serif-display italic leading-[1.12] tracking-tight text-foreground"
            style={{ fontSize: "clamp(22px, 3.6vw, 38px)" }}
          >
            “{quote}”
          </blockquote>
          {(eyebrow || author) && (
            <figcaption className="mt-5 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="w-9 h-9 rounded-full bg-primary/15 text-primary grid place-items-center ring-1 ring-primary/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                {eyebrow && (
                  <div className="font-bold tracking-tight text-foreground">{eyebrow}</div>
                )}
                {author && (
                  <div className="uppercase tracking-[0.2em] text-[10px]">{author}</div>
                )}
              </div>
            </figcaption>
          )}
          <div
            aria-hidden
            className="absolute -top-32 -right-32 w-80 h-80 rounded-full blur-3xl opacity-30 bg-gradient-to-br from-primary/40 to-transparent"
          />
        </motion.figure>
      </div>
    </section>
  );
}

export default PageQuote;
