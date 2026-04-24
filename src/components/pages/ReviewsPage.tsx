import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Send, Quote, MessageSquareHeart, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Review = {
  id: string;
  client_name: string;
  role: string | null;
  company: string | null;
  review: string;
  rating: number | null;
  avatar_url: string | null;
  featured: boolean | null;
  created_at: string;
};

const reviewSchema = z.object({
  client_name: z.string().trim().min(1, "Please share a name").max(120),
  review: z.string().trim().min(8, "Tell us a little more").max(2000),
  rating: z.number().int().min(1).max(5),
  role: z.string().trim().max(120).optional().or(z.literal("")),
});

export function ReviewsPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);
  const [hoverStar, setHoverStar] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["public_reviews"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("testimonials")
        .select("*")
        .eq("published", true)
        .order("featured", { ascending: false })
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Review[];
    },
  });

  const stats = useMemo(() => {
    if (!reviews.length) return { avg: 0, count: 0 };
    const sum = reviews.reduce((a, r) => a + (r.rating ?? 0), 0);
    return { avg: sum / reviews.length, count: reviews.length };
  }, [reviews]);

  const submit = useMutation({
    mutationFn: async () => {
      const parsed = reviewSchema.safeParse({ client_name: name, review: text, rating, role });
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
      const { error } = await (supabase as any).from("testimonials").insert({
        client_name: parsed.data.client_name,
        role: parsed.data.role || null,
        review: parsed.data.review,
        rating: parsed.data.rating,
        status: "pending",
        published: false,
        featured: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setSubmitted(true);
      setName(""); setRole(""); setText(""); setRating(5);
      toast.success("Thanks! Your review is awaiting approval.");
      qc.invalidateQueries({ queryKey: ["public_reviews"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Could not send"),
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* HERO */}
      <section className="relative px-5 sm:px-6 md:px-10 pt-12 sm:pt-16 md:pt-20 pb-8 overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[820px] h-[520px] rounded-full blur-[140px] opacity-40"
          style={{ background: "radial-gradient(closest-side, color-mix(in oklab, var(--primary) 55%, transparent), transparent)" }}
        />
        <div className="relative max-w-[1100px] mx-auto text-center">
          <motion.span
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/60 backdrop-blur text-[11px] font-bold uppercase tracking-[0.25em] text-primary"
          >
            <MessageSquareHeart className="w-3.5 h-3.5" /> Client Reviews
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
            className="font-black tracking-tight leading-[1.02] mt-5"
            style={{ fontSize: "clamp(34px, 6.4vw, 78px)" }}
          >
            Trusted by{" "}
            <span className="font-serif-display italic font-medium text-primary">people</span>
          </motion.h1>
          {stats.count > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="mt-6 inline-flex items-center gap-3 px-4 py-2 rounded-full border border-border bg-card"
            >
              <div className="flex items-center gap-0.5 text-primary">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.round(stats.avg) ? "fill-current" : "opacity-30"}`} />
                ))}
              </div>
              <span className="text-sm font-bold">{stats.avg.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">· {stats.count} review{stats.count !== 1 ? "s" : ""}</span>
            </motion.div>
          )}
        </div>
      </section>

      {/* GRID */}
      <section className="px-5 sm:px-6 md:px-10 pb-10">
        <div className="max-w-[1100px] mx-auto">
          {isLoading ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-44 rounded-2xl border border-border bg-card animate-pulse" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground border border-dashed border-border rounded-2xl">
              No reviews yet — be the first to leave one below.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4 md:gap-5">
              {reviews.map((r, i) => (
                <motion.article
                  key={r.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.4, delay: i * 0.04 }}
                  className="relative rounded-2xl border border-border bg-card p-5 sm:p-6 hover:border-primary/40 transition-colors"
                >
                  {r.featured && (
                    <span className="absolute -top-2 right-4 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold uppercase tracking-[0.2em]">
                      Featured
                    </span>
                  )}
                  <Quote className="w-5 h-5 text-primary/60 mb-3" />
                  <div className="flex items-center gap-0.5 text-primary mb-3">
                    {Array.from({ length: 5 }).map((_, k) => (
                      <Star key={k} className={`w-3.5 h-3.5 ${k < (r.rating ?? 0) ? "fill-current" : "opacity-25"}`} />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/90">{r.review}</p>
                  <div className="mt-4 pt-4 border-t border-border/60 flex items-center gap-3">
                    {r.avatar_url ? (
                      <img src={r.avatar_url} alt={r.client_name} className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-primary/15 text-primary grid place-items-center text-xs font-bold">
                        {r.client_name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-bold truncate">{r.client_name}</div>
                      {(r.role || r.company) && (
                        <div className="text-[11px] text-muted-foreground truncate">
                          {[r.role, r.company].filter(Boolean).join(" · ")}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SUBMIT FORM */}
      <section className="px-5 sm:px-6 md:px-10 pb-20">
        <div className="max-w-[680px] mx-auto rounded-3xl border border-border bg-card p-6 sm:p-8">
          <div className="text-center mb-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary mb-2">Leave a review</p>
            <h2 className="text-2xl sm:text-3xl font-black">Share your experience</h2>
            <p className="text-sm text-muted-foreground mt-2">It only takes a minute. Your review will appear after a quick moderation.</p>
          </div>

          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="ok"
                initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="text-center py-10"
              >
                <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-3" />
                <h3 className="text-lg font-bold">Thank you!</h3>
                <p className="text-sm text-muted-foreground mt-1">Your review is awaiting approval.</p>
                <Button variant="outline" className="mt-5" onClick={() => setSubmitted(false)}>Leave another</Button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onSubmit={(e) => { e.preventDefault(); submit.mutate(); }}
                className="space-y-4"
              >
                {/* star picker */}
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your rating</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => {
                      const active = (hoverStar ?? rating) >= n;
                      return (
                        <button
                          key={n}
                          type="button"
                          aria-label={`${n} star${n > 1 ? "s" : ""}`}
                          onMouseEnter={() => setHoverStar(n)}
                          onMouseLeave={() => setHoverStar(null)}
                          onClick={() => setRating(n)}
                          className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                        >
                          <Star className={`w-7 h-7 transition-all ${active ? "text-primary fill-current scale-110" : "text-muted-foreground/40"}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block">Your name</label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rakib Hasan" maxLength={120} required />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block">Role / Company <span className="text-muted-foreground font-normal">(optional)</span></label>
                    <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Founder, Acme" maxLength={120} />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold mb-1.5 block">Your review</label>
                  <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={5}
                    placeholder="What did you like? What stood out?"
                    maxLength={2000}
                    required
                  />
                  <div className="text-[10px] text-muted-foreground mt-1 text-right">{text.length}/2000</div>
                </div>

                <Button
                  type="submit"
                  disabled={submit.isPending}
                  className="w-full h-12 text-sm font-bold"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {submit.isPending ? "Sending…" : "Submit review"}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </section>

      <Footer />
    </div>
  );
}
