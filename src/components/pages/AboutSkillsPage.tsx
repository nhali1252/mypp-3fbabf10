import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Cpu, Terminal, ShieldCheck, Sparkles, BookOpen, Layers } from "lucide-react";
import { Footer } from "@/components/Footer";
import { PageQuote } from "@/components/PageQuote";
import { Hero3DText } from "@/components/Hero3DText";
import { BootloaderKnowledgeBase } from "@/components/bootloader/BootloaderKnowledgeBase";

export function AboutSkillsPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Top navigation */}
      <header className="px-5 sm:px-6 md:px-10 pt-7 md:pt-10">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between gap-4">
          <Link
            to="/"
            className="text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Hub
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/projects"
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Supported Devices
            </Link>
            <span className="text-border">•</span>
            <Link
              to="/services"
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Services
            </Link>
            <span className="text-border">•</span>
            <Link
              to="/booking"
              className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold hover:shadow-glow transition-all"
            >
              Order Unlock
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative px-4 sm:px-6 md:px-10 lg:px-12 pt-8 sm:pt-14 md:pt-16 pb-10 sm:pb-14 overflow-hidden">
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
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/60 backdrop-blur text-xs font-bold uppercase tracking-[0.25em] text-primary"
          >
            <BookOpen className="w-3.5 h-3.5" /> Silicon & Firmware Knowledge Base
          </motion.span>
          <h1
            className="font-black tracking-tight leading-[1.02] mt-4 sm:mt-5 text-3d text-3d-pop"
            style={{ fontSize: "clamp(30px, 6.4vw, 84px)" }}
          >
            <Hero3DText as="span" text="Bootloader " delay={0.1} stagger={0.08} />
            <Hero3DText
              as="span"
              text="Architecture"
              className="font-serif-display italic font-medium text-primary"
              delay={0.35}
              stagger={0.08}
            />
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-muted-foreground mt-4 sm:mt-5 max-w-3xl mx-auto text-sm sm:text-base leading-relaxed"
          >
            A deep-dive technical manual on the Android boot chain from silicon Mask ROM to Linux kernel, the cryptographic mechanisms behind AVB 2.0, why vendors lock bootloaders, and how to maintain Play Integrity & Widevine DRM post-unlock.
          </motion.p>
        </div>
      </section>

      {/* KNOWLEDGE BASE COMPONENT */}
      <section className="px-4 sm:px-6 md:px-10 lg:px-12 pb-16 sm:pb-24">
        <div className="max-w-[1280px] mx-auto">
          <BootloaderKnowledgeBase />
        </div>
      </section>

      <PageQuote slug="about-and-skills" />
      <Footer />
    </div>
  );
}
