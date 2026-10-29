import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Search, CheckCircle2, Clock, AlertTriangle, XCircle, Cpu, ShieldAlert, Sparkles, ArrowRight } from "lucide-react";
import { SUPPORTED_DEVICES, type DeviceEntry, type UnlockStatus } from "@/data/bootloaderDevices";

export function DeviceCompatibilityChecker() {
  const [query, setQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string>("All");

  const brands = useMemo(() => {
    const list = Array.from(new Set(SUPPORTED_DEVICES.map((d) => d.brand)));
    return ["All", ...list];
  }, []);

  const results = useMemo(() => {
    return SUPPORTED_DEVICES.filter((d) => {
      const matchBrand = selectedBrand === "All" || d.brand === selectedBrand;
      const q = query.toLowerCase().trim();
      if (!q) return matchBrand;
      const matchText =
        d.model.toLowerCase().includes(q) ||
        d.codename.toLowerCase().includes(q) ||
        d.chipset.toLowerCase().includes(q) ||
        d.brand.toLowerCase().includes(q);
      return matchBrand && matchText;
    });
  }, [query, selectedBrand]);

  const getStatusBadge = (status: UnlockStatus, label: string) => {
    switch (status) {
      case "supported_instant":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {label}
          </span>
        );
      case "supported_wait":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" />
            {label}
          </span>
        );
      case "supported_hardware":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            {label}
          </span>
        );
      case "not_supported":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" />
            {label}
          </span>
        );
    }
  };

  return (
    <div className="w-full bg-card/60 backdrop-blur-xl border border-border rounded-2xl p-5 sm:p-7 md:p-8 shadow-2xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Live Hardware Verification Engine
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Check Device Unlock Compatibility
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Search your phone model, chipset, or codename to instantly check bootloader unlock feasibility.
          </p>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="space-y-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type your model (e.g. S24 Ultra, Xiaomi 14, Pixel 8, Poco F5, SM-S928B)..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground outline-none text-sm transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>

        {/* Brand Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {brands.map((b) => (
            <button
              key={b}
              onClick={() => setSelectedBrand(b)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedBrand === b
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* RESULTS GRID */}
      <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
        {results.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-xl border border-dashed border-border bg-muted/20">
            <AlertTriangle className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-60" />
            <h4 className="font-semibold text-foreground text-base">No exact model match found</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              We support custom remote EDL, Fastboot, and MTK sessions for unlisted devices as well. Contact our engineering team for free device verification.
            </p>
            <Link
              to="/booking"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:shadow-lg transition-all"
            >
              Inquire Custom Unlock <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          results.map((device: DeviceEntry) => (
            <div
              key={device.id}
              className="p-4 sm:p-5 rounded-xl border border-border/80 bg-background/50 hover:bg-background/80 hover:border-primary/40 transition-all duration-200"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {device.brand}
                    </span>
                    <span className="text-border">•</span>
                    <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {device.codename}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mt-1">{device.model}</h3>
                </div>
                <div>{getStatusBadge(device.status, device.statusLabel)}</div>
              </div>

              {/* TECHNICAL METRICS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4 text-xs">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
                  <Cpu className="w-4 h-4 text-primary shrink-0" />
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">SoC / Processor</span>
                    <span className="font-semibold text-foreground">{device.chipset}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
                  <Clock className="w-4 h-4 text-primary shrink-0" />
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Est. Completion</span>
                    <span className="font-semibold text-foreground">{device.timeEstimate}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Data / Security</span>
                    <span className="font-semibold text-foreground">
                      {device.dataLoss ? "Wipes Storage" : "No Wipe"}
                    </span>
                  </div>
                </div>
              </div>

              {/* NOTES */}
              <div className="mt-3 text-xs text-muted-foreground bg-muted/20 p-2.5 rounded-lg border border-border/40">
                <p>
                  <strong className="text-foreground">Protocol:</strong> {device.unlockMethod}
                </p>
                <p className="mt-1">
                  <strong className="text-foreground">Technical Note:</strong> {device.notes}
                </p>
                <p className="mt-1 text-[11px] text-amber-500/90 font-medium">
                  {device.securityImpact}
                </p>
              </div>

              {/* ACTION BUTTON */}
              <div className="mt-3.5 flex items-center justify-between gap-3 pt-2 border-t border-border/40">
                <span className="text-[11px] text-muted-foreground">
                  Regions: <strong className="text-foreground">{device.regionsSupported}</strong>
                </span>

                {device.status !== "not_supported" ? (
                  <Link
                    to="/booking"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:shadow-glow transition-all"
                  >
                    Unlock Device <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <span className="text-xs text-rose-400 font-medium">
                    Permanent Hardware Carrier Lock
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>Displaying {results.length} verified mobile device configurations</span>
        <Link to="/projects" className="text-primary hover:underline font-semibold inline-flex items-center gap-1">
          Explore Complete 60+ Device Matrix <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
