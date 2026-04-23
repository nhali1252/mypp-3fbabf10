import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/P")({
  beforeLoad: () => {
    throw redirect({ to: "/projects", replace: true });
  },
});
