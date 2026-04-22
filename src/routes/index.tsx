import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowUpRight, Sparkles } from "lucide-react";


export const Route = createFileRoute("/")({
  component: Launcher,
  head: () => ({
    meta: [
      { title: "Ali Nur Hasan — Pick a page to explore" },
      {
        name: "description",
        content:
          "An elegant launcher for Ali Nur Hasan's portfolio — Basic info, Skills & About, and Projects. Powered by TasTaj.",
      },
      { property: "og:title", content: "Ali Nur Hasan — Portfolio launcher" },
      {
        property: "og:description",
        content: "Pick a page to explore: Basic info, Skills, and Projects.",
      },
    ],
  }),
});

type LauncherCard = {
  id: string;
  label: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  badge: string | null;
  route: string;
  accent: string | null;
  thumbnail_url: string | null;
  sort_order: number;
  active: boolean;
};

const FALLBACK: LauncherCard[] = [
  {
    id: "fb-b",
    label: "Page B",
    title: "Basic info",
    subtitle: "Personal introduction",
    description: "Hero card with portrait, brand identity and the original portfolio overview.",
    badge: "Profile",
    route: "/B",
    accent: "from-amber-400/40 to-rose-500/10",
    thumbnail_url: null,
    sort_order: 1,
    active: true,
  },
  {
    id: "fb-f",
    label: "Page F",
    title: "Skills & About",
    subtitle: "Graphic design craft",
    description: "2 years of design work with TasTaj — logos, banners, posters, Canva & Adobe workflow.",
    badge: "Skills",
    route: "/F",
    accent: "from-emerald-400/40 to-cyan-500/10",
    thumbnail_url: null,
    sort_order: 2,
    active: true,
  },
  {
    id: "fb-p",
    label: "Page P",
    title: "Projects",
    subtitle: "Selected work",
    description: "My Pocketo personal finance app and Hazi Enterprise business automation site.",
    badge: "Work",
    route: "/P",
    accent: "from-violet-500/40 to-fuchsia-500/10",
    thumbnail_url: null,
    sort_order: 3,
    active: true,
  },
];

function Launcher() {
  const { data } = useQuery({
    queryKey: ["launcher_pages"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("launcher_pages")
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true });
      if (error) return FALLBACK;
      return (data?.length ? data : FALLBACK) as LauncherCard[];
    },
  });

  const cards = data ?? FALLBACK;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Ambient gradient backdrops */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 w-[640px] h-[640px] rounded-full blur-[140px] opacity-30"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, var(--primary) 70%, transparent) 0%, transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 -right-40 w-[520px] h-[520px] rounded-full blur-[120px] opacity-25"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, var(--accent, var(--primary)) 60%, transparent) 0%, transparent 70%)",
        }}
      />

      <header className="relative px-5 sm:px-6 md:px-10 pt-10 md:pt-16">
        <div className="max-w-[1240px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.3em] text-primary mb-4"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Portfolio · TasTaj
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
            className="font-black tracking-tight leading-[1.02]"
            style={{ fontSize: "clamp(38px, 7vw, 88px)" }}
          >
            Pick a page <br className="hidden sm:block" />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(110deg, var(--foreground) 0%, color-mix(in oklab, var(--primary) 80%, var(--foreground)) 60%, var(--primary) 100%)",
              }}
            >
              to explore.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            className="text-muted-foreground mt-5 max-w-2xl text-sm sm:text-base leading-relaxed"
          >
            A curated launcher for Ali Nur Hasan's portfolio. Each card opens an independent
            page — managed and editable from the admin panel.
          </motion.p>
        </div>
      </header>

      <main className="relative flex-1 px-5 sm:px-6 md:px-10 py-12 md:py-20">
        <div className="max-w-[1240px] mx-auto grid gap-5 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.1 + i * 0.07 }}
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.94, y: -2, rotate: -0.4, transition: { type: "spring", stiffness: 400, damping: 18 } }}
            >
              <Link
                to={c.route}
                className="launcher-card group relative block rounded-[26px] border border-border bg-card p-7 md:p-8 overflow-hidden h-full hover:border-primary/60 transition-[border-color,box-shadow] duration-500 hover:shadow-[0_30px_80px_-30px_color-mix(in_oklab,var(--primary)_45%,transparent)]"
              >
                {/* accent glow */}
                <div
                  aria-hidden
                  className={`absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-30 group-hover:opacity-70 transition-all duration-700 group-hover:scale-125 bg-gradient-to-br ${
                    c.accent || "from-primary/40 to-primary/10"
                  }`}
                />
                {/* sweeping shine on hover/touch */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full group-active:translate-x-full transition-transform duration-[1100ms] ease-out"
                  style={{
                    background:
                      "linear-gradient(110deg, transparent 30%, color-mix(in oklab, var(--primary) 22%, transparent) 50%, transparent 70%)",
                  }}
                />
                {/* shimmer */}
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none"
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
                  }}
                />

                <div className="relative flex flex-col h-full min-h-[260px]">
                  <div className="flex items-center justify-between mb-7">
                    <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-muted-foreground">
                      {c.label}
                    </span>
                    {c.badge && (
                      <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/25 transition-transform duration-500 group-hover:scale-110">
                        {c.badge}
                      </span>
                    )}
                  </div>

                  {c.thumbnail_url && (
                    <div className="mb-5 rounded-2xl overflow-hidden border border-border aspect-[16/9]">
                      <img
                        src={c.thumbnail_url}
                        alt={c.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    </div>
                  )}

                  <h2
                    className="font-black tracking-tight leading-tight mb-2 transition-colors duration-500 group-hover:text-primary"
                    style={{ fontSize: "clamp(22px, 2.4vw, 30px)" }}
                  >
                    {c.title}
                  </h2>
                  {c.subtitle && (
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary/80 mb-3">
                      {c.subtitle}
                    </p>
                  )}
                  {c.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed mb-7 flex-1">
                      {c.description}
                    </p>
                  )}

                  <span className="inline-flex items-center justify-between gap-2 text-sm font-bold mt-auto pt-5 border-t border-border/60 text-foreground group-hover:text-primary transition-colors">
                    <span>Open {c.label}</span>
                    <ArrowUpRight className="w-4 h-4 transition-transform duration-500 group-hover:translate-x-2 group-hover:-translate-y-2 group-hover:rotate-12" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </main>

      <footer className="relative px-5 sm:px-6 md:px-10 py-8 text-center text-xs text-muted-foreground border-t border-border">
        © {new Date().getFullYear()} Ali Nur Hasan · TasTaj ·{" "}
        <Link to="/auth" className="hover:text-foreground transition-colors">
          Admin
        </Link>
      </footer>
    </div>
  );
}
