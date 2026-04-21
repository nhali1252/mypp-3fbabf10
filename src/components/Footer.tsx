import { useFooterLinks, useSiteSettings, useContactSettings, useFooterApps } from "@/hooks/useContent";
import { motion, useReducedMotion } from "framer-motion";
import { SocialIcons, type SocialMap } from "./SocialIcons";
import { ArrowUpRight, AppWindow } from "lucide-react";

interface FooterApp {
  id: string;
  name: string;
  description?: string | null;
  url: string;
  logo_url?: string | null;
}

export function Footer() {
  const { data: links = [] } = useFooterLinks();
  const { data: settings } = useSiteSettings();
  const { data: contact } = useContactSettings();
  const { data: apps = [] } = useFooterApps();
  const social = (contact?.social_links as SocialMap | undefined) ?? {};
  const reduce = useReducedMotion();
  const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

  return (
    <motion.footer
      initial={{ opacity: 0, y: reduce ? 0 : 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.05 }}
      transition={{ duration: 0.8, ease }}
      className="bg-gradient-card border border-white/5 text-muted-foreground text-sm px-6 md:px-12 py-10 md:py-12 rounded-3xl mt-20 mx-3 md:mx-7 mb-7 shadow-card overflow-hidden relative"
    >
      <div
        aria-hidden
        className="absolute -top-32 -right-32 w-[400px] h-[400px] rounded-full pointer-events-none opacity-[0.18]"
        style={{ background: "radial-gradient(closest-side, color-mix(in oklab, var(--primary) 60%, transparent), transparent 70%)", filter: "blur(70px)" }}
      />

      {(apps as FooterApp[]).length > 0 && (
        <div className="relative mb-10">
          <div className="flex items-end justify-between mb-5 gap-4">
            <div>
              <span className="block text-[0.65rem] font-bold tracking-[0.2em] uppercase text-primary mb-1.5">My Apps</span>
              <h3 className="font-serif-display italic text-2xl md:text-3xl text-foreground">Explore the brand</h3>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(apps as FooterApp[]).map((a, i) => (
              <motion.a
                key={a.id}
                href={a.url}
                target="_blank"
                rel="noreferrer"
                initial={{ opacity: 0, y: reduce ? 0 : 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, ease, delay: i * 0.08 }}
                whileHover={reduce ? undefined : { y: -4 }}
                className="group relative flex items-center gap-4 p-4 md:p-5 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-primary/40 hover:bg-white/[0.06] transition-all hover:shadow-glow"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-card border border-white/10 grid place-items-center overflow-hidden shrink-0 group-hover:border-primary/40 transition-all">
                  {a.logo_url ? (
                    <img src={a.logo_url} alt={a.name} className="w-full h-full object-cover" />
                  ) : (
                    <AppWindow size={22} className="text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-foreground truncate group-hover:text-primary transition-colors">{a.name}</div>
                  {a.description && (
                    <div className="text-xs text-muted-foreground truncate">{a.description}</div>
                  )}
                </div>
                <span className="w-9 h-9 grid place-items-center rounded-full bg-white/[0.04] border border-white/10 text-foreground/80 group-hover:bg-gradient-gold group-hover:text-primary-foreground group-hover:rotate-45 group-hover:border-transparent transition-all duration-500">
                  <ArrowUpRight size={15} />
                </span>
              </motion.a>
            ))}
          </div>
        </div>
      )}

      <div className="relative flex flex-col md:flex-row md:justify-between gap-6 items-center pt-6 border-t border-white/5">
        <a
          href="/"
          className="flex items-center gap-3 group"
          aria-label="Home"
        >
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt="Logo" className="w-10 h-10 rounded-xl object-cover border border-white/10 group-hover:border-primary/40 transition-all" />
          ) : (
            <span className="w-10 h-10 grid place-items-center rounded-xl bg-gradient-gold text-primary-foreground font-serif-display italic text-lg shadow-glow">A</span>
          )}
          <span className="text-foreground/85 text-sm">
            {settings?.footer_text || `© ${new Date().getFullYear()} Portfolio`}
          </span>
        </a>
        <div className="flex gap-6 flex-wrap justify-center">
          {links.map((l: { id: string; label: string; url: string }) => (
            <a
              key={l.id}
              href={l.url}
              className="relative text-muted-foreground hover:text-foreground transition-colors after:content-[''] after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-full after:bg-primary after:origin-left after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300"
            >
              {l.label}
            </a>
          ))}
        </div>
        <SocialIcons links={social} variant="chip" />
      </div>
    </motion.footer>
  );
}
