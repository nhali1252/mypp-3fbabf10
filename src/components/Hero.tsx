import portraitFallback from "@/assets/ali-portrait.png";
import { useHero } from "@/hooks/useContent";
import { motion, useReducedMotion } from "framer-motion";

export function Hero() {
  const { data: hero } = useHero();
  const reduce = useReducedMotion();
  const portrait =
    hero?.portrait_url && !hero.portrait_url.startsWith("/src/")
      ? hero.portrait_url
      : portraitFallback;

  const headline =
    hero?.headline ??
    "Creative Designer for Logo, Banner, Product, Poster, Canva & Basic Web Design";
  const sub =
    hero?.subheadline ??
    "I create modern visual designs for brands, businesses, and digital content using creative design skills, Canva workflows, and practical AI support.";
  const eyebrow = hero?.eyebrow ?? "Creative Designer · Canva · AI";

  const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

  return (
    <section id="home" className="relative pt-[110px] pb-0 overflow-hidden bg-background">
      <motion.div
        aria-hidden
        className="absolute left-1/2 top-[140px] md:top-[160px] -translate-x-1/2 font-black uppercase whitespace-nowrap pointer-events-none select-none leading-none tracking-[-0.055em] z-0"
        style={{
          fontSize: "clamp(56px, 10.2vw, 166px)",
          color: "color-mix(in oklab, var(--watermark) 4%, transparent)",
        }}
        initial={{ opacity: 0, scale: reduce ? 1 : 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease, delay: 0.1 }}
      >
        ALI NUR HASAN
      </motion.div>

      <motion.div
        className="relative z-[2] mx-3 md:mx-7"
        initial={{ opacity: 0, y: reduce ? 0 : 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease }}
      >
        <div className="relative bg-gradient-card border border-white/5 rounded-[28px] md:rounded-t-[28px] md:rounded-b-none overflow-visible min-h-[540px] md:min-h-[720px] shadow-card">
          <div
            className="absolute -top-20 -right-20 w-[480px] h-[480px] rounded-full opacity-40 pointer-events-none drift-a"
            style={{
              background:
                "radial-gradient(closest-side, color-mix(in oklab, var(--primary) 50%, transparent), transparent 70%)",
              filter: "blur(80px)",
            }}
          />
          <div
            aria-hidden
            className="absolute inset-0 rounded-[28px] md:rounded-t-[28px] md:rounded-b-none pointer-events-none"
            style={{
              background:
                "radial-gradient(120% 80% at 0% 100%, color-mix(in oklab, var(--primary) 8%, transparent) 0%, transparent 60%)",
            }}
          />

          <div className="relative grid md:grid-cols-[1.15fr_1fr] items-end md:items-center min-h-[540px] md:min-h-[720px]">
            <div className="relative flex justify-center md:justify-start order-1 md:pl-10 lg:pl-14">
              <img
                src={portrait}
                alt="Ali Nur Hasan portrait"
                width={820}
                height={1120}
                className="photo-enter relative block h-[480px] sm:h-[560px] md:h-[820px] lg:h-[900px] w-auto object-contain object-bottom -mt-24 md:-mt-32 drop-shadow-[0_36px_60px_rgba(0,0,0,0.6)]"
              />
            </div>

            <motion.div
              className="relative px-6 pb-12 md:pb-0 md:pr-16 md:pl-2 order-2 text-center md:text-left z-[3]"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.12, delayChildren: 0.35 } },
              }}
            >
              <motion.span
                className="inline-block text-[0.7rem] font-bold tracking-[0.18em] uppercase text-primary mb-5"
                variants={{
                  hidden: { opacity: 0, x: reduce ? 0 : 30 },
                  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease } },
                }}
              >
                {eyebrow}
              </motion.span>
              <motion.h1
                className="font-black leading-[1.05] mb-5 tracking-tight text-foreground"
                style={{ fontSize: "clamp(30px, 4.4vw, 58px)" }}
                variants={{
                  hidden: { opacity: 0, x: reduce ? 0 : 30 },
                  visible: { opacity: 1, x: 0, transition: { duration: 0.85, ease } },
                }}
              >
                {headline}
              </motion.h1>
              {sub && (
                <motion.p
                  className="text-muted-foreground text-base md:text-lg mb-8 max-w-md mx-auto md:mx-0 leading-relaxed"
                  variants={{
                    hidden: { opacity: 0, x: reduce ? 0 : 30 },
                    visible: { opacity: 1, x: 0, transition: { duration: 0.75, ease } },
                  }}
                >
                  {sub}
                </motion.p>
              )}
              <motion.div
                className="flex gap-3.5 items-center flex-wrap justify-center md:justify-start"
                variants={{
                  hidden: { opacity: 0, x: reduce ? 0 : 30 },
                  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease } },
                }}
              >
                <motion.a
                  href={hero?.primary_cta_url || "#contact"}
                  whileHover={reduce ? undefined : { y: -3, scale: 1.03 }}
                  whileTap={reduce ? undefined : { scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}
                  className="bg-gradient-gold text-primary-foreground px-7 py-[15px] rounded-full text-sm font-bold transition-shadow hover:shadow-glow"
                >
                  {hero?.primary_cta_label || "Hire Me"}
                </motion.a>
                <motion.a
                  href={hero?.secondary_cta_url || "#portfolio"}
                  whileHover={reduce ? undefined : { y: -3 }}
                  whileTap={reduce ? undefined : { scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}
                  className="bg-transparent border border-foreground/25 text-foreground px-7 py-[15px] rounded-full text-sm font-semibold hover:border-primary hover:text-primary transition-colors"
                >
                  {hero?.secondary_cta_label || "View Projects"}
                </motion.a>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
