import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ContactPage } from "@/components/pages/ContactPage";
import { getSeo } from "@/server/seo.functions";
import { buildSeoMeta } from "@/lib/seo";

const contactSearchSchema = z.object({
  service: z.string().trim().min(1).max(120).optional(),
});

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  validateSearch: contactSearchSchema,
  loader: async () => ({ seo: await getSeo({ data: { key: "contact" } }).catch(() => null) }),
  head: ({ loaderData }) => ({
    meta: buildSeoMeta(loaderData?.seo ?? null, {
      title: "Contact — Ali Nur Hasan (TasTaj)",
      description:
        "Start a project with Ali Nur Hasan. Share a brief, pick a call slot — replies within 24 hours.",
    }),
  }),
});

