import { createFileRoute } from "@tanstack/react-router";
import { ContactPage } from "@/components/pages/ContactPage";
import { getSeo } from "@/server/seo.functions";
import { buildSeoMeta } from "@/lib/seo";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  loader: async () => ({
    seo: await getSeo({ data: { key: "contact" } }).catch(() => null),
  }),
  staleTime: 60_000,
  head: ({ loaderData }) => ({
    meta: buildSeoMeta(loaderData?.seo ?? null, {
      title: "Contact — Ali Nur Hasan (TasTaj)",
      description:
        "Start a project with Ali Nur Hasan. Share a brief, pick a call slot — replies within 24 hours.",
    }),
  }),
});
