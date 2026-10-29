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
      title: "Bootloader Architecture & Unlock Guide — Deep Technical Manual",
      description: "Deep dive into Android bootloader architecture: Primary Bootloader (PBL), XBL, TrustZone, ABL, AVB 2.0 verified boot, Samsung Knox e-fuses, and Qualcomm EDL 9008 protocol.",
    }),
  }),
});
