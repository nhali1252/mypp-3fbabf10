import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ExternalLink, Sparkles, Wallet, LayoutTemplate, ArrowRight } from "lucide-react";


export const Route = createFileRoute("/P")({
  component: ProjectsPage,
  head: () => ({
    meta: [
      { title: "Projects — Ali Nur Hasan (TasTaj)" },
      {
        name: "description",
        content:
          "Selected work by Ali Nur Hasan — my-v7 / my-v8 portfolio + CMS project and Pocket-Ledger personal finance app.",
      },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Projects — Ali Nur Hasan (TasTaj)" },
      {
        property: "og:description",
        content:
          "Two real builds: my-v7 / my-v8 portfolio + admin CMS, and Pocket-Ledger finance app.",
      },
      { property: "twitter:card", content: "summary_large_image" },
      { property: "twitter:title", content: "Projects — Ali Nur Hasan (TasTaj)" },
      {
        property: "twitter:description",
        content:
          "Two real builds: my-v7 / my-v8 portfolio + admin CMS, and Pocket-Ledger finance app.",
      },
    ],
  }),
});

type Action = { label: string; href: string; primary?: boolean };
type Project = {
  badge: string;
  title: string;
  tagline: string;
  description: string;
  highlights: string[];
  tech: string[];
  icon: typeof Sparkles;
  actions: Action[];
  accent: string;
};

const projects: Project[] = [
  {
    badge: "Portfolio · CMS",
    title: "my-v7 / my-v8 — Portfolio + Admin CMS",
    tagline: "An evolving portfolio site with a real, editable admin behind it.",
    description:
      "my-v7 and my-v8 are the two iterations of my personal portfolio + CMS project. They pair a polished portfolio frontend with admin-editable sections — hero, social links, projects, and content blocks — so the site can be updated without touching code. Across these versions I focused on the hero card redesign, smoother animations, cleaner admin usability, and tighter content management. The work reflects both design thinking and practical website customization.",
    highlights: [
      "Admin-editable hero, sections, and social links",
      "Hero card redesign with stronger typography and motion",
      "Smooth, premium animations across the public pages",
      "CMS / admin usability improvements between v7 and v8",
      "Showcases design thinking + real product iteration",
    ],
    tech: ["Portfolio", "CMS", "Admin", "UI/UX", "Animations"],
    icon: LayoutTemplate,
    actions: [],
    accent: "from-amber-500/30 to-rose-500/20",
  },
  {
    badge: "Finance · App",
    title: "Pocket-Ledger — Personal Finance & Account Tracker",
    tagline: "A focused app for digital record keeping and money management.",
    description:
      "Pocket-Ledger is a finance and account tracking application built around simple, reliable digital record keeping. It's designed for the everyday rhythm of logging transactions, reviewing balances and staying on top of personal finances — with a clean interface that keeps the focus on the numbers. I work on the source code and own the product direction, treating it as a long-term build that reflects my interest in practical digital products and modern app workflow.",
    highlights: [
      "Clean transaction entry and history",
      "Account-level balance and overview",
      "Practical, mobile-first usability",
      "Owned end-to-end: source code and product direction",
      "Demonstrates product thinking and modern app workflow",
    ],
    tech: ["Finance", "App", "UX", "Product"],
    icon: Wallet,
    actions: [],
    accent: "from-emerald-500/30 to-cyan-500/20",
  },
];

function ProjectsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="px-5 sm:px-6 md:px-10 pt-7 md:pt-10">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-3">
          <Link
            to="/"
            className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground transition-colors"
          >
            ← All versions
          </Link>
          <nav className="flex items-center gap-3 sm:gap-4 text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em]">
            <Link to="/B" className="text-muted-foreground hover:text-foreground transition-colors">
              /B
            </Link>
            <Link to="/F" className="text-muted-foreground hover:text-foreground transition-colors">
              /F
            </Link>
            <Link to="/P" className="text-primary">
              /P
            </Link>
          </nav>
        </div>
      </header>

      {/* Page header */}
      <section className="px-5 sm:px-6 md:px-10 pt-8 sm:pt-10 md:pt-14 pb-4 sm:pb-6">
        <div className="max-w-[1200px] mx-auto">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary mb-3">
            Projects
          </p>
          <h1
            className="font-black tracking-tight leading-[1.05] mb-3"
            style={{ fontSize: "clamp(30px, 5.4vw, 64px)" }}
          >
            Selected work
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
            Two live projects that reflect both my design thinking and my interest in building
            practical digital products.
          </p>
        </div>
      </section>

      {/* Projects */}
      <section className="px-5 sm:px-6 md:px-10 pb-14 sm:pb-16">
        <div className="max-w-[1200px] mx-auto grid gap-5 sm:gap-6 md:gap-8">
          {projects.map((p, i) => (
            <motion.article
              key={p.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 }}
              className="group relative rounded-[20px] sm:rounded-[24px] border border-border bg-card overflow-hidden"
            >
              {/* Animated accent glow */}
              <div
                aria-hidden
                className={`absolute -top-24 -right-24 w-72 h-72 sm:w-96 sm:h-96 rounded-full blur-3xl opacity-25 group-hover:opacity-50 transition-opacity duration-700 bg-gradient-to-br ${p.accent}`}
              />
              {/* Subtle moving shimmer */}
              <div
                aria-hidden
                className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
                }}
              />

              <div className="relative grid lg:grid-cols-[1fr_360px] gap-0">
                {/* Main */}
                <div className="p-6 sm:p-8 md:p-10">
                  <div className="flex flex-wrap items-center gap-3 mb-5">
                    <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary grid place-items-center ring-1 ring-primary/20">
                      <p.icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em] px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/25">
                      {p.badge}
                    </span>
                  </div>
                  <h2
                    className="font-black tracking-tight leading-tight mb-2 break-words"
                    style={{ fontSize: "clamp(20px, 3.4vw, 34px)" }}
                  >
                    {p.title}
                  </h2>
                  <p className="text-sm sm:text-base text-foreground/80 mb-4 italic">
                    {p.tagline}
                  </p>
                  <p className="text-sm sm:text-[15px] text-muted-foreground leading-relaxed mb-6">
                    {p.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {p.tech.map((t) => (
                      <span
                        key={t}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full border border-border bg-background/40"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  {p.actions.length > 0 && (
                    <div className="flex flex-wrap gap-2.5">
                      {p.actions.map((a) => (
                        <a
                          key={a.href}
                          href={a.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={
                            a.primary
                              ? "inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-bold hover:opacity-90 transition-opacity shadow-[0_10px_30px_-12px_color-mix(in_oklab,var(--primary)_55%,transparent)]"
                              : "inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-bold hover:border-primary hover:text-primary transition-colors"
                          }
                        >
                          <ExternalLink className="w-4 h-4" />
                          {a.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Side highlights */}
                <div className="border-t lg:border-t-0 lg:border-l border-border p-6 sm:p-8 md:p-10 bg-background/30">
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground mb-4">
                    Highlights
                  </p>
                  <ul className="space-y-2.5">
                    {p.highlights.map((h) => (
                      <li key={h} className="flex gap-2.5 text-sm">
                        <ArrowRight className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                        <span className="text-foreground/85 leading-relaxed">{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <footer className="px-5 sm:px-6 md:px-10 py-8 sm:py-10 text-center text-xs text-muted-foreground border-t border-border">
        © {new Date().getFullYear()} Ali Nur Hasan · TasTaj ·{" "}
        <Link to="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
      </footer>
    </div>
  );
}
