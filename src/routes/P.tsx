import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ExternalLink, Github, Sparkles, Wallet } from "lucide-react";

export const Route = createFileRoute("/P")({
  component: ProjectsPage,
  head: () => ({
    meta: [
      { title: "Projects — Ali Nur Hasan (TasTaj)" },
      {
        name: "description",
        content:
          "Selected projects by Ali Nur Hasan: my-v7 / my-v8 portfolio + CMS, and Pocket-Ledger finance app.",
      },
      { property: "og:title", content: "Projects — Ali Nur Hasan (TasTaj)" },
      {
        property: "og:description",
        content:
          "Portfolio + CMS work and Pocket-Ledger — a finance / account tracking application.",
      },
    ],
  }),
});

type Project = {
  badge: string;
  title: string;
  tagline: string;
  description: string;
  highlights: string[];
  tech: string[];
  icon: typeof Sparkles;
};

const projects: Project[] = [
  {
    badge: "Portfolio · CMS",
    title: "my-v7 / my-v8 — Portfolio + Admin CMS",
    tagline: "A personal portfolio with a fully editable admin layer.",
    description:
      "An evolving portfolio platform built across two iterations (my-v7 and my-v8). It pairs a polished public portfolio with a complete CMS, so every section — hero, about, skills, projects, contact, social links and footer — can be edited from the admin without touching code. The two versions explore different hero treatments and layout systems while sharing the same content backbone.",
    highlights: [
      "Admin-editable sections across the whole site",
      "Redesigned premium hero card with watermark name",
      "Social links and footer apps managed from the admin",
      "Smooth animations and refined UI hierarchy",
      "Multi-version routing (/B, /F) with isolated content",
      "Role-based admin: Admin manages users, Editors manage content",
    ],
    tech: ["React", "TanStack Start", "Tailwind", "Framer Motion", "Supabase", "TypeScript"],
    icon: Sparkles,
  },
  {
    badge: "Finance · Mobile App",
    title: "Pocket-Ledger — Personal Finance Tracker",
    tagline: "A focused app for digital record keeping and money management.",
    description:
      "Pocket-Ledger is a finance and account tracking application centered on simple, reliable digital record keeping. The product is designed around the everyday rhythm of logging transactions, reviewing balances and staying on top of personal finances — with a clean interface that keeps the focus on the numbers. I work on the source code and own the product direction, treating it as a long-term build.",
    highlights: [
      "Clean transaction entry and history",
      "Account-level balance and overview",
      "Practical, mobile-first usability",
      "Owned end-to-end: source code and product direction",
      "Demonstrates product thinking and modern app workflow",
    ],
    tech: ["Mobile App", "Finance", "UX", "Product"],
    icon: Wallet,
  },
];

function ProjectsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="px-6 md:px-10 pt-8 md:pt-10">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground transition-colors"
          >
            ← All versions
          </Link>
          <nav className="flex items-center gap-4 text-xs font-bold uppercase tracking-[0.2em]">
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
      <section className="px-6 md:px-10 pt-10 md:pt-14 pb-6">
        <div className="max-w-[1200px] mx-auto">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary mb-3">
            Projects
          </p>
          <h1
            className="font-black tracking-tight leading-[1.05] mb-3"
            style={{ fontSize: "clamp(34px, 5.4vw, 64px)" }}
          >
            Selected work
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Two projects that reflect both my design thinking and my interest in building practical
            digital products.
          </p>
        </div>
      </section>

      {/* Projects */}
      <section className="px-6 md:px-10 pb-16">
        <div className="max-w-[1200px] mx-auto grid gap-6 md:gap-8">
          {projects.map((p, i) => (
            <motion.article
              key={p.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 }}
              className="relative rounded-[24px] border border-border bg-card overflow-hidden"
            >
              <div
                aria-hidden
                className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl opacity-20"
                style={{
                  background:
                    "radial-gradient(circle, color-mix(in oklab, var(--primary) 65%, transparent) 0%, transparent 70%)",
                }}
              />
              <div className="relative grid lg:grid-cols-[1fr_360px] gap-0">
                {/* Main */}
                <div className="p-7 md:p-10">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary grid place-items-center">
                      <p.icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em] px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/25">
                      {p.badge}
                    </span>
                  </div>
                  <h2
                    className="font-black tracking-tight leading-tight mb-2"
                    style={{ fontSize: "clamp(22px, 2.6vw, 34px)" }}
                  >
                    {p.title}
                  </h2>
                  <p className="text-base text-foreground/80 mb-4 italic">{p.tagline}</p>
                  <p className="text-sm md:text-[15px] text-muted-foreground leading-relaxed mb-6">
                    {p.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {p.tech.map((t) => (
                      <span
                        key={t}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full border border-border bg-background/40"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Side */}
                <div className="border-t lg:border-t-0 lg:border-l border-border p-7 md:p-10 bg-background/30">
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground mb-4">
                    Highlights
                  </p>
                  <ul className="space-y-2.5">
                    {p.highlights.map((h) => (
                      <li key={h} className="flex gap-2.5 text-sm">
                        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        <span className="text-foreground/85">{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <footer className="px-6 md:px-10 py-10 text-center text-xs text-muted-foreground border-t border-border">
        © {new Date().getFullYear()} Ali Nur Hasan · TasTaj ·{" "}
        <Link to="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
      </footer>

      {/* Hidden, semantic links for SEO/accessibility */}
      <div className="sr-only">
        <a href="https://github.com" rel="noopener noreferrer">
          <Github className="w-4 h-4" /> GitHub
        </a>
        <a href="https://example.com" rel="noopener noreferrer">
          <ExternalLink className="w-4 h-4" /> Live
        </a>
      </div>
    </div>
  );
}
