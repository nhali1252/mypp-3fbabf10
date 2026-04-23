import { createFileRoute } from "@tanstack/react-router";
import { AboutSkillsPage } from "@/components/pages/AboutSkillsPage";

export const Route = createFileRoute("/about-and-skills")({
  component: AboutSkillsPage,
  head: () => ({
    meta: [
      { title: "About & Skills — Ali Nur Hasan (TasTaj)" },
      {
        name: "description",
        content:
          "Ali Nur Hasan — designer with 2 years of design experience working with TasTaj on logos, banners, posters, product and basic web design. Canva and Adobe workflow.",
      },
      { property: "og:type", content: "profile" },
      { property: "og:title", content: "About & Skills — Ali Nur Hasan (TasTaj)" },
      {
        property: "og:description",
        content:
          "Designer · 2 years with TasTaj · Logo, banner, poster, product & basic web design · Canva + Adobe + AI workflow.",
      },
      { property: "twitter:card", content: "summary_large_image" },
      { property: "twitter:title", content: "About & Skills — Ali Nur Hasan (TasTaj)" },
      {
        property: "twitter:description",
        content:
          "Designer with 2 years of design experience working with TasTaj — logo, banner, poster, product & basic web design.",
      },
    ],
  }),
});
