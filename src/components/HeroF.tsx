import portraitFallback from "@/assets/ali-portrait.png";
import { useHero } from "@/hooks/useContent";
import { motion, useReducedMotion } from "framer-motion";
import { useHireMe } from "./HireMeProvider";
import { smoothScrollToId } from "@/lib/smoothScroll";

export function HeroF() {
  const { data: hero } = useHero("F");
  const reduce = useReducedMotion();
  const { openHireMe } = useHireMe();

  const portrait =
    hero?.portrait_url && !hero.portrait_url.startsWith("/src/")
      ? hero.portrait_url
      : portraitFallback;

  const headline =
    hero?.headline ?? "Creative Designer crafting bold brands and digital experiences";
  const sub =
    hero?.subheadline ??
    "I help brands stand out with modern visual design, branding systems, and AI-assisted creative workflows.";
  const eyebrow =
    hero?.eyebrow ?? "Graphic Designer • Branding • Canva • Adobe • AI";

  const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

  return (
    <section
      id="home"
      className="relative pt-28 md:pt-36 pb-12 md:pb-20 bg-background overflow-hidden"
    >
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 relative">
        {/* Premium centered dark hero card */}
        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease }}
          className="relative rounded-[24px] overflow-hidden border border-white/[0.06] shadow-[0_40px_100px_-30px_rgba(0,0,0,0.75)]"
          style={{
            background:
              "linear-gradient(180deg, oklch(0.16 0.01 270) 0%, oklch(0.10 0.01 270) 100%)",
          }}
        >
          {/* Watermark name behind portrait */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none select-none flex items-center justify-start overflow-hidden"
          >
            <span
              className="font-black uppercase whitespace-nowrap leading-none tracking-[-0.04em] -translate-y-4 md:-translate-y-6 -translate-x-4 md:translate-x-0"
              style={{
                fontSize: "clamp(80px, 16vw, 240px)",
                color: "transparent",
                WebkitTextStroke:
                  "1px color-mix(in oklab, white 8%, transparent)",
                background:
                  "linear-gradient(180deg, color-mix(in oklab, white 6%, transparent) 0%, color-mix(in oklab, white 1%, transparent) 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
              }}
            >
              ALI NUR HASAN
            </span>
          </div>

          {/* Subtle ambient glow */}
          <div
            aria-hidden
            className="absolute top-1/2 right-0 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-3xl opacity-25 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, color-mix(in oklab, var(--primary) 40%, transparent) 0%, transparent 70%)",
            }}
          />

          <div className="relative grid md:grid-cols-[40%_60%] items-center gap-6 md:gap-4 px-6 md:px-10 lg:px-14 pt-10 md:pt-0 pb-10 md:pb-0 min-h-[460px] md:min-h-[520px]">
            {/* Left: portrait, anchored to bottom */}
            <div className="relative flex items-end justify-center md:justify-start order-1 md:order-1">
              <motion.img
                src={portrait}
                alt="Ali Nur Hasan portrait"
                width={820}
                height={1120}
                initial={{ opacity: 0, y: reduce ? 0 : 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, ease, delay: 0.15 }}
                className="relative z-10 block h-[360px] sm:h-[440px] md:h-[520px] lg:h-[580px] w-auto object-contain object-bottom drop-shadow-[0_30px_50px_rgba(0,0,0,0.55)]"
              />
            </div>

            {/* Right: content */}
            <motion.div
              className="relative z-10 flex flex-col justify-center text-center md:text-left order-2 md:order-2 md:py-12"
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
                className="font-black leading-[1.05] mb-5 tracking-tight text-white"
                style={{ fontSize: "clamp(30px, 4.4vw, 58px)" }}
                variants={{
                  hidden: { opacity: 0, y: reduce ? 0 : 16 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
                }}
              >
                {headline}
              </motion.h1>

              {sub && (
                <motion.p
                  className="text-white/70 text-sm md:text-base mb-8 max-w-xl mx-auto md:mx-0 leading-relaxed"
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
                  className="bg-primary text-primary-foreground px-7 py-[14px] rounded-full text-sm font-bold shadow-[0_10px_30px_-10px_color-mix(in_oklab,var(--primary)_60%,transparent)] hover:shadow-glow transition-shadow"
                >
                  {hero?.primary_cta_label || "Hire Me"}
                </motion.button>
                {(() => {
                  const secondaryLabel = (hero?.secondary_cta_label || "View Projects").trim();
                  const isDisabledLabel = /^(discover|learn)\s+more$/i.test(secondaryLabel);
                  if (isDisabledLabel) return null;
                  return (
                    <motion.button
                      type="button"
                      onClick={() => {
                        const target = (hero?.secondary_cta_url || "#portfolio").replace(/^.*#/, "");
                        smoothScrollToId(target);
                      }}
                      whileHover={reduce ? undefined : { y: -2 }}
                      whileTap={reduce ? undefined : { scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 400, damping: 22 }}
                      className="bg-transparent border border-white/25 text-white px-7 py-[14px] rounded-full text-sm font-semibold hover:border-primary hover:text-primary transition-colors"
                    >
                      {secondaryLabel}
                    </motion.button>
                  );
                })()}
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
