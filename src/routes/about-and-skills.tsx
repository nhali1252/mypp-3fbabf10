import { createFileRoute } from "@tanstack/react-router";
import { AboutSkillsPage } from "@/components/pages/AboutSkillsPage";
import { getSeo } from "@/lib/fns/seo.functions";
import { buildSeoMeta } from "@/lib/seo";

export const Route = createFileRoute("/about-and-skills")({
  component: AboutSkillsPage,
  loader: async () => ({
    seo: await getSeo({ data: { key: "about-and-skills" } }).catch(() => null),
  }),
  staleTime: 60_000,
  head: ({ loaderData }) => ({
    meta: buildSeoMeta(loaderData?.seo ?? null, {
      title: "About & Skills — Ali Nur Hasan (TasTaj)",
      description:
        "Ali Nur Hasan — designer with 2 years of design experience working with TasTaj on logos, banners, posters, product and basic web design. Canva and Adobe workflow.",
    }),
  }),
});
