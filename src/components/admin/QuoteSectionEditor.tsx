/**
 * Quote-block editor — used inside every page block in the new admin shell.
 * Reads via `getPageQuote`, writes via `savePageQuote`.
 *
 * On save we also notify the auto-resync hook (queue update on `page_quotes`)
 * so the public R2 doc rebuilds without a manual refresh.
 */
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Save, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getPageQuote, savePageQuote } from "@/server/page-quotes.functions";

type Props = {
  /** Page slug — must match a `page_quotes.page_slug`. */
  slug: string;
};

export default function QuoteSectionEditor({ slug }: Props) {
  const get = useServerFn(getPageQuote);
  const save = useServerFn(savePageQuote);
  const qc = useQueryClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [eyebrow, setEyebrow] = useState("");
  const [quote, setQuote] = useState("");
  const [author, setAuthor] = useState("");
  const [active, setActive] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    get({ data: { slug } })
      .then((row) => {
        if (cancelled) return;
        setEyebrow(row?.eyebrow ?? "");
        setQuote(row?.quote ?? "");
        setAuthor(row?.author ?? "");
        setActive(row?.active ?? true);
      })
      .catch((e) => toast.error(`Couldn't load quote: ${e?.message ?? e}`))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [slug, get]);

  async function handleSave() {
    setSaving(true);
    try {
      await save({
        data: {
          slug,
          eyebrow: eyebrow.trim() || null,
          quote: quote.trim(),
          author: author.trim() || null,
          active,
        },
      });
      // Refresh the R2-backed public preview cache for this doc.
      qc.invalidateQueries({ queryKey: ["content", "pageQuotes"] });
      toast.success("Quote saved");
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading quote…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Live preview matches the public <PageQuote /> component. */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-6">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
        {eyebrow && (
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-primary/80">{eyebrow}</p>
        )}
        <p className="text-balance text-xl font-medium leading-snug text-foreground">
          {quote || <span className="text-muted-foreground italic">Quote preview will appear here…</span>}
        </p>
        {author && <p className="mt-3 text-xs text-muted-foreground">— {author}</p>}
        {!active && (
          <p className="mt-4 text-[10px] uppercase tracking-wider text-amber-500">Hidden on public site</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`eyebrow-${slug}`}>Eyebrow</Label>
          <Input
            id={`eyebrow-${slug}`}
            value={eyebrow}
            onChange={(e) => setEyebrow(e.target.value)}
            placeholder="e.g. Story, Craft, Trust"
            maxLength={80}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`author-${slug}`}>Author (optional)</Label>
          <Input
            id={`author-${slug}`}
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Who said it?"
            maxLength={120}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`quote-${slug}`}>
          Quote <span className="text-muted-foreground">({quote.length}/500)</span>
        </Label>
        <Textarea
          id={`quote-${slug}`}
          value={quote}
          onChange={(e) => setQuote(e.target.value.slice(0, 500))}
          rows={3}
          placeholder="A short, premium statement that captures this page's essence."
        />
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <div>
            <Label htmlFor={`active-${slug}`} className="cursor-pointer">Show on page</Label>
            <p className="text-xs text-muted-foreground">Toggle off to hide without deleting.</p>
          </div>
        </div>
        <Switch
          id={`active-${slug}`}
          checked={active}
          onCheckedChange={setActive}
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || !quote.trim()}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save quote
        </Button>
      </div>
    </div>
  );
}
