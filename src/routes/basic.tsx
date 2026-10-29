import { createFileRoute } from "@tanstack/react-router";
import { BasicPage } from "@/components/pages/BasicPage";
import { getSeo } from "@/lib/fns/seo.functions";
import { buildSeoMeta } from "@/lib/seo";

export const Route = createFileRoute("/basic")({
  component: BasicPage,
  loader: async () => ({
    seo: await getSeo({ data: { key: "basic" } }).catch(() => null),
  }),
  staleTime: 60_000,
  head: ({ loaderData }) => ({
    meta: buildSeoMeta(loaderData?.seo ?? null, {
      title: "Basic info — Ali Nur Hasan (TasTaj)",
      description:
        "Basic info for Ali Nur Hasan (TasTaj) — graphic designer with 2 years of design experience working with TasTaj on branding, logos, posters and basic web design.",
    }),
  }),
});
