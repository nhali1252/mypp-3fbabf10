import { createFileRoute } from "@tanstack/react-router";
import { ProjectsPage } from "@/components/pages/ProjectsPage";

export const Route = createFileRoute("/projects")({
  component: ProjectsPage,
  head: () => ({
    meta: [
      { title: "Projects — Ali Nur Hasan (TasTaj)" },
      { name: "description", content: "Selected work and projects by Ali Nur Hasan." },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Projects — Ali Nur Hasan (TasTaj)" },
      { property: "og:description", content: "Selected work and projects." },
      { property: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
