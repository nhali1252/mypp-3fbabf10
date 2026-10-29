import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  ArrowRight, 
  Filter, 
  Cpu, 
  Globe, 
  ShieldAlert, 
  Sparkles 
} from "lucide-react";
import { SUPPORTED_DEVICES, BRAND_SUMMARY, type DeviceEntry, type UnlockStatus } from "@/data/bootloaderDevices";

export function DeviceMatrixTable() {
  const [search, setSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [selectedChipset, setSelectedChipset] = useState<string>("All");

  const brands = useMemo(() => ["All", ...Array.from(new Set(SUPPORTED_DEVICES.map((d) => d.brand)))], []);
  const chipsets = useMemo(() => ["All", "Qualcomm", "MediaTek", "Exynos", "Tensor", "Kirin"], []);

  const filtered = useMemo(() => {
    return SUPPORTED_DEVICES.filter((d) => {
      const matchBrand = selectedBrand === "All" || d.brand === selectedBrand;
      const matchStatus = selectedStatus === "All" || d.status === selectedStatus;
      const matchChip = selectedChipset === "All" || d.chipsetType === selectedChipset;
      const q = search.toLowerCase().trim();
      const matchText =
        !q ||
        d.model.toLowerCase().includes(q) ||
        d.codename.toLowerCase().includes(q) ||
        d.chipset.toLowerCase().includes(q) ||
        d.notes.toLowerCase().includes(q);

      return matchBrand && matchStatus && matchChip && matchText;
    });
  }, [search, selectedBrand, selectedStatus, selectedChipset]);

  const renderBadge = (status: UnlockStatus, label: string) => {
    switch (status) {
      case "supported_instant":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
            <CheckCircle2 className="w-3 h-3" />
            {label}
          </span>
        );
      case "supported_wait":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 whitespace-nowrap">
            <Clock className="w-3 h-3" />
            {label}
          </span>
        );
      case "supported_hardware":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30 whitespace-nowrap">
            <AlertTriangle className="w-3 h-3" />
            {label}
          </span>
        );
      case "not_supported":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 whitespace-nowrap">
            <XCircle className="w-3 h-3" />
            {label}
          </span>
        );
    }
  };

  return (
    <div className="w-full space-y-8">
      {/* BRAND SUMMARY STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {BRAND_SUMMARY.slice(0, 5).map((b) => (
          <div
            key={b.brand}
            onClick={() => setSelectedBrand(b.brand.split(" ")[0])}
            className="cursor-pointer p-4 rounded-xl bg-card/60 border border-border hover:border-primary/50 transition-all"
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-bold text-foreground">{b.brand}</span>
              <span className="font-mono text-primary font-semibold">{b.total} verified</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[11px]">
              <span className="text-emerald-400 font-semibold">{b.instant} Instant</span>
              <span className="text-border">•</span>
              <span className="text-amber-400 font-semibold">{b.wait} Bypass</span>
              {b.locked > 0 && (
                <>
                  <span className="text-border">•</span>
                  <span className="text-rose-400 font-semibold">{b.locked} Locked</span>
                </>
              )}
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground truncate">{b.note}</p>
          </div>
        ))}
      </div>

      {/* FILTER CONTROLS */}
      <div className="p-5 rounded-2xl bg-card/70 border border-border space-y-4 backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search model, codename (e.g. marble, husky, fuxi), or chipset..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs sm:text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Status filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-xl bg-background border border-border text-foreground outline-none text-xs"
            >
              <option value="All">All Unlock Statuses</option>
              <option value="supported_instant">Instant / Fastboot</option>
              <option value="supported_wait">Wait Period / Bypass</option>
              <option value="supported_hardware">Hardware Test-Point</option>
              <option value="not_supported">Carrier Locked</option>
            </select>

            {/* Chipset filter */}
            <select
              value={selectedChipset}
              onChange={(e) => setSelectedChipset(e.target.value)}
              className="px-3 py-2 rounded-xl bg-background border border-border text-foreground outline-none text-xs"
            >
              {chipsets.map((c) => (
                <option key={c} value={c}>
                  {c === "All" ? "All Chipset Architectures" : c}
                </option>
              ))}
            </select>

            {(search || selectedBrand !== "All" || selectedStatus !== "All" || selectedChipset !== "All") && (
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedBrand("All");
                  setSelectedStatus("All");
                  setSelectedChipset("All");
                }}
                className="px-3 py-2 rounded-xl bg-muted text-foreground text-xs hover:bg-destructive hover:text-destructive-foreground transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Brand pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {brands.map((b) => (
            <button
              key={b}
              onClick={() => setSelectedBrand(b)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedBrand === b
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* MATRIX TABLE */}
      <div className="rounded-2xl border border-border bg-card/40 overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4 font-bold">Brand & Model</th>
                <th className="py-3.5 px-4 font-bold">Processor / SoC</th>
                <th className="py-3.5 px-4 font-bold">Unlock Protocol</th>
                <th className="py-3.5 px-4 font-bold">Status</th>
                <th className="py-3.5 px-4 font-bold">Est. Time</th>
                <th className="py-3.5 px-4 font-bold">Regions</th>
                <th className="py-3.5 px-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                    No models match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((d: DeviceEntry) => (
                  <tr
                    key={d.id}
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    <td className="py-4 px-4">
                      <div className="font-bold text-foreground text-sm">{d.model}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        {d.brand} • {d.codename}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-semibold text-foreground">{d.chipset}</div>
                      <div className="text-[10px] text-muted-foreground">{d.chipsetType}</div>
                    </td>

                    <td className="py-4 px-4 max-w-xs">
                      <div className="font-medium text-foreground">{d.unlockMethod}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{d.notes}</div>
                    </td>

                    <td className="py-4 px-4">{renderBadge(d.status, d.statusLabel)}</td>

                    <td className="py-4 px-4 font-medium text-foreground whitespace-nowrap">
                      {d.timeEstimate}
                    </td>

                    <td className="py-4 px-4 text-muted-foreground whitespace-nowrap">
                      {d.regionsSupported}
                    </td>

                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      {d.status !== "not_supported" ? (
                        <Link
                          to="/booking"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-bold text-xs hover:shadow-glow transition-all"
                        >
                          Unlock <ArrowRight className="w-3 h-3" />
                        </Link>
                      ) : (
                        <span className="text-[11px] text-rose-400 font-semibold">Locked</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-border bg-muted/20 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Showing {filtered.length} of {SUPPORTED_DEVICES.length} tested devices</span>
          <span className="text-[11px]">Updated daily with latest HyperOS & Android 15/16 security patch level verifications</span>
        </div>
      </div>
    </div>
  );
}
