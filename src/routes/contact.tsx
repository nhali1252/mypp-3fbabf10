import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ContactPage } from "@/components/pages/ContactPage";

const contactSearchSchema = z.object({
  service: z.string().trim().min(1).max(120).optional(),
});

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  validateSearch: contactSearchSchema,
  head: () => ({
    meta: [
      { title: "Contact — Ali Nur Hasan (TasTaj)" },
      {
        name: "description",
        content:
          "Start a project with Ali Nur Hasan. Share a brief, pick a call slot — replies within 24 hours.",
      },
      { property: "og:title", content: "Contact — Ali Nur Hasan (TasTaj)" },
      {
        property: "og:description",
        content: "Let's design something remarkable. Share a brief and pick a time.",
      },
      { property: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
