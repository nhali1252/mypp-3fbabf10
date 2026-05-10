import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const STATIC_ROUTES = [
  "/", "/basic", "/about-and-skills", "/portfolio",
  "/projects", "/services", "/contact", "/reviews", "/feed",
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        const urls: { loc: string; lastmod?: string }[] = STATIC_ROUTES.map((p) => ({
          loc: `${origin}${p}`,
        }));

        const [{ data: projects }, { data: folders }] = await Promise.all([
          supabaseAdmin.from("projects").select("slug, updated_at").eq("published", true),
          supabaseAdmin.from("portfolio_folders").select("slug, updated_at").eq("active", true),
        ]);
        for (const p of projects ?? []) {
          if (p.slug) urls.push({ loc: `${origin}/projects/${p.slug}`, lastmod: p.updated_at });
        }
        for (const f of folders ?? []) {
          if (f.slug) urls.push({ loc: `${origin}/portfolio/${f.slug}`, lastmod: f.updated_at });
        }

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${new Date(u.lastmod).toISOString()}</lastmod>` : ""}</url>`,
  )
  .join("\n")}
</urlset>`;

        return new Response(xml, {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=600",
          },
        });
      },
    },
  },
});
