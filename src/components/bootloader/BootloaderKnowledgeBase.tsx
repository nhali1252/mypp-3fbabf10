import { useState } from "react";
import { 
  ShieldCheck, 
  Cpu, 
  Terminal, 
  AlertTriangle, 
  HelpCircle, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  Flame, 
  Lock, 
  Unlock, 
  Key,
  Zap,
  Code2,
  Binary
} from "lucide-react";
import { 
  BOOT_STAGES, 
  BRAND_LOCK_DETAILS, 
  AVB_STATES, 
  FASTBOOT_COMMANDS, 
  FAQS,
  EXPLOIT_PATHS
} from "@/data/bootloaderKnowledge";

export function BootloaderKnowledgeBase() {
  const [activeTab, setActiveTab] = useState<"exploits" | "stages" | "brands" | "avb" | "commands" | "faqs">("exploits");
  const [activeBrandIndex, setActiveBrandIndex] = useState(0);
  const [activeExploitIndex, setActiveExploitIndex] = useState(0);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(text);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="w-full space-y-10">
      {/* SECTION HEADER */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary uppercase tracking-widest">
          <Cpu className="w-3.5 h-3.5" />
          Technical Engineering Hub
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground">
          Deep Architecture: Bootloader & Unlock
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
          Understanding the silicon-level boot chain, cryptographic Chain of Trust (AVB 2.0), OEM security models, and post-unlock integrity realities.
        </p>
      </div>

      {/* TOP NAVIGATION TABS */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setActiveTab("exploits")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === "exploits"
              ? "bg-primary text-primary-foreground shadow-glow"
              : "bg-card border border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <Zap className="w-4 h-4 text-amber-300" />
          Exploit & ABL Mechanics
        </button>

        <button
          onClick={() => setActiveTab("stages")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === "stages"
              ? "bg-primary text-primary-foreground shadow-glow"
              : "bg-card border border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <Layers className="w-4 h-4" />
          The Boot Chain (PBL to Kernel)
        </button>

        <button
          onClick={() => setActiveTab("brands")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === "brands"
              ? "bg-primary text-primary-foreground shadow-glow"
              : "bg-card border border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <Lock className="w-4 h-4" />
          Brand Lock Protocols
        </button>

        <button
          onClick={() => setActiveTab("avb")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === "avb"
              ? "bg-primary text-primary-foreground shadow-glow"
              : "bg-card border border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          AVB 2.0 States
        </button>

        <button
          onClick={() => setActiveTab("commands")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === "commands"
              ? "bg-primary text-primary-foreground shadow-glow"
              : "bg-card border border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <Terminal className="w-4 h-4" />
          CLI Command Guide
        </button>

        <button
          onClick={() => setActiveTab("faqs")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === "faqs"
              ? "bg-primary text-primary-foreground shadow-glow"
              : "bg-card border border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          Technical FAQ
        </button>
      </div>

      {/* TAB CONTENT: 0. EXPLOIT ARCHITECTURES (ALI EDL & CUSTOM ABL) */}
      {activeTab === "exploits" && (
        <div className="bg-card/70 border border-border rounded-2xl p-6 sm:p-8 backdrop-blur-xl space-y-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-2">
              <Zap className="w-3 h-3" />
              Ali EDL Flasher & One-Click Unlocker Architecture
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-foreground flex items-center gap-2">
              <Binary className="w-5 h-5 text-primary" />
              Proprietary Exploit Paths & Custom ABL Injections
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              How our automated engineering toolchain bypasses the 2024–2026 HyperOS Mi Community Level 5 restrictions, daily quota limits, and 30-day waiting periods across all Qualcomm & MediaTek chipsets.
            </p>
          </div>

          {/* EXPLOIT SELECTOR TABS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {EXPLOIT_PATHS.map((ep, idx) => (
              <button
                key={ep.id}
                onClick={() => setActiveExploitIndex(idx)}
                className={`p-4 rounded-xl text-left border transition-all ${
                  activeExploitIndex === idx
                    ? "bg-primary/10 border-primary text-foreground shadow-sm ring-1 ring-primary/40"
                    : "bg-background/60 border-border text-muted-foreground hover:text-foreground hover:bg-background/90"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono uppercase font-bold text-primary">
                    Path {idx + 1}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {ep.id}
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-foreground line-clamp-1">{ep.title}</h4>
                <p className="text-[11px] text-muted-foreground mt-1 truncate">{ep.targetFirmware}</p>
              </button>
            ))}
          </div>

          {/* ACTIVE EXPLOIT DETAILS */}
          {EXPLOIT_PATHS[activeExploitIndex] && (
            <div className="bg-background/80 border border-border rounded-xl p-5 sm:p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
                <div>
                  <h4 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-primary" />
                    {EXPLOIT_PATHS[activeExploitIndex].title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                    Target: {EXPLOIT_PATHS[activeExploitIndex].targetFirmware}
                  </p>
                </div>
                <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-mono font-semibold bg-primary/15 text-primary border border-primary/30">
                  100% Tested & Verified
                </span>
              </div>

              {/* METHODOLOGY CARD */}
              <div className="p-4 rounded-xl bg-muted/40 border border-border/80 text-xs sm:text-sm space-y-1">
                <span className="font-bold text-foreground block text-xs uppercase tracking-wider text-primary">
                  Core Cryptographic Exploit Concept:
                </span>
                <p className="text-muted-foreground leading-relaxed text-xs sm:text-sm">
                  {EXPLOIT_PATHS[activeExploitIndex].methodology}
                </p>
              </div>

              {/* STEP BY STEP EXECUTION */}
              <div className="space-y-3">
                <span className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-primary" />
                  Terminal Execution Sequence:
                </span>
                <div className="space-y-2">
                  {EXPLOIT_PATHS[activeExploitIndex].stepByStep.map((step, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-3 rounded-lg bg-card border border-border/70 font-mono text-xs flex items-start gap-3 hover:border-primary/40 transition-colors"
                    >
                      <span className="text-primary font-bold shrink-0">{sIdx + 1}.</span>
                      <span className="text-foreground/90 select-all leading-relaxed break-all">
                        {step.replace(/^\d+\.\s*/, "")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SAFETY MECHANISM */}
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Fail-Safe & Reversibility Mechanism:
                </span>
                <p className="text-muted-foreground leading-relaxed">
                  {EXPLOIT_PATHS[activeExploitIndex].safetyMechanism}
                </p>
              </div>

              {/* GHOSTAUTH & ALI API NOTICE */}
              <div className="p-3.5 rounded-lg bg-primary/5 border border-primary/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="text-muted-foreground">
                  <span className="font-bold text-foreground">Backend Authentication Handshake: </span>
                  Authorized via <code className="font-mono text-primary">https://api.alii.uk</code> & VIP Telegram dispatch.
                </div>
                <span className="text-[11px] font-mono text-primary font-semibold">
                  EDL Flasher Engine v2026.1
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 1. BOOT CHAIN STAGES */}
      {activeTab === "stages" && (
        <div className="bg-card/70 border border-border rounded-2xl p-6 sm:p-8 backdrop-blur-xl space-y-8">
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-foreground flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              The Hardware Silicon Boot Sequence
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Before Android renders a single pixel or boots into Android OS, the CPU undergoes a 5-tier cryptographic handshake.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {BOOT_STAGES.map((s, idx) => (
              <div
                key={s.stage}
                className="relative pl-6 sm:pl-8 border-l-2 border-primary/40 pb-6 last:pb-0 group"
              >
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary border-4 border-background group-hover:scale-125 transition-transform" />
                
                <div className="bg-background/60 border border-border/80 rounded-xl p-4 sm:p-5 hover:border-primary/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                    <span className="text-xs font-mono font-bold text-primary tracking-widest uppercase">
                      {s.stage}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
                      {s.location}
                    </span>
                  </div>

                  <h4 className="text-base sm:text-lg font-bold text-foreground">{s.name}</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">
                    {s.description}
                  </p>

                  <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/10 text-xs">
                    <span className="font-semibold text-primary block mb-0.5">Cryptographic Security Role:</span>
                    <span className="text-muted-foreground">{s.roleInSecurity}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. BRAND LOCK PROTOCOLS */}
      {activeTab === "brands" && (
        <div className="bg-card/70 border border-border rounded-2xl p-6 sm:p-8 backdrop-blur-xl space-y-6">
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-foreground flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              OEM-Specific Lock Mechanics & Bypass Protocols
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Every major manufacturer implements custom security subsystems to prevent third-party modifications.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {BRAND_LOCK_DETAILS.map((b, idx) => (
              <button
                key={b.brand}
                onClick={() => setActiveBrandIndex(idx)}
                className={`p-3 rounded-xl text-left border text-xs font-bold transition-all ${
                  activeBrandIndex === idx
                    ? "bg-primary text-primary-foreground border-primary shadow-glow"
                    : "bg-background border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {b.brand.split(" ")[0]}
              </button>
            ))}
          </div>

          {/* ACTIVE BRAND CARD */}
          {BRAND_LOCK_DETAILS[activeBrandIndex] && (
            <div className="bg-background/80 border border-border rounded-xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h4 className="text-lg font-extrabold text-foreground">
                  {BRAND_LOCK_DETAILS[activeBrandIndex].brand}
                </h4>
                <span className="text-xs font-mono text-primary font-semibold">
                  {BRAND_LOCK_DETAILS[activeBrandIndex].lockType}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-lg bg-muted/40 border border-border/60">
                  <span className="font-bold text-foreground block mb-1">Unlock Handshake Protocol:</span>
                  <span className="text-muted-foreground leading-relaxed">
                    {BRAND_LOCK_DETAILS[activeBrandIndex].unlockProtocol}
                  </span>
                </div>

                <div className="p-3.5 rounded-lg bg-muted/40 border border-border/60">
                  <span className="font-bold text-foreground block mb-1">Hardware / Chipset Security:</span>
                  <span className="text-muted-foreground leading-relaxed">
                    {BRAND_LOCK_DETAILS[activeBrandIndex].hardwareSecurity}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs">
                <span className="font-bold text-amber-400 flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-4 h-4" /> Real-World Obstacles & Pitfalls:
                </span>
                <p className="text-muted-foreground leading-relaxed">
                  {BRAND_LOCK_DETAILS[activeBrandIndex].pitfalls}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 text-xs">
                <span className="font-bold text-primary flex items-center gap-1.5 mb-1">
                  <Key className="w-4 h-4" /> FastbootDesk Engineering Solution:
                </span>
                <p className="text-muted-foreground leading-relaxed">
                  {BRAND_LOCK_DETAILS[activeBrandIndex].ourSolution}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 3. AVB 2.0 STATES */}
      {activeTab === "avb" && (
        <div className="bg-card/70 border border-border rounded-2xl p-6 sm:p-8 backdrop-blur-xl space-y-6">
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Android Verified Boot (AVB 2.0) Color States
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Google AVB 2.0 uses cryptographic hash trees in the <code className="text-primary font-mono">vbmeta</code> partition to assign a trust state to the phone during boot.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {AVB_STATES.map((state) => (
              <div
                key={state.state}
                className="bg-background/70 border border-border rounded-xl p-5 space-y-2 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        state.color === "emerald"
                          ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]"
                          : state.color === "amber"
                          ? "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.6)]"
                          : state.color === "yellow"
                          ? "bg-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.6)]"
                          : "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]"
                      }`}
                    />
                    {state.state}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    {state.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed pt-2">
                  {state.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground space-y-2">
            <h4 className="font-bold text-foreground flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-primary" />
              Play Integrity & Banking App Compatibility Guide:
            </h4>
            <p>
              When a device is in <strong className="text-foreground">Orange State</strong>, Google Play Integrity detects the unlocked bootloader and reports:
            </p>
            <div className="font-mono text-[11px] bg-background p-3 rounded-lg border border-border space-y-1">
              <div className="text-rose-400">MEETS_STRONG_INTEGRITY: false (Hardware Key Attestation)</div>
              <div className="text-rose-400">MEETS_DEVICE_INTEGRITY: false (Bootloader unlocked)</div>
              <div className="text-emerald-400">MEETS_BASIC_INTEGRITY: true (Software APK integrity)</div>
            </div>
            <p>
              Our rooting & recovery setup installs kernel-space hooks (<strong className="text-foreground">KernelSU / APatch / Zygisk</strong>) that spoof the bootloader state back to genuine, restoring <strong className="text-emerald-400">MEETS_DEVICE_INTEGRITY: true</strong> so Google Wallet, banking apps, and Netflix stream in high resolution.
            </p>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. COMMANDS CHEAT SHEET */}
      {activeTab === "commands" && (
        <div className="bg-card/70 border border-border rounded-2xl p-6 sm:p-8 backdrop-blur-xl space-y-6">
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-foreground flex items-center gap-2">
              <Terminal className="w-5 h-5 text-primary" />
              Fastboot & ADB Developer Terminal Reference
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Verified commands for querying device serials, boot slots, partition locks, and executing verified unlocking.
            </p>
          </div>

          <div className="space-y-3">
            {FASTBOOT_COMMANDS.map((c) => (
              <div
                key={c.cmd}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-background/80 border border-border hover:border-primary/50 transition-colors font-mono"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-primary font-bold text-xs select-all">{c.cmd}</span>
                  </div>
                  <p className="text-[11px] font-sans text-muted-foreground">{c.desc}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(c.cmd)}
                  className="self-start sm:self-auto inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted text-foreground text-xs hover:bg-primary hover:text-primary-foreground transition-all shrink-0"
                >
                  {copiedCmd === c.cmd ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 5. FAQS */}
      {activeTab === "faqs" && (
        <div className="bg-card/70 border border-border rounded-2xl p-6 sm:p-8 backdrop-blur-xl space-y-6">
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-foreground flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              Technical Frequently Asked Questions
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Clear, honest answers regarding warranty, banking safety, Knox flags, and unbricking.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = expandedFaq === idx;
              return (
                <div
                  key={faq.q}
                  className="border border-border/80 rounded-xl bg-background/60 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setExpandedFaq(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">
                        {faq.category}
                      </span>
                      <span className="text-sm sm:text-base font-bold text-foreground">{faq.q}</span>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="p-4 sm:p-5 pt-0 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/40">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
