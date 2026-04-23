import { createFileRoute } from "@tanstack/react-router";
import { BasicPage } from "@/components/pages/BasicPage";

export const Route = createFileRoute("/basic")({
  component: BasicPage,
  head: () => ({
    meta: [
      { title: "Basic info — Ali Nur Hasan (TasTaj)" },
      {
        name: "description",
        content:
          "Basic info for Ali Nur Hasan (TasTaj) — graphic designer with 2 years of design experience working with TasTaj on branding, logos, posters and basic web design.",
      },
      { property: "og:type", content: "profile" },
      { property: "og:title", content: "Basic info — Ali Nur Hasan (TasTaj)" },
      {
        property: "og:description",
        content:
          "Graphic designer (TasTaj) — branding, logos, posters, product & basic web design.",
      },
      { property: "twitter:card", content: "summary_large_image" },
      { property: "twitter:title", content: "Basic info — Ali Nur Hasan (TasTaj)" },
      {
        property: "twitter:description",
        content:
          "Graphic designer (TasTaj) — branding, logos, posters, product & basic web design.",
      },
    ],
  }),
});
