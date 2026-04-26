import { createFileRoute } from "@tanstack/react-router";
import { ServicesTasTajPage } from "@/components/pages/ServicesTasTajPage";

export const Route = createFileRoute("/services")({
  component: ServicesTasTajPage,
  head: () => ({
    meta: [
      { title: "Services — Ali Nur Hasan (TasTaj)" },
      {
        name: "description",
        content:
          "Brand identity, posters, banners and product visuals — built with intent. A focused range of design services synced with my CMS.",
      },
      { property: "og:title", content: "Services — Ali Nur Hasan (TasTaj)" },
      {
        property: "og:description",
        content: "Every brief, treated like a brand. Premium design for founders and brands.",
      },
      { property: "twitter:card", content: "summary_large_image" },
      { property: "twitter:title", content: "Services — Ali Nur Hasan (TasTaj)" },
    ],
  }),
});
