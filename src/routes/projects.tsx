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
      title: "Supported Devices Matrix — Bootloader Unlock Compatibility",
      description: "Search supported devices for bootloader unlock. Check Xiaomi HyperOS, Samsung Global, Google Pixel, OnePlus, Motorola, and permanently locked carrier models.",
    }),
  }),
});
