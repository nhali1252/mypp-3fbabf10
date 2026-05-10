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
        const icon = s?.logo_url || s?.favicon_url || "/favicon.ico";

        const manifest = {
          name,
          short_name: name.length > 12 ? name.slice(0, 12) : name,
          start_url: "/",
          scope: "/",
          display: "standalone",
          orientation: "portrait",
          background_color: "#0F172A",
          theme_color: themeColor,
          icons: [
            { src: icon, sizes: "192x192", type: "image/png", purpose: "any maskable" },
            { src: icon, sizes: "512x512", type: "image/png", purpose: "any maskable" },
          ],
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
