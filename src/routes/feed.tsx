import { createFileRoute } from "@tanstack/react-router";
import { FeedPage } from "@/components/pages/FeedPage";

export const Route = createFileRoute("/feed")({
  component: FeedPage,
  head: () => ({
    meta: [
      { title: "Feed — Ali Nur Hasan (TasTaj)" },
      {
        name: "description",
        content:
          "A live social-style feed of every image and video uploaded across portfolio folders. Newest first.",
      },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Feed — Ali Nur Hasan (TasTaj)" },
      {
        property: "og:description",
        content: "Latest design uploads — synced automatically with the portfolio.",
      },
      { property: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
