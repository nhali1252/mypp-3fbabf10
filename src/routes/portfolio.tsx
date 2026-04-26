import { createFileRoute } from "@tanstack/react-router";
import { PortfolioPage } from "@/components/pages/PortfolioPage";
import { getSeo } from "@/server/seo.functions";
import { buildSeoMeta } from "@/lib/seo";

export const Route = createFileRoute("/portfolio")({
  component: PortfolioPage,
  loader: async () => ({
    seo: await getSeo({ data: { key: "portfolio" } }).catch(() => null),
  }),
  staleTime: 60_000,
  head: ({ loaderData }) => ({
    meta: buildSeoMeta(loaderData?.seo ?? null, {
      title: "Portfolio — Ali Nur Hasan (TasTaj)",
      description: "Folder-style portfolio gallery synced from my portfolio CMS.",
    }),
  }),
});
