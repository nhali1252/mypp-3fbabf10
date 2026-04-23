import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { useMotionPref } from "@/hooks/useMotionPref";
import { MotionToggle } from "@/components/MotionToggle";
import { ThemeToggle } from "@/components/ThemeToggle";


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
    label: "Basic",
    title: "Basic info",
    subtitle: "Personal introduction",
    description: "Hero card with portrait, brand identity and the original portfolio overview.",
    badge: "Profile",
    route: "/basic",
    accent: "from-amber-400/40 to-rose-500/10",
    thumbnail_url: null,
    sort_order: 1,
    active: true,
  },
  {
    id: "fb-f",
    label: "About & Skills",
    title: "About & Skills",
    subtitle: "Graphic design craft",
    description: "2 years of design work with TasTaj — logos, banners, posters, Canva & Adobe workflow.",
    badge: "Skills",
    route: "/about-and-skills",
    accent: "from-emerald-400/40 to-cyan-500/10",
    thumbnail_url: null,
    sort_order: 2,
    active: true,
  },
  {
    id: "fb-p",
    label: "Projects",
    title: "Projects",
    subtitle: "Selected work",
    description: "My Pocketo personal finance app and Hazi Enterprise business automation site.",
    badge: "Work",
    route: "/projects",
    accent: "from-violet-500/40 to-fuchsia-500/10",
    thumbnail_url: null,
    sort_order: 3,
    active: true,
  },
  {
    id: "fb-s",
    label: "Services",
    title: "Services",
    subtitle: "What I offer",
    description: "Editorial services page — branding, design systems and the modern toolkit I work with.",
    badge: "Offer",
    route: "/services-design",
    accent: "from-sky-500/40 to-indigo-500/10",
    thumbnail_url: null,
    sort_order: 4,
    active: true,
  },
  {
    id: "fb-c",
    label: "Contact",
    title: "Contact",
    subtitle: "Start a project",
    description: "Pick a slot, share a brief and I'll reply within 24 hours. Synced to my inbox.",
    badge: "Talk",
    route: "/contact",
    accent: "from-rose-500/40 to-orange-500/10",
    thumbnail_url: null,
    sort_order: 5,
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
  const [hovered, setHovered] = useState<number | null>(null);
  const { reduceMotion } = useMotionPref();

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
          <div className="flex items-center justify-between gap-4 mb-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.3em] text-primary"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Portfolio · TasTaj
            </motion.div>
            <div className="flex items-center gap-2">
              <MotionToggle />
              <ThemeToggle />
            </div>
          </div>

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
          {cards.map((c, i) => {
            const distance = hovered === null ? 0 : Math.abs(hovered - i);
            const isNeighbor = hovered !== null && hovered !== i;
            const isHovered = hovered === i;
            // Reduced-motion still tracks hover/focus, but uses snappy 120ms
            // transitions and no transforms — only color/opacity changes.
            const baseDur = reduceMotion ? 120 : 500;
            const shineDur = reduceMotion ? 220 : 1100;
            const stagger = reduceMotion ? 0 : 110;
            const staggerDelay = `${distance * stagger}ms`;
            return (
              <motion.div
                key={c.id}
                initial={reduceMotion ? false : { opacity: 0, y: 28 }}
                animate={
                  reduceMotion
                    ? { opacity: 1 }
                    : { opacity: 1, y: isHovered ? -8 : 0, scale: isHovered ? 1.02 : 1 }
                }
                transition={{ duration: reduceMotion ? 0 : 0.5, ease: [0.22, 1, 0.36, 1], delay: reduceMotion ? 0 : 0.1 + i * 0.07 }}
                whileTap={reduceMotion ? { scale: 0.985, transition: { duration: 0.08 } } : { scale: 0.94, y: -2, rotate: -0.4, transition: { type: "spring", stiffness: 400, damping: 18 } }}
                onHoverStart={() => setHovered(i)}
                onHoverEnd={() => setHovered((h) => (h === i ? null : h))}
                onTapStart={() => setHovered(i)}
              >
                <Link
                  to={c.route}
                  onFocus={() => setHovered(i)}
                  onBlur={() => setHovered((h) => (h === i ? null : h))}
                  className="launcher-card group relative block rounded-[26px] border border-border bg-card p-7 md:p-8 overflow-hidden h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background hover:border-primary/60 focus-visible:border-primary/60 hover:shadow-[0_30px_80px_-30px_color-mix(in_oklab,var(--primary)_45%,transparent)] focus-visible:shadow-[0_30px_80px_-30px_color-mix(in_oklab,var(--primary)_45%,transparent)]"
                  style={{
                    transitionProperty: "border-color, box-shadow, transform",
                    transitionDuration: `${baseDur}ms`,
                    transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)",
                    transitionDelay: isNeighbor ? staggerDelay : "0ms",
                    borderColor: isNeighbor ? "color-mix(in oklab, var(--primary) 35%, var(--border))" : undefined,
                    boxShadow: isNeighbor
                      ? `0 20px 60px -30px color-mix(in oklab, var(--primary) ${Math.max(20, 45 - distance * 12)}%, transparent)`
                      : undefined,
                  }}
                >
                  {/* accent glow — opacity-only fade under reduced motion */}
                  <div
                    aria-hidden
                    className={`absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl bg-gradient-to-br ${
                      c.accent || "from-primary/40 to-primary/10"
                    } ${reduceMotion ? "group-hover:opacity-60" : "group-hover:opacity-70 group-hover:scale-125"}`}
                    style={{
                      transitionProperty: reduceMotion ? "opacity" : "opacity, transform",
                      transitionDuration: `${reduceMotion ? 160 : 700}ms`,
                      transitionTimingFunction: "ease-out",
                      opacity: isHovered ? (reduceMotion ? 0.55 : 0.7) : isNeighbor ? Math.max(0.32, 0.55 - distance * 0.12) : 0.3,
                      transform: !reduceMotion && isNeighbor ? `scale(${1 + Math.max(0, 0.18 - distance * 0.06)})` : undefined,
                      transitionDelay: isNeighbor ? staggerDelay : "0ms",
                    }}
                  />
                  {/* sweeping shine — kept under reduced motion but quick + subtle */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full"
                    style={{
                      background: reduceMotion
                        ? "linear-gradient(110deg, transparent 35%, color-mix(in oklab, var(--primary) 12%, transparent) 50%, transparent 65%)"
                        : "linear-gradient(110deg, transparent 30%, color-mix(in oklab, var(--primary) 22%, transparent) 50%, transparent 70%)",
                      transitionProperty: "transform",
                      transitionDuration: `${shineDur}ms`,
                      transitionTimingFunction: "ease-out",
                      transform: isHovered || isNeighbor ? "translateX(100%)" : undefined,
                      transitionDelay: isNeighbor ? staggerDelay : "0ms",
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
            );
          })}
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
