import portraitFallback from "@/assets/ali-portrait.png";
import { useHero } from "@/hooks/useContent";
import { motion, useReducedMotion } from "framer-motion";
import { useHireMe } from "./HireMeProvider";
import { smoothScrollToId } from "@/lib/smoothScroll";

export function Hero({ showHireMe = true }: { showHireMe?: boolean } = {}) {
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
      className="relative pt-40 md:pt-48 pb-10 md:pb-16 overflow-hidden bg-background"
    >
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 relative">
        {/* Ambient VFX: soft glow orbs behind the card */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-0 overflow-visible"
        >
          <div
            className="absolute -top-10 left-1/4 w-[420px] h-[420px] rounded-full blur-3xl opacity-40"
            style={{
              background:
                "radial-gradient(circle, color-mix(in oklab, var(--primary) 55%, transparent) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute top-20 right-0 w-[360px] h-[360px] rounded-full blur-3xl opacity-30"
            style={{
              background:
                "radial-gradient(circle, color-mix(in oklab, var(--accent, var(--primary)) 50%, transparent) 0%, transparent 70%)",
            }}
          />
        </div>

        {/* Large faded watermark name positioned BEHIND the portrait's head area */}
        <motion.div
          aria-hidden
          className="absolute left-1/2 -translate-x-1/2 top-6 md:top-4 font-black uppercase whitespace-nowrap pointer-events-none select-none leading-none tracking-[-0.04em] z-[5]"
          style={{
            fontSize: "clamp(44px, 10vw, 150px)",
            background:
              "linear-gradient(180deg, color-mix(in oklab, var(--primary) 35%, transparent) 0%, color-mix(in oklab, var(--watermark) 8%, transparent) 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: "0 2px 30px color-mix(in oklab, var(--primary) 20%, transparent)",
          }}
          initial={{ opacity: 0, y: reduce ? 0 : -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease, delay: 0.05 }}
        >
          ALI NUR HASAN
        </motion.div>

        {/* Premium dark rounded hero card */}
        <motion.div
          className="relative z-10 rounded-[24px] border border-white/[0.06] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)] backdrop-blur-sm"
          style={{
            background:
              "linear-gradient(180deg, color-mix(in oklab, var(--card) 96%, black) 0%, color-mix(in oklab, var(--card) 88%, black) 100%)",
          }}
          initial={{ opacity: 0, y: reduce ? 0 : 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease }}
        >
          {/* Subtle grain VFX overlay */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[24px] opacity-[0.04] mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
            }}
          />
          <div className="grid md:grid-cols-[40%_60%] items-stretch min-h-[380px] md:min-h-[420px] relative">
            {/* Left: portrait — overflows ABOVE the card so head pops out */}
            <div className="relative flex items-end justify-center md:justify-start px-4 md:pl-10 md:pr-0">
              <img
                src={portrait}
                alt="Ali Nur Hasan portrait"
                width={820}
                height={1120}
                className="relative z-20 block h-[440px] sm:h-[540px] md:h-[640px] lg:h-[720px] w-auto object-contain object-bottom -mt-40 md:-mt-48 lg:-mt-56 drop-shadow-[0_30px_50px_rgba(0,0,0,0.55)]"
              />
            </div>

            {/* Right: content */}
            <motion.div
              className="relative z-10 px-6 md:px-10 lg:px-14 pb-10 md:pb-0 md:py-10 flex flex-col justify-center text-center md:text-left"
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
                {showHireMe && (
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
                )}
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
