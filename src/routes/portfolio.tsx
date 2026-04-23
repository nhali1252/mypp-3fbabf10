import { createFileRoute } from "@tanstack/react-router";
import { ProjectsPage } from "@/components/pages/ProjectsPage";

export const Route = createFileRoute("/portfolio")({
  component: ProjectsPage,
  head: () => ({
    meta: [
      { title: "Portfolio — Ali Nur Hasan (TasTaj)" },
      { name: "description", content: "Folder-style portfolio gallery of selected design and development work by Ali Nur Hasan." },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Portfolio — Ali Nur Hasan (TasTaj)" },
      { property: "og:description", content: "Folder-style portfolio gallery of selected work." },
      { property: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
