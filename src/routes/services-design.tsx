import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Phone, MessageCircle, Sparkles, ChevronRight, ArrowUpRight } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/services-design")({
  component: ServicesPage,
  head: () => ({
    meta: [
      { title: "Services — Taxi & Service Bookings" },
      { name: "description", content: "Browse our full range of taxi and service options. Book by phone, WhatsApp or online — fast, reliable and premium." },
      { property: "og:title", content: "Services — Taxi & Service Bookings" },
      { property: "og:description", content: "Browse our full range of taxi and service options. Book in seconds." },
    ],
  }),
});

type Folder = { id: string; name: string; slug: string; icon: string | null; sort_order: number; status: boolean };
type Slot = {
  id: string; folder_id: string; title: string; subtitle: string | null; type: string | null;
  highlight_text: string | null; contact_number: string | null; whatsapp_number: string | null;
  card_size: string; sort_order: number; status: boolean;
};
type Service = {
  id: string; slot_id: string; service_name: string; description: string | null;
  price: string | null; badge: string | null; contact_number: string | null;
  button_text: string | null; button_link: string | null; sort_order: number; status: boolean;
};

function useTaxiData() {
  const folders = useQuery({
    queryKey: ["public-folders"],
    queryFn: async () => {
      const { data } = await supabase.from("folders").select("*").eq("status", true).order("sort_order");
      return (data ?? []) as Folder[];
    },
  });
  const slots = useQuery({
    queryKey: ["public-slots"],
    queryFn: async () => {
      const { data } = await supabase.from("slots").select("*").eq("status", true).order("sort_order");
      return (data ?? []) as Slot[];
    },
  });
  const services = useQuery({
    queryKey: ["public-taxi-services"],
    queryFn: async () => {
      const { data } = await supabase.from("taxi_services").select("*").eq("status", true).order("sort_order");
      return (data ?? []) as Service[];
    },
  });
  const settings = useQuery({
    queryKey: ["public-site-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("*").limit(1).maybeSingle();
      return data;
    },
  });
  return { folders, slots, services, settings };
}

const sizeClasses: Record<string, string> = {
  small: "md:col-span-3",
  medium: "md:col-span-4",
  large: "md:col-span-6",
  wide: "md:col-span-8",
};

