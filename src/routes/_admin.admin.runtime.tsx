import { createFileRoute } from "@tanstack/react-router";
import { Server } from "lucide-react";

export const Route = createFileRoute("/_admin/admin/runtime")({
  component: RuntimePage,
  head: () => ({ meta: [{ title: "Runtime — Admin" }] }),
});

function RuntimePage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-black tracking-tight">Runtime</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-xl">
          Content is served directly from the database. No external storage
          client to manage.
        </p>
      </header>
      <section className="rounded-2xl border border-border bg-card p-5 flex items-start gap-3">
        <Server className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
        <div className="text-sm text-muted-foreground">
          Database-backed runtime active. Public pages read live from Supabase
          tables — no caching layer to refresh.
        </div>
      </section>
    </div>
  );
}
