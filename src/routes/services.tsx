import { createFileRoute } from "@tanstack/react-router";
import { ServicesTasTajPage } from "@/components/pages/ServicesTasTajPage";
import { getSeo } from "@/server/seo.functions";
import { buildSeoMeta } from "@/lib/seo";

export const Route = createFileRoute("/services")({
  component: ServicesTasTajPage,
  loader: async () => ({ seo: await getSeo({ data: { key: "services" } }).catch(() => null) }),
  head: ({ loaderData }) => ({
    meta: buildSeoMeta(loaderData?.seo ?? null, {
      title: "Services — Ali Nur Hasan (TasTaj)",
      description:
        "Brand identity, posters, banners and product visuals — built with intent. A focused range of design services synced with my CMS.",
    }),
  }),
});