function ServicesPage() {
  const { folders, slots, services, settings } = useTaxiData();
  const heroTitle = settings.data?.hero_title || "Premium Taxi & Service Bookings";
  const heroSubtitle =
    settings.data?.hero_subtitle ||
    "Reliable rides, on-demand services, transparent pricing. Choose any category below.";

  const isLoading = folders.isLoading || slots.isLoading || services.isLoading;
  const isEmpty = !isLoading && (folders.data ?? []).length === 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      {/* HERO */}
      <section className="relative pt-32 pb-16 px-6 overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-50"
          style={{ background: "radial-gradient(70% 60% at 50% 0%, oklch(0.72 0.07 78 / 0.15), transparent 60%)" }} />
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-5xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/60 backdrop-blur text-xs font-semibold text-primary mb-5">
            <Sparkles className="w-3.5 h-3.5" /> Services
          </div>
          <h1 className="text-4xl md:text-6xl font-black leading-[1.05] tracking-tight">{heroTitle}</h1>
          <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">{heroSubtitle}</p>
        </motion.div>
      </section>

      {/* FOLDERS + SLOTS */}
      <section className="px-4 md:px-8 pb-24">
        <div className="max-w-7xl mx-auto space-y-16">
          {isLoading && <SkeletonGrid />}
          {isEmpty && (
            <div className="text-center text-muted-foreground py-16 border border-dashed border-border rounded-2xl">
              No services published yet.
            </div>
          )}

          {(folders.data ?? []).map((folder, fi) => {
            const folderSlots = (slots.data ?? []).filter((s) => s.folder_id === folder.id);
            if (!folderSlots.length) return null;
            return (
              <motion.section
                key={folder.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: fi * 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                <header className="flex items-end justify-between mb-6 gap-4">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2">Category</div>
                    <h2 className="text-2xl md:text-3xl font-black">{folder.name}</h2>
                  </div>
                  <div className="text-xs text-muted-foreground hidden sm:block">{folderSlots.length} option{folderSlots.length === 1 ? "" : "s"}</div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  {folderSlots.map((slot, si) => {
                    const slotServices = (services.data ?? []).filter((sv) => sv.slot_id === slot.id);
                    const mainService = slotServices.find((sv) => sv.button_link);
                    const cardHref = mainService?.button_link ?? null;
                    const cardLabel = mainService?.button_text || "Open";

                    const cardInner = (
                      <>
                        {/* corner glow */}
                        <div aria-hidden className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                          style={{ background: "radial-gradient(circle, oklch(0.72 0.07 78 / 0.18), transparent 60%)" }} />

                        {/* top-right indicator when card is a link */}
                        {cardHref && (
                          <div aria-hidden className="absolute top-5 right-5 w-9 h-9 rounded-full border border-border bg-background/60 backdrop-blur grid place-items-center text-muted-foreground transition-all duration-300 group-hover:border-primary/50 group-hover:text-primary group-hover:bg-primary/10 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                            <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12" />
                          </div>
                        )}

                        {slot.highlight_text && (
                          <div className="inline-flex items-center gap-1.5 mb-4 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[0.7rem] font-bold uppercase tracking-wider">
                            <Sparkles className="w-3 h-3" /> {slot.highlight_text}
                          </div>
                        )}
                        {slot.type && !slot.highlight_text && (
                          <div className="inline-flex items-center gap-1.5 mb-4 px-3 py-1 rounded-full border border-border text-[0.7rem] font-bold uppercase tracking-wider text-muted-foreground">
                            {slot.type}
                          </div>
                        )}

                        <h3 className="text-2xl md:text-3xl font-black leading-tight mb-2 transition-colors duration-300 group-hover:text-primary">{slot.title}</h3>
                        {slot.subtitle && <p className="text-muted-foreground mb-5 text-sm md:text-base">{slot.subtitle}</p>}

                        {slotServices.length > 0 && (
                          <ul className="space-y-3 mb-6">
                            {slotServices.map((sv) => (
                              <li key={sv.id} className="flex items-start justify-between gap-3 pb-3 border-b border-border/60 last:border-0 last:pb-0">
                                <div className="min-w-0">
                                  <div className="font-semibold text-sm flex items-center gap-2">
                                    <ChevronRight className="w-3.5 h-3.5 text-primary shrink-0" />
                                    <span className="truncate">{sv.service_name}</span>
                                    {sv.badge && (
                                      <span className="text-[0.6rem] font-bold uppercase px-1.5 py-0.5 rounded bg-primary/15 text-primary tracking-wider shrink-0">
                                        {sv.badge}
                                      </span>
                                    )}
                                  </div>
                                  {sv.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{sv.description}</p>}
                                </div>
                                {sv.price && <div className="text-sm font-bold text-primary shrink-0">{sv.price}</div>}
                              </li>
                            ))}
                          </ul>
                        )}

                        {/* Contact actions — stop propagation so they don't trigger the card link */}
                        {(slot.contact_number || slot.whatsapp_number) && (
                          <div className="mt-auto pt-2 flex flex-wrap gap-2 relative z-10">
                            {slot.contact_number && (
                              <a
                                href={`tel:${slot.contact_number}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold transition-transform hover:scale-[1.03] active:scale-[0.98]"
                              >
                                <Phone className="w-4 h-4" /> {slot.contact_number}
                              </a>
                            )}
                            {slot.whatsapp_number && (
                              <a
                                href={`https://wa.me/${slot.whatsapp_number.replace(/[^0-9]/g, "")}`}
                                target="_blank" rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-bold hover:bg-muted/40 transition-colors"
                              >
                                <MessageCircle className="w-4 h-4" /> WhatsApp
                              </a>
                            )}
                          </div>
                        )}
                      </>
                    );

                    const sharedClasses = `group relative block ${sizeClasses[slot.card_size] ?? sizeClasses.medium} bg-card rounded-3xl p-6 md:p-8 border border-border overflow-hidden transition-all duration-300 hover:border-primary/40 hover:shadow-[0_30px_80px_-20px_oklch(0_0_0/0.6),0_12px_38px_oklch(0.72_0.07_78/0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background`;
                    const motionProps = {
                      initial: { opacity: 0, y: 24 },
                      whileInView: { opacity: 1, y: 0 },
                      viewport: { once: true, margin: "-60px" },
                      transition: { duration: 0.45, delay: si * 0.05, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
                      whileHover: { y: -6 },
                      whileTap: { scale: 0.985 },
                      style: { background: "var(--gradient-card)" },
                    };

                    if (cardHref) {
                      const isExternal = /^https?:\/\//i.test(cardHref);
                      if (isExternal) {
                        return (
                          <motion.a
                            key={slot.id}
                            href={cardHref}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`${slot.title} — ${cardLabel}`}
                            className={`${sharedClasses} cursor-pointer`}
                            {...motionProps}
                          >
                            {cardInner}
                          </motion.a>
                        );
                      }
                      return (
                        <motion.a
                          key={slot.id}
                          href={cardHref}
                          aria-label={`${slot.title} — ${cardLabel}`}
                          className={`${sharedClasses} cursor-pointer`}
                          {...motionProps}
                        >
                          {cardInner}
                        </motion.a>
                      );
                    }

                    return (
                      <motion.article
                        key={slot.id}
                        className={sharedClasses}
                        {...motionProps}
                      >
                        {cardInner}
                      </motion.article>
                    );
                  })}
                </div>
              </motion.section>
            );
          })}
        </div>

        {/* Back to home */}
        <div className="max-w-7xl mx-auto mt-16 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            ← Back to home
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="md:col-span-4 h-64 rounded-3xl border border-border bg-card/40 animate-pulse" />
      ))}
    </div>
  );
}
