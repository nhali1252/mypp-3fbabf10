import { useFooterLinks, useSiteSettings, useContactSettings } from "@/hooks/useContent";
import { motion, useReducedMotion } from "framer-motion";
import { SocialIcons, type SocialMap } from "./SocialIcons";

export function Footer() {
  const { data: links = [] } = useFooterLinks();
  const { data: settings } = useSiteSettings();
  const { data: contact } = useContactSettings();
  const social = (contact?.social_links as SocialMap | undefined) ?? {};
  const reduce = useReducedMotion();

  return (
    <motion.footer
      initial={{ opacity: 0, y: reduce ? 0 : 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.05 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="bg-gradient-card border border-white/5 text-muted-foreground text-sm px-6 md:px-10 py-8 rounded-3xl mt-20 mx-3 md:mx-7 mb-7 shadow-card"
    >
      <div className="flex flex-col md:flex-row md:justify-between gap-6 items-center">
        <span className="text-foreground/80">
          {settings?.footer_text || `© ${new Date().getFullYear()} Portfolio`}
        </span>
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
