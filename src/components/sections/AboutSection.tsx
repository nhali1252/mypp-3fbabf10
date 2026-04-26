import { useAbout, useContactSettings, useSiteSettings } from "@/hooks/useContent";
import { SectionHeader } from "../SectionHeader";
import { Reveal, Stagger, StaggerItem } from "../motion/Reveal";
import { SocialIcons, type SocialMap } from "../SocialIcons";
import { motion, useReducedMotion } from "framer-motion";

export function AboutSection() {
  const { data: about } = useAbout();
  const { data: contact } = useContactSettings();
  const { data: settings } = useSiteSettings();
  const reduce = useReducedMotion();
  const skills = (about?.skills as string[]) ?? [];
  const stats = (about?.stats as { label: string; value: string }[]) ?? [];
  const social = (contact?.social_links as SocialMap | undefined) ?? {};
  const homeUrl = "/";

  return (
    <section id="about" className="pt-24">
      <SectionHeader label="About me" title={about?.title || "Creative designer for modern brands."} />

      <Stagger className="grid md:grid-cols-2 gap-4 mb-5" stagger={0.12}>
        <StaggerItem className="bg-gradient-card border border-white/5 rounded-[22px] p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-card hover:border-primary/20">
          <div className="flex items-center gap-3 mb-4">
            {settings?.logo_url ? (
              <motion.a
                href={homeUrl}
                aria-label="Home"
                whileHover={reduce ? undefined : { scale: 1.06 }}
                whileTap={reduce ? undefined : { scale: 0.95 }}
                className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-white/5 border border-white/10 overflow-hidden hover:border-primary/40 hover:shadow-glow transition-all"
              >
                <img src={settings.logo_url} alt="Logo" className="w-full h-full object-cover" />
              </motion.a>
            ) : (
              <motion.a
                href={homeUrl}
                aria-label="Home"
                whileHover={reduce ? undefined : { scale: 1.06 }}
                whileTap={reduce ? undefined : { scale: 0.95 }}
                className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-gold text-primary-foreground font-serif-display italic text-lg shadow-glow"
              >
                A
              </motion.a>
            )}
            <h3 className="font-bold text-base text-foreground">Who I am</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-[1.72]">
            {about?.bio ||
              "I am a creative designer focused on logos, banners, posters, product visuals, and Canva-based brand content."}
          </p>
          {Object.keys(social).length > 0 && (
            <div className="mt-5">
              <SocialIcons links={social} variant="chip" />
            </div>
          )}
        </StaggerItem>
        <StaggerItem className="bg-gradient-card border border-white/5 rounded-[22px] p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-card hover:border-primary/20">
          <h3 className="font-bold text-base mb-2.5 text-foreground">What I bring</h3>
          <p className="text-sm text-muted-foreground leading-[1.72]">
            Clean visual thinking, fast turnarounds, and a practical mix of Canva mastery plus AI-assisted
            workflows — built around the way modern brands actually need to ship content.
          </p>
        </StaggerItem>
      </Stagger>

      {(stats.length > 0 || skills.length > 0) && (
        <Reveal as="article" className="bg-gradient-card border border-white/5 rounded-[22px] p-8 shadow-soft" y={32}>
          {stats.length > 0 && (
            <Stagger
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
              stagger={0.08}
            >
              {stats.map((s) => (
                <StaggerItem
                  key={s.label}
                  className="bg-white/[0.04] border border-white/5 rounded-2xl p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary/30"
                >
                  <div className="text-2xl font-black text-foreground font-numeric">{s.value}</div>
                  <div className="text-[0.7rem] uppercase tracking-wider text-muted-foreground mt-1">
                    {s.label}
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          )}
          {skills.length > 0 && (
            <div>
              <div className="text-[0.7rem] font-bold tracking-wider uppercase text-muted-foreground mb-3">
                Skills snapshot
              </div>
              <Stagger className="flex flex-wrap gap-2" stagger={0.04}>
                {skills.map((t) => (
                  <StaggerItem key={t} y={10}>
                    <span className="inline-block px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-[0.75rem] font-semibold text-foreground/85 transition-all hover:bg-gradient-gold hover:text-primary-foreground hover:border-transparent">
                      {t}
                    </span>
                  </StaggerItem>
                ))}
              </Stagger>
            </div>
          )}
        </Reveal>
      )}
    </section>
  );
}
