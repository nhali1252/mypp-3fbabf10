import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * PWA web app manifest. Pulls site name + theme color + favicon from
 * `site_settings` so admins can control the install card from the admin UI.
 */
export const Route = createFileRoute("/manifest.webmanifest")({
  server: {
    handlers: {
      GET: async () => {
        const { data: s } = await supabaseAdmin
          .from("site_settings")
          .select("site_name, site_title, theme_primary, favicon_url, logo_url")
          .limit(1)
          .maybeSingle();

        const name = s?.site_name || s?.site_title || "Portfolio";
        const themeColor = s?.theme_primary || "#0F172A";
        const adminIcon = s?.logo_url || s?.favicon_url || null;

        // Bundled icons are the trusted base (correct sizes guaranteed).
        // Admin-uploaded logo is added as an extra "any" icon when present —
        // browsers fall back to bundled ones if it isn't actually square.
        const icons: Array<{ src: string; sizes: string; type: string; purpose?: string }> = [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        ];
        if (adminIcon) {
          icons.push({ src: adminIcon, sizes: "any", type: "image/png" });
        }

        const manifest = {
          name,
          short_name: name.length > 12 ? name.slice(0, 12) : name,
          start_url: "/",
          scope: "/",
          display: "standalone",
          orientation: "portrait",
          background_color: "#0F0E0C",
          theme_color: themeColor,
          icons,
        };

        return new Response(JSON.stringify(manifest), {
          status: 200,
          headers: {
            "content-type": "application/manifest+json; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
