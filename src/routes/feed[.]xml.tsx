import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * RSS 2.0 feed of recent projects + featured portfolio items.
 * Lets readers subscribe and improves crawlability for syndication.
 */
export const Route = createFileRoute("/feed.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;

        const [{ data: settings }, { data: projects }, { data: portfolio }] =
          await Promise.all([
            supabaseAdmin
              .from("site_settings")
              .select("site_title, site_name")
              .limit(1)
              .maybeSingle(),
            supabaseAdmin
              .from("projects")
              .select("slug, title, summary, description, image_url, updated_at, created_at")
              .eq("published", true)
              .order("updated_at", { ascending: false })
              .limit(20),
            supabaseAdmin
              .from("portfolio_items")
              .select("id, title, description, image_url, updated_at, created_at, folder_id, portfolio_folders(slug)")
              .eq("active", true)
              .eq("show_in_feed", true)
              .order("created_at", { ascending: false })
              .limit(20),
          ]);

        const siteTitle =
          settings?.site_name || settings?.site_title || "Portfolio";

        type Item = {
          title: string;
          link: string;
          description: string;
          image: string | null;
          guid: string;
          date: string;
        };
        const items: Item[] = [];

        for (const p of projects ?? []) {
          if (!p.slug) continue;
          items.push({
            title: p.title ?? "Untitled",
            link: `${origin}/projects/${p.slug}`,
            description: p.summary || p.description || "",
            image: p.image_url ?? null,
            guid: `${origin}/projects/${p.slug}`,
            date: p.updated_at || p.created_at || new Date().toISOString(),
          });
        }
        for (const i of (portfolio ?? []) as any[]) {
          const folderSlug = i.portfolio_folders?.slug;
          const link = folderSlug
            ? `${origin}/portfolio/${folderSlug}`
            : `${origin}/portfolio`;
          items.push({
            title: i.title ?? "Untitled",
            link,
            description: i.description || "",
            image: i.image_url ?? null,
            guid: `${origin}/portfolio/item/${i.id}`,
            date: i.updated_at || i.created_at || new Date().toISOString(),
          });
        }

        items.sort((a, b) => +new Date(b.date) - +new Date(a.date));
        const top = items.slice(0, 30);

        const esc = (s: string) =>
          s
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&apos;");

        const lastBuild = top[0]?.date
          ? new Date(top[0].date).toUTCString()
          : new Date().toUTCString();

        const itemsXml = top
          .map(
            (it) => `    <item>
      <title>${esc(it.title)}</title>
      <link>${esc(it.link)}</link>
      <guid isPermaLink="false">${esc(it.guid)}</guid>
      <pubDate>${new Date(it.date).toUTCString()}</pubDate>
      <description>${esc(it.description)}</description>${
        it.image
          ? `\n      <enclosure url="${esc(it.image)}" type="image/jpeg" />`
          : ""
      }
    </item>`,
          )
          .join("\n");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(siteTitle)}</title>
    <link>${origin}</link>
    <description>Latest projects and portfolio updates</description>
    <language>en</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${origin}/feed.xml" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>`;

        return new Response(xml, {
          status: 200,
          headers: {
            "content-type": "application/rss+xml; charset=utf-8",
            "cache-control": "public, max-age=600",
          },
        });
      },
    },
  },
});
