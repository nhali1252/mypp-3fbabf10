import { createFileRoute } from "@tanstack/react-router";
import { ContactPage } from "@/components/pages/ContactPage";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
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
