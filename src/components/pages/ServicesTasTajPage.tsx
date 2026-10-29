import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  ArrowRight, 
  Cpu, 
  Zap, 
  ShieldCheck, 
  Terminal, 
  Key, 
  RefreshCcw 
} from "lucide-react";
import { Footer } from "@/components/Footer";
import { PageQuote } from "@/components/PageQuote";
import { Hero3DText } from "@/components/Hero3DText";
import { UnlockServicePricing } from "@/components/bootloader/UnlockServicePricing";

export function ServicesTasTajPage() {
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
              to="/about-and-skills"
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Knowledge Base
            </Link>
            <span className="text-border">•</span>
            <Link
              to="/booking"
              className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold hover:shadow-glow transition-all"
            >
              Book Session
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative px-5 sm:px-6 md:px-10 pt-10 sm:pt-14 md:pt-16 pb-10 overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[820px] h-[520px] rounded-full blur-[140px] opacity-50"
          style={{
            background:
              "radial-gradient(closest-side, color-mix(in oklab, var(--primary) 60%, transparent), transparent)",
          }}
        />
        <div className="relative max-w-[1100px] mx-auto text-center">
          <motion.span
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/60 backdrop-blur text-[11px] font-bold uppercase tracking-[0.25em] text-primary"
          >
            <Zap className="w-3.5 h-3.5" /> Remote Engineering Services
          </motion.span>
          <h1
            className="font-black tracking-tight leading-[1.02] mt-5 text-3d text-3d-pop"
            style={{ fontSize: "clamp(34px, 6.4vw, 78px)" }}
          >
            <Hero3DText as="span" text="Bootloader " delay={0.1} stagger={0.07} />
            <Hero3DText
              as="span"
              text="Unlocking & Unbrick"
              className="font-serif-display italic font-medium text-primary"
              delay={0.35}
              stagger={0.07}
            />
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-muted-foreground mt-4 sm:mt-5 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed"
          >
            Guaranteed remote sessions for Xiaomi HyperOS server token bypass, Qualcomm 9008 EDL dead boot unbrick, Samsung Global root setup, and custom recovery installations.
          </motion.p>
        </div>
      </section>

      {/* SERVICE TIERS */}
      <section className="px-5 sm:px-6 md:px-10 pb-16 sm:pb-24">
        <div className="max-w-[1280px] mx-auto">
          <UnlockServicePricing />
        </div>
      </section>

      {/* DETAILED SERVICE WORKFLOW */}
      <section className="px-5 sm:px-6 md:px-10 pb-16">
        <div className="max-w-[1280px] mx-auto bg-card/50 border border-border rounded-2xl p-6 sm:p-10 backdrop-blur-md">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h3 className="text-2xl font-bold text-foreground">How A Remote Session Works</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              You stay in full control. We connect securely through AnyDesk or TeamViewer while you watch the terminal live on your monitor.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl bg-background/60 border border-border/80 space-y-2">
              <span className="text-xs font-mono font-bold text-primary">01 / Pre-Check</span>
              <h4 className="font-bold text-foreground text-sm">Device & Driver Diagnostics</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We verify device serial, boot slot, OEM Unlock toggle, and install official Google / Qualcomm / MediaTek USB drivers.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-background/60 border border-border/80 space-y-2">
              <span className="text-xs font-mono font-bold text-primary">02 / Token Auth</span>
              <h4 className="font-bold text-foreground text-sm">Authorized Server Handshake</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                For HyperOS or EDL devices, we authenticate directly with manufacturer servers to generate the cryptographic token.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-background/60 border border-border/80 space-y-2">
              <span className="text-xs font-mono font-bold text-primary">03 / Execution</span>
              <h4 className="font-bold text-foreground text-sm">Fastboot & Partition Write</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We execute verified commands via Fastboot CLI or Firehose programmer, verifying CRC32 checksums for every byte.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-background/60 border border-border/80 space-y-2">
              <span className="text-xs font-mono font-bold text-primary">04 / Verification</span>
              <h4 className="font-bold text-foreground text-sm">Post-Unlock Boot & Pass</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We confirm the device boots into OS successfully, verify Play Integrity status, and deliver complete documentation.
              </p>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/booking"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground text-sm font-bold hover:shadow-glow transition-all"
            >
              Schedule Your Remote Unlock Session <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <PageQuote slug="services" />
      <Footer />
    </div>
  );
}
