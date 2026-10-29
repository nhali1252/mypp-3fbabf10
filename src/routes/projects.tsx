import { createFileRoute } from "@tanstack/react-router";
import { ProjectsPage } from "@/components/pages/ProjectsPage";
import { getSeo } from "@/lib/fns/seo.functions";
import { buildSeoMeta } from "@/lib/seo";

export const Route = createFileRoute("/projects")({
  component: ProjectsPage,
  loader: async () => ({
    seo: await getSeo({ data: { key: "projects" } }).catch(() => null),
  }),
  staleTime: 60_000,
  head: ({ loaderData }) => ({
    meta: buildSeoMeta(loaderData?.seo ?? null, {
      title: "Projects — Ali Nur Hasan (TasTaj)",
      description: "Selected work and projects by Ali Nur Hasan.",
    }),
  }),
});
