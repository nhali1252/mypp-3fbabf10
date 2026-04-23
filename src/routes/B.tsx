import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/B")({
  beforeLoad: () => {
    throw redirect({ to: "/basic", replace: true });
  },
});
