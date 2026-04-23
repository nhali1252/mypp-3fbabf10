import { createFileRoute } from "@tanstack/react-router";
import { PortfolioPage } from "@/components/pages/PortfolioPage";

export const Route = createFileRoute("/portfolio")({
  component: PortfolioPage,
  head: () => ({
    meta: [
      { title: "Portfolio — Ali Nur Hasan (TasTaj)" },
      { name: "description", content: "Folder-style portfolio gallery synced from my portfolio CMS." },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Portfolio — Ali Nur Hasan (TasTaj)" },
      { property: "og:description", content: "Folder-style portfolio gallery." },
      { property: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
