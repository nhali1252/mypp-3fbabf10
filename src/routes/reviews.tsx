import { createFileRoute } from "@tanstack/react-router";
import { ReviewsPage } from "@/components/pages/ReviewsPage";

export const Route = createFileRoute("/reviews")({
  component: ReviewsPage,
  head: () => ({
    meta: [
      { title: "Client Reviews — Ali Nur Hasan (TasTaj)" },
      { name: "description", content: "Read what clients say and leave your own review." },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Client Reviews — Ali Nur Hasan (TasTaj)" },
      { property: "og:description", content: "Honest reviews from real clients." },
      { property: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
