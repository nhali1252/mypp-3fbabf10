import portraitFallback from "@/assets/ali-portrait.png";
import { useHero } from "@/hooks/useContent";
import { motion, useReducedMotion } from "framer-motion";
import { useHireMe } from "./HireMeProvider";
import { smoothScrollToId } from "@/lib/smoothScroll";

export function Hero() {
  const { data: hero } = useHero();
  const reduce = useReducedMotion();
  const { openHireMe } = useHireMe();
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
  const eyebrow = hero?.eyebrow ?? "Graphic Designer · Branding · Canva · Adobe · AI";

  const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

  return (
    <section
      id="home"
      className="relative pt-24 md:pt-28 pb-10 md:pb-16 overflow-hidden bg-background"
    >
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 relative">
        {/* Large faded watermark name behind the card */}
        <motion.div
          aria-hidden
          className="absolute left-1/2 -translate-x-1/2 top-2 md:top-6 font-black uppercase whitespace-nowrap pointer-events-none select-none leading-none tracking-[-0.04em] z-0"
          style={{
            fontSize: "clamp(64px, 11vw, 180px)",
            color: "color-mix(in oklab, var(--watermark) 7%, transparent)",
          }}
          initial={{ opacity: 0, y: reduce ? 0 : -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease, delay: 0.05 }}
        >
          ALI NUR HASAN
        </motion.div>

        {/* Premium dark rounded hero card */}
        <motion.div
          className="relative z-10 rounded-[24px] overflow-hidden border border-white/[0.06] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)]"
          style={{
            background:
              "linear-gradient(180deg, color-mix(in oklab, var(--card) 96%, black) 0%, color-mix(in oklab, var(--card) 88%, black) 100%)",
          }}
          initial={{ opacity: 0, y: reduce ? 0 : 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease }}
        >
          <div className="grid md:grid-cols-[40%_60%] items-stretch min-h-[520px] md:min-h-[560px]">
            {/* Left: portrait */}
            <div className="relative flex items-end justify-center md:justify-start pt-8 md:pt-0 px-4 md:pl-10 md:pr-0">
              <img
                src={portrait}
                alt="Ali Nur Hasan portrait"
                width={820}
                height={1120}
                className="relative block h-[360px] sm:h-[440px] md:h-[600px] lg:h-[680px] w-auto object-contain object-bottom drop-shadow-[0_30px_50px_rgba(0,0,0,0.55)]"
              />
            </div>

            {/* Right: content */}
            <motion.div
              className="relative px-6 md:px-10 lg:px-14 pb-10 md:pb-0 md:py-14 flex flex-col justify-center text-center md:text-left"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } },
              }}
            >
              <motion.span
                className="inline-block text-[0.7rem] md:text-xs font-bold tracking-[0.2em] uppercase text-primary mb-4"
                variants={{
                  hidden: { opacity: 0, y: reduce ? 0 : 12 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
                }}
              >
                {eyebrow}
              </motion.span>

              <motion.h1
                className="font-black leading-[1.05] mb-5 tracking-tight text-foreground"
                style={{ fontSize: "clamp(28px, 4vw, 54px)" }}
                variants={{
                  hidden: { opacity: 0, y: reduce ? 0 : 16 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
                }}
              >
                {headline}
              </motion.h1>

              {sub && (
                <motion.p
                  className="text-muted-foreground text-sm md:text-base mb-8 max-w-xl mx-auto md:mx-0 leading-relaxed"
                  variants={{
                    hidden: { opacity: 0, y: reduce ? 0 : 14 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease } },
                  }}
                >
                  {sub}
                </motion.p>
              )}

              <motion.div
                className="flex gap-3 items-center flex-wrap justify-center md:justify-start"
                variants={{
                  hidden: { opacity: 0, y: reduce ? 0 : 12 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
                }}
              >
                <motion.button
                  type="button"
                  onClick={openHireMe}
                  whileHover={reduce ? undefined : { y: -2 }}
                  whileTap={reduce ? undefined : { scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}
                  className="bg-gradient-gold text-primary-foreground px-7 py-[14px] rounded-full text-sm font-bold shadow-[0_10px_30px_-10px_color-mix(in_oklab,var(--primary)_60%,transparent)] hover:shadow-glow transition-shadow"
                >
                  {hero?.primary_cta_label || "Hire Me"}
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => {
                    const target = (hero?.secondary_cta_url || "#portfolio").replace(/^.*#/, "");
                    smoothScrollToId(target);
                  }}
                  whileHover={reduce ? undefined : { y: -2 }}
                  whileTap={reduce ? undefined : { scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}
                  className="bg-transparent border border-foreground/25 text-foreground px-7 py-[14px] rounded-full text-sm font-semibold hover:border-primary hover:text-primary transition-colors"
                >
                  {hero?.secondary_cta_label || "View Projects"}
                </motion.button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
