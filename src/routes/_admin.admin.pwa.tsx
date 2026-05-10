/**
 * Admin → PWA / Install
 *
 * Shows the current install card preview, lists the bundled icons + their
 * actual served sizes, validates the manifest, and lets admins reset the
 * install-prompt dismissal stored in their browser localStorage.
 *
 * Read-only: no DB writes. Manifest values are derived from site_settings
 * (edited under Admin → Site settings) plus bundled icons.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminPage, AdminCard } from "@/components/admin/AdminPage";
import { Smartphone, RefreshCw, ExternalLink, CheckCircle2, AlertTriangle, Download } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/pwa")({
  component: AdminPwaPage,
});

type ManifestIcon = { src: string; sizes: string; type: string; purpose?: string };
type Manifest = {
  name?: string;
  short_name?: string;
  start_url?: string;
  display?: string;
  theme_color?: string;
  background_color?: string;
  icons?: ManifestIcon[];
};

const BUNDLED_ICONS = [
  { src: "/icons/icon-192.png", expected: "192×192" },
  { src: "/icons/icon-512.png", expected: "512×512" },
  { src: "/icons/apple-touch-icon.png", expected: "180×180" },
];

function useImageDimensions(src: string) {
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const img = new Image();
    img.onload = () => setDims({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => setError(true);
    img.src = src + "?t=" + Date.now();
  }, [src]);
  return { dims, error };
}

function IconRow({ src, expected }: { src: string; expected: string }) {
  const { dims, error } = useImageDimensions(src);
  const actual = dims ? `${dims.w}×${dims.h}` : error ? "missing" : "loading…";
  const ok = dims && `${dims.w}×${dims.h}` === expected;
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-background/40 p-3">
      <img
        src={src}
        alt=""
        className="h-14 w-14 rounded-xl border border-border object-cover"
      />
      <div className="min-w-0 flex-1">
        <code className="text-xs text-muted-foreground">{src}</code>
        <div className="mt-0.5 text-sm">
          Expected <strong>{expected}</strong> · actual{" "}
          <strong className={ok ? "text-emerald-500" : error ? "text-destructive" : ""}>
            {actual}
          </strong>
        </div>
      </div>
      {ok ? (
        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
      ) : error ? (
        <AlertTriangle className="h-5 w-5 text-destructive" />
      ) : null}
    </div>
  );
}

function AdminPwaPage() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [manifestErr, setManifestErr] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [dismissed, setDismissed] = useState({ install: false, ios: false });

  useEffect(() => {
    fetch("/manifest.webmanifest?t=" + Date.now())
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((m) => setManifest(m as Manifest))
      .catch((e) => setManifestErr(String(e?.message ?? e)));
  }, [reloadKey]);

  useEffect(() => {
    setDismissed({
      install: !!localStorage.getItem("install-prompt:dismissed"),
      ios: !!localStorage.getItem("install-prompt:ios-hint-dismissed"),
    });
  }, [reloadKey]);

  function resetPrompt() {
    localStorage.removeItem("install-prompt:dismissed");
    localStorage.removeItem("install-prompt:ios-hint-dismissed");
    setReloadKey((k) => k + 1);
  }

  return (
    <AdminPage
      title="PWA & install"
      description="Manage how the site installs to home screens. Manifest values come from Site settings; icons are bundled from /public/icons."
      actions={
        <button
          onClick={() => setReloadKey((k) => k + 1)}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      }
    >
      <AdminCard title="Install card preview">
        {manifest ? (
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-background p-4">
            <div className="relative">
              <img
                src="/icons/icon-192.png"
                alt=""
                className="h-16 w-16 rounded-2xl border border-border"
                style={{
                  background: manifest.background_color ?? "#0F0E0C",
                }}
              />
              <span
                className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background"
                style={{ background: manifest.theme_color ?? "#0F172A" }}
                title={`theme_color ${manifest.theme_color}`}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold">{manifest.name || "Untitled"}</p>
              <p className="truncate text-xs text-muted-foreground">
                {manifest.short_name} · {manifest.display} · start {manifest.start_url}
              </p>
            </div>
            <button
              disabled
              className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background opacity-60"
            >
              <Download className="h-3.5 w-3.5" /> Install
            </button>
          </div>
        ) : manifestErr ? (
          <p className="text-sm text-destructive">Failed to load manifest: {manifestErr}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Loading manifest…</p>
        )}
      </AdminCard>

      <AdminCard title="Bundled icons">
        <div className="space-y-2">
          {BUNDLED_ICONS.map((i) => (
            <IconRow key={i.src} src={i.src} expected={i.expected} />
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          To swap the brand monogram, replace the files in <code>/public/icons/</code> and redeploy.
          Admin-uploaded logos in Site settings are added as an extra manifest icon but never replace these trusted bundled sizes.
        </p>
      </AdminCard>

      <AdminCard title="Install prompt state (this browser)">
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span>Install prompt dismissed</span>
            <span className={dismissed.install ? "text-amber-500" : "text-emerald-500"}>
              {dismissed.install ? "yes" : "no"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>iOS hint dismissed</span>
            <span className={dismissed.ios ? "text-amber-500" : "text-emerald-500"}>
              {dismissed.ios ? "yes" : "no"}
            </span>
          </div>
        </div>
        <button
          onClick={resetPrompt}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent"
        >
          <Smartphone className="h-4 w-4" /> Reset prompt for this browser
        </button>
        <p className="mt-2 text-xs text-muted-foreground">
          Only affects you. Each visitor's dismissal is stored in their own browser.
        </p>
      </AdminCard>

      <AdminCard title="Test on device">
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>
            Open the published site on a phone (preview iframe is excluded from the install prompt).
          </li>
          <li>
            Android Chrome: tap menu → <strong className="text-foreground">Install app</strong>.
          </li>
          <li>
            iOS Safari: tap <strong className="text-foreground">Share</strong> → <strong className="text-foreground">Add to Home Screen</strong>.
          </li>
        </ul>
        <div className="mt-4 flex gap-2">
          <a
            href="/manifest.webmanifest"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent"
          >
            View manifest <ExternalLink className="h-3 w-3" />
          </a>
          <Link
            to="/admin/settings"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent"
          >
            Site settings
          </Link>
        </div>
      </AdminCard>
    </AdminPage>
  );
}
