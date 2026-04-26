import { createFileRoute } from "@tanstack/react-router";
import { FeedPage } from "@/components/pages/FeedPage";
import { getSeo } from "@/server/seo.functions";
import { buildSeoMeta } from "@/lib/seo";

export const Route = createFileRoute("/feed")({
  component: FeedPage,
  loader: async () => ({ seo: await getSeo({ data: { key: "feed" } }).catch(() => null) }),
  head: ({ loaderData }) => ({
    meta: buildSeoMeta(loaderData?.seo ?? null, {
      title: "Feed — Ali Nur Hasan (TasTaj)",
      description:
        "A live social-style feed of every image and video uploaded across portfolio folders. Newest first.",
    }),
  }),
});
