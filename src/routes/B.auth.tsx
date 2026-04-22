import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/B/auth")({
  beforeLoad: () => {
    throw redirect({ to: "/auth" });
  },
});
