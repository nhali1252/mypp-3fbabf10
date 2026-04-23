import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/F")({
  beforeLoad: () => {
    throw redirect({ to: "/about-and-skills", replace: true });
  },
});
