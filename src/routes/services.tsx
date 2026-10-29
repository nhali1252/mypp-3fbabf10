import { createFileRoute } from "@tanstack/react-router";
import { ServicesTasTajPage } from "@/components/pages/ServicesTasTajPage";
import { getSeo } from "@/lib/fns/seo.functions";
import { buildSeoMeta } from "@/lib/seo";

export const Route = createFileRoute("/services")({
  component: ServicesTasTajPage,
  loader: async () => ({
    seo: await getSeo({ data: { key: "services" } }).catch(() => null),
  }),
  staleTime: 60_000,
  head: ({ loaderData }) => ({
    meta: buildSeoMeta(loaderData?.seo ?? null, {
      title: "Remote Bootloader Unlock & EDL Unbrick Services — BootUnlock Pro",
      description: "Professional remote bootloader unlocking, Xiaomi HyperOS token bypass, Qualcomm EDL 9008 unbrick, Samsung Global root, and KernelSU Play Integrity setups.",
    }),
  }),
});
