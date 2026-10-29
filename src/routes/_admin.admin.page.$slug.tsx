/**
 * Per-page editor shell. Renders all sections from PAGE_BLOCKS for the
 * given slug as collapsible cards. Section bodies come from the registry;
 * unregistered sections render a friendly placeholder.
 *
 * URL: /admin/page/$slug
 */
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowLeft, ExternalLink, Hammer } from "lucide-react";
import { PAGE_BLOCK_BY_SLUG } from "@/admin/page-blocks";
import { getSectionEditor } from "@/admin/section-registry";

export const Route = createFileRoute("/_admin/admin/page/$slug")({
  component: PageEditor,
  loader: ({ params }) => {
    const block = PAGE_BLOCK_BY_SLUG[params.slug];
    if (!block) throw notFound();
    return { block };
  },
  notFoundComponent: () => (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="text-sm text-muted-foreground">
        That slug isn't registered in <code>PAGE_BLOCKS</code> yet.
      </p>
      <Link to="/admin" className="text-sm text-primary hover:underline">
        ← Back to dashboard
      </Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">Editor error</h1>
      <p className="text-sm text-destructive">{(error as Error).message}</p>
    </div>
  ),
});

function PageEditor() {
  const { block } = Route.useLoaderData();
  const { slug } = Route.useParams();

  return (
    <div className="space-y-8 max-w-4xl">
      <header className="space-y-3">
        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All pages
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black">{block.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{block.description}</p>
          </div>
          <a
            href={publicRouteFor(slug)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold hover:border-primary/40"
          >
            View page <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </header>

      <Accordion
        type="multiple"
        defaultValue={block.sections.map((s: { id: string }) => s.id)}
        className="space-y-3"
      >
        {block.sections.map((section: { id: string; title: string; description?: string }) => {
          const Editor = getSectionEditor(slug, section.id);
          return (
            <AccordionItem
              key={section.id}
              value={section.id}
              className="rounded-2xl border border-border bg-card px-5"
            >
              <AccordionTrigger className="py-4 hover:no-underline">
                <div className="text-left">
                  <div className="font-semibold">{section.title}</div>
                  {section.description && (
                    <div className="text-xs text-muted-foreground font-normal mt-0.5">
                      {section.description}
                    </div>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-5 pt-1">
                {Editor ? (
                  <Editor slug={slug} />
                ) : (
                  <ComingSoon sectionTitle={section.title} />
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

function ComingSoon({ sectionTitle }: { sectionTitle: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/20 p-5 text-sm text-muted-foreground flex items-start gap-3">
      <Hammer className="h-4 w-4 text-primary mt-0.5 shrink-0" />
      <div>
        <div className="font-medium text-foreground">{sectionTitle} editor coming next</div>
        <p className="mt-1">
          This section is registered but its editor hasn't been wired into the new shell yet.
          Existing per-feature admin pages still work in the meantime.
        </p>
      </div>
    </div>
  );
}

/** Best-effort mapping from page slug to a public preview URL. */
function publicRouteFor(slug: string): string {
  switch (slug) {
    case "basic":     return "/basic";
    case "about":     return "/about-and-skills";
    case "portfolio": return "/portfolio";
    case "projects":  return "/projects";
    case "services":  return "/services";
    case "contact":   return "/contact";
    case "reviews":   return "/reviews";
    default:          return "/";
  }
}
