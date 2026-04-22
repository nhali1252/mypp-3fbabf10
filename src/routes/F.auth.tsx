import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/F/auth")({
  beforeLoad: () => {
    throw redirect({ to: "/auth" });
  },
});
