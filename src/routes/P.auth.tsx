import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/P/auth")({
  beforeLoad: () => {
    throw redirect({ to: "/auth" });
  },
});
