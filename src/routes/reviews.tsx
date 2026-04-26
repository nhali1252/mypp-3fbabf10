import { createFileRoute } from "@tanstack/react-router";
import { ReviewsPage } from "@/components/pages/ReviewsPage";
import { getSeo } from "@/server/seo.functions";
import { buildSeoMeta } from "@/lib/seo";

export const Route = createFileRoute("/reviews")({
  component: ReviewsPage,
  loader: async () => ({ seo: await getSeo({ data: { key: "reviews" } }).catch(() => null) }),
  head: ({ loaderData }) => ({
    meta: buildSeoMeta(loaderData?.seo ?? null, {
      title: "Client Reviews — Ali Nur Hasan (TasTaj)",
      description: "Read what clients say and leave your own review.",
    }),
  }),
});
