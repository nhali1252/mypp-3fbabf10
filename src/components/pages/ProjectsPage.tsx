import { motion } from "framer-motion";
import { Cpu, Terminal, ShieldCheck } from "lucide-react";
import { Footer } from "@/components/Footer";
import { PageQuote } from "@/components/PageQuote";
import { Hero3DText } from "@/components/Hero3DText";
import { DeviceMatrixTable } from "@/components/bootloader/DeviceMatrixTable";

export function ProjectsPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* HERO */}
      <section className="relative px-4 sm:px-6 md:px-10 lg:px-12 pt-8 sm:pt-14 md:pt-20 lg:pt-24 pb-8 sm:pb-12 overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[min(820px,90vw)] h-[420px] sm:h-[520px] rounded-full blur-[120px] sm:blur-[140px] opacity-50"
          style={{
            background:
              "radial-gradient(closest-side, color-mix(in oklab, var(--primary) 60%, transparent), transparent)",
          }}
        />
        <div className="relative max-w-[1100px] xl:max-w-[1280px] mx-auto text-center">
          <motion.span
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-border bg-card/60 backdrop-blur text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.22em] sm:tracking-[0.25em] text-primary"
          >
            <Cpu className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Hardware Compatibility Database
          </motion.span>
          <h1
            className="font-black tracking-tight leading-[1.02] mt-4 sm:mt-5 text-3d text-3d-pop"
            style={{ fontSize: "clamp(30px, 6.4vw, 84px)" }}
          >
            <Hero3DText as="span" text="Supported Devices " delay={0.1} stagger={0.08} />
            <Hero3DText
              as="span"
              text="& Matrix"
              className="font-serif-display italic font-medium text-primary"
              delay={0.35}
              stagger={0.08}
            />
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-muted-foreground mt-4 sm:mt-5 max-w-2xl mx-auto text-[13.5px] sm:text-base leading-relaxed px-2 sm:px-0"
          >
            Comprehensive verified list of mobile devices: see which brands and chipsets support instant fastboot unlock, authorized Xiaomi HyperOS token bypass, EDL 9008 recovery, or are permanently carrier-locked.
          </motion.p>
        </div>
      </section>

      {/* MATRIX TABLE SECTION */}
      <section className="px-4 sm:px-6 md:px-10 lg:px-12 pb-16 sm:pb-24">
        <div className="max-w-[1280px] mx-auto">
          <DeviceMatrixTable />
        </div>
      </section>

      <PageQuote slug="projects" />
      <Footer />
    </div>
  );
}
