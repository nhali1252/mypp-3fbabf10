import { Link } from "@tanstack/react-router";
import { Check, ShieldCheck, Zap, Sparkles, ArrowRight, Cpu, LifeBuoy } from "lucide-react";

export function UnlockServicePricing() {
  const tiers = [
    {
      id: "fastboot-standard",
      title: "Fastboot Remote Assist",
      price: "$19",
      badge: "Standard",
      description: "Ideal for Google Pixel, Motorola, OnePlus, and Nothing devices with official fastboot unlock channels.",
      features: [
        "1-on-1 Remote session (AnyDesk / TeamViewer)",
        "USB Fastboot driver & Android SDK installation",
        "Safe device backup verification",
        "Official token generation & fastboot execution",
        "Complete post-unlock verification",
      ],
      popular: false,
    },
    {
      id: "hyperos-bypass",
      title: "Xiaomi HyperOS Token Bypass",
      price: "$39",
      badge: "Most Popular",
      description: "Direct server token injection for Xiaomi, Poco, and Redmi devices on HyperOS without the 30-day Community wait.",
      features: [
        "Bypasses Mi Community Level 5 requirement",
        "Bypasses 'Server Error 30001' quota limits",
        "Official authorized backend server token",
        "Instant unlock execution (No 168-hour timer)",
        "Keeps Widevine L1 & DRM intact on stock ROM",
        "Includes Global & China firmware models",
      ],
      popular: true,
    },
    {
      id: "edl-unbrick",
      title: "Qualcomm EDL & MTK Unbrick",
      price: "$49",
      badge: "Hardware Rescue",
      description: "Emergency Download (9008) mode and MediaTek BROM flashing for dead, bootlooping, or wiped devices.",
      features: [
        "Authorized VIP Qualcomm Firehose programmers",
        "MediaTek SLA/DA authentication sessions",
        "Revives black-screen hard bricks",
        "Partition table (GPT) reconstruction",
        "China to Global cross-region firmware flashing",
        "100% money-back guarantee if unrecoverable",
      ],
      popular: false,
    },
    {
      id: "root-integrity",
      title: "Root & Play Integrity Suite",
      price: "$29",
      badge: "Post-Unlock",
      description: "Complete setup of TWRP/OrangeFox custom recovery, KernelSU or Magisk, with banking app pass.",
      features: [
        "KernelSU or Magisk systemless installation",
        "Play Integrity spoofing (MEETS_DEVICE_INTEGRITY)",
        "Google Wallet, Banking & Netflix pass",
        "KnoxPatch integration for Samsung devices",
        "Ad-blocking & system debloating",
      ],
      popular: false,
    },
  ];

  return (
    <div className="w-full space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary uppercase tracking-widest">
          <Zap className="w-3.5 h-3.5" />
          Transparent Service Tiers
        </div>
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
          Professional Remote Unlock Services
        </h2>
        <p className="text-sm text-muted-foreground">
          No unlock, no charge. Guaranteed safe sessions handled directly by experienced mobile firmware engineers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiers.map((t) => (
          <div
            key={t.id}
            className={`relative rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 ${
              t.popular
                ? "bg-card border-2 border-primary shadow-glow"
                : "bg-card/70 border border-border hover:border-primary/40 backdrop-blur-md"
            }`}
          >
            {t.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-primary text-primary-foreground shadow-md">
                {t.badge}
              </span>
            )}

            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t.badge}
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-foreground mt-2">{t.title}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black text-foreground">{t.price}</span>
                <span className="text-xs text-muted-foreground">/ one-time session</span>
              </div>
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                {t.description}
              </p>

              <div className="mt-6 pt-5 border-t border-border space-y-2.5">
                <span className="text-xs font-bold text-foreground block">Included in session:</span>
                {t.features.map((f) => (
                  <div key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-4">
              <Link
                to="/booking"
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  t.popular
                    ? "bg-primary text-primary-foreground hover:shadow-glow"
                    : "bg-muted text-foreground hover:bg-primary hover:text-primary-foreground"
                }`}
              >
                Order This Service <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* GUARANTEE STRIP */}
      <div className="p-4 sm:p-6 rounded-2xl bg-muted/30 border border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
          <div>
            <span className="font-bold text-foreground block text-sm">100% Risk-Free Unlock Guarantee</span>
            <span className="text-muted-foreground">
              If your device hardware proves permanently locked or unrecoverable, you receive a full immediate refund.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right hidden md:block">
            <span className="font-bold text-foreground block">Remote Support</span>
            <span className="text-muted-foreground">AnyDesk / TeamViewer / UltraViewer</span>
          </div>
          <Link
            to="/contact"
            className="px-4 py-2 rounded-xl bg-background border border-border text-foreground font-semibold hover:border-primary transition-colors flex items-center gap-1.5"
          >
            <LifeBuoy className="w-3.5 h-3.5 text-primary" /> Free Diagnostics
          </Link>
        </div>
      </div>
    </div>
  );
}
