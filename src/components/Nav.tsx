import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useNavLinks, useSiteSettings } from "@/hooks/useContent";
import { useHireMe } from "./HireMeProvider";

export function Nav({ showHireMe = true }: { showHireMe?: boolean } = {}) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [logoBroken, setLogoBroken] = useState(false);
  const { data: links = [] } = useNavLinks();
  const { data: settings } = useSiteSettings();
  const reduce = useReducedMotion();
  const { openHireMe } = useHireMe();

  useEffect(() => {
    setLogoBroken(false);
  }, [settings?.logo_url]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: reduce ? 0 : -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 inset-x-0 z-50 flex items-center justify-between px-5 md:px-10 backdrop-blur-md border-b transition-all duration-500 ${
        scrolled
          ? "h-[62px] bg-background/90 border-border shadow-[0_8px_28px_-18px_rgba(0,0,0,0.25)]"
          : "h-[70px] bg-background/70 border-transparent"
      }`}
    >
      <Link
        to="/"
        className="flex items-center gap-2.5 text-foreground tracking-tight group"
        aria-label="Home"
      >
        {settings?.logo_url && !logoBroken && (
          <img
            src={settings.logo_url}
            alt={`${settings?.site_name || settings?.site_title || "Site"} logo`}
            onError={() => setLogoBroken(true)}
            className="h-8 md:h-9 w-auto max-w-[160px] object-contain transition-transform duration-300 group-hover:scale-105"
          />
        )}
        <span className="font-serif-display italic text-[22px] md:text-[26px] leading-none">
          {settings?.site_name?.trim() ||
            settings?.site_title?.split("—")[0]?.trim() ||
            "Portfolio"}
        </span>
      </Link>
      <ul className="hidden lg:flex gap-8 list-none text-[13.5px] font-medium text-muted-foreground">
        {links.map((l: { id: string; label: string; url: string }) => (
          <li key={l.id} className="relative group">
            <a
              href={l.url}
              className="relative inline-block py-1 transition-all duration-300 ease-out text-muted-foreground group-hover:text-foreground group-hover:-translate-y-0.5 will-change-transform"
            >
              <span className="relative z-10">{l.label}</span>
              <span
                aria-hidden
                className="pointer-events-none absolute left-0 -bottom-1 h-[2px] w-full origin-left scale-x-0 rounded-full bg-gradient-to-r from-primary via-primary to-primary/40 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-2 -bottom-1 h-3 rounded-full bg-primary/30 blur-md opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              />
            </a>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2">
        {showHireMe && (
          <motion.button
            type="button"
            onClick={openHireMe}
            whileHover={reduce ? undefined : { y: -2, scale: 1.04 }}
            whileTap={reduce ? undefined : { scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className="hidden sm:inline-block bg-gradient-gold text-primary-foreground px-5 py-2.5 rounded-full text-[13px] font-bold hover:shadow-glow transition-shadow"
          >
            Hire Me
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="lg:hidden absolute top-full left-0 right-0 bg-background border-b border-border p-5 flex flex-col gap-3 shadow-card"
          >
            {links.map((l: { id: string; label: string; url: string }) => (
              <a
                key={l.id}
                href={l.url}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-foreground py-2 hover:text-primary transition-colors"
              >
                {l.label}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
