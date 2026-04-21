import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle2, XCircle, AlertCircle, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_admin/admin/checklist")({
  component: ChecklistPage,
});

type Status = "pass" | "fail" | "warn" | "loading";
interface CheckItem {
  id: string;
  label: string;
  detail: string;
  status: Status;
  fixTo?: string;
  fixLabel?: string;
}

function ChecklistPage() {
  const { isAdmin, user } = useAuth();
  const [checks, setChecks] = useState<CheckItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function run() {
    setLoading(true);
    const items: CheckItem[] = [];

    // 1. Admin access
    items.push({
      id: "admin",
      label: "Admin access",
      detail: isAdmin
        ? `Signed in as ${user?.email} with admin role`
        : "You are signed in but not an admin — content edits will fail",
      status: isAdmin ? "pass" : "fail",
    });

    // 2. Hero content
    const { data: hero } = await supabase.from("hero_content").select("*").maybeSingle();
    items.push({
      id: "hero",
      label: "Hero content",
      detail: hero?.headline
        ? `Headline set: "${hero.headline.slice(0, 60)}${hero.headline.length > 60 ? "…" : ""}"`
        : "No hero content found",
      status: hero?.headline ? (hero.portrait_url ? "pass" : "warn") : "fail",
      fixTo: "/admin/hero",
      fixLabel: hero?.portrait_url ? "Edit hero" : "Add portrait & copy",
    });

    // 3. About
    const { data: about } = await supabase.from("about_content").select("*").maybeSingle();
    items.push({
      id: "about",
      label: "About section",
      detail: about?.bio ? "Bio is filled in" : "About bio is empty",
      status: about?.bio ? "pass" : "warn",
      fixTo: "/admin/about",
      fixLabel: "Edit about",
    });

    // 4. Projects
    const { data: projects } = await supabase.from("projects").select("id,image_url,published");
    const published = (projects ?? []).filter((p: any) => p.published);
    const withThumb = published.filter((p: any) => p.image_url);
    items.push({
      id: "projects",
      label: "Projects & thumbnails",
      detail: `${published.length} published · ${withThumb.length} have thumbnails`,
      status: published.length === 0 ? "fail" : withThumb.length === published.length ? "pass" : "warn",
      fixTo: "/admin/projects",
      fixLabel: "Manage projects",
    });

    // 5. Education
    const { count: eduCount } = await supabase
      .from("education")
      .select("id", { count: "exact", head: true });
    items.push({
      id: "edu",
      label: "Education entries",
      detail: `${eduCount ?? 0} entries`,
      status: (eduCount ?? 0) > 0 ? "pass" : "warn",
      fixTo: "/admin/education",
      fixLabel: "Edit education",
    });

    // 6. Activities
    const { count: actCount } = await supabase
      .from("activities")
      .select("id", { count: "exact", head: true });
    items.push({
      id: "act",
      label: "Activities",
      detail: `${actCount ?? 0} entries`,
      status: (actCount ?? 0) > 0 ? "pass" : "warn",
      fixTo: "/admin/activities",
      fixLabel: "Edit activities",
    });

    // 7. Footer apps
    const { data: apps } = await supabase.from("footer_apps").select("id,logo_url,active,url");
    const activeApps = (apps ?? []).filter((a: any) => a.active && a.url);
    const appsWithLogo = activeApps.filter((a: any) => a.logo_url);
    items.push({
      id: "footer-apps",
      label: "Footer app cards",
      detail: `${activeApps.length} active · ${appsWithLogo.length} have logos`,
      status: activeApps.length === 0 ? "warn" : appsWithLogo.length === activeApps.length ? "pass" : "warn",
      fixTo: "/admin/footer-apps",
      fixLabel: "Edit footer apps",
    });

    // 8. Contact
    const { data: contact } = await supabase.from("contact_settings").select("*").maybeSingle();
    const hasContact = contact?.email && contact?.address;
    items.push({
      id: "contact",
      label: "Contact info",
      detail: hasContact
        ? `Email: ${contact.email} · ${contact.address}`
        : "Email or location missing",
      status: hasContact ? "pass" : "warn",
      fixTo: "/admin/contact",
      fixLabel: "Edit contact",
    });

    // 9. Social links
    const social = (contact?.social_links as Record<string, string> | null) ?? {};
    const socialCount = Object.values(social).filter(Boolean).length;
    items.push({
      id: "social",
      label: "Social links",
      detail: `${socialCount} link${socialCount === 1 ? "" : "s"} configured`,
      status: socialCount > 0 ? "pass" : "warn",
      fixTo: "/admin/contact",
      fixLabel: "Add socials",
    });

    // 10. Nav links
    const { count: navCount } = await supabase
      .from("nav_links")
      .select("id", { count: "exact", head: true })
      .eq("active", true);
    items.push({
      id: "nav",
      label: "Navigation links",
      detail: `${navCount ?? 0} active links`,
      status: (navCount ?? 0) > 0 ? "pass" : "warn",
      fixTo: "/admin/navigation",
      fixLabel: "Edit nav",
    });

    // 11. Site settings
    const { data: site } = await supabase.from("site_settings").select("*").maybeSingle();
    items.push({
      id: "site",
      label: "Site title & branding",
      detail: site?.site_title ? `Title: ${site.site_title}` : "Site title missing",
      status: site?.site_title ? "pass" : "warn",
      fixTo: "/admin/settings",
      fixLabel: "Edit settings",
    });

    setChecks(items);
    setLoading(false);
  }

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, user?.id]);

  const passed = checks.filter((c) => c.status === "pass").length;
  const failed = checks.filter((c) => c.status === "fail").length;
  const warned = checks.filter((c) => c.status === "warn").length;
  const ready = !loading && failed === 0;

  return (
    <div className="space-y-8 max-w-4xl">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-black mb-1">Pre-publish checklist</h1>
          <p className="text-muted-foreground text-sm">
            Verify everything is ready before you hit Publish.
          </p>
        </div>
        <Button variant="outline" onClick={run} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
          Re-run checks
        </Button>
      </header>

      <section
        className={`rounded-2xl p-6 border ${
          ready
            ? "border-primary/40 bg-primary/5"
            : failed > 0
              ? "border-destructive/40 bg-destructive/5"
              : "border-amber-500/40 bg-amber-500/5"
        }`}
      >
        <div className="flex items-center gap-3 mb-2">
          {ready ? (
            <CheckCircle2 className="w-6 h-6 text-primary" />
          ) : failed > 0 ? (
            <XCircle className="w-6 h-6 text-destructive" />
          ) : (
            <AlertCircle className="w-6 h-6 text-amber-500" />
          )}
          <h2 className="font-bold text-lg">
            {loading
              ? "Running checks…"
              : ready
                ? warned > 0
                  ? "Ready to publish (with warnings)"
                  : "Ready to publish"
                : failed > 0
                  ? "Not ready — fix blockers"
                  : "Almost there"}
          </h2>
        </div>
        <div className="text-sm text-muted-foreground">
          {passed} passed · {warned} warning{warned === 1 ? "" : "s"} · {failed} blocker
          {failed === 1 ? "" : "s"}
        </div>
      </section>

      <ul className="space-y-3">
        {checks.map((c) => (
          <li
            key={c.id}
            className="bg-card border border-border rounded-2xl p-5 flex items-start gap-4"
          >
            <div className="shrink-0 mt-0.5">
              {c.status === "pass" && <CheckCircle2 className="w-5 h-5 text-primary" />}
              {c.status === "warn" && <AlertCircle className="w-5 h-5 text-amber-500" />}
              {c.status === "fail" && <XCircle className="w-5 h-5 text-destructive" />}
              {c.status === "loading" && (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">{c.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{c.detail}</div>
            </div>
            {c.fixTo && c.status !== "pass" && (
              <Link
                to={c.fixTo as any}
                className="text-xs font-bold uppercase tracking-wider text-primary hover:underline shrink-0"
              >
                {c.fixLabel ?? "Fix"} →
              </Link>
            )}
          </li>
        ))}
      </ul>

      <section className="bg-card border border-border rounded-2xl p-6 space-y-3">
        <h2 className="font-bold">Manual visual checks</h2>
        <p className="text-sm text-muted-foreground">
          Open the live site and confirm these on desktop, tablet, and mobile widths:
        </p>
        <ul className="text-sm space-y-2 list-disc pl-5 text-muted-foreground">
          <li>Hero portrait crops correctly and feels prominent</li>
          <li>About, Education, Skills, Projects, Activities all render with content</li>
          <li>Section reveal animations trigger as you scroll (no blank gaps)</li>
          <li>Footer app cards open the correct external URLs</li>
          <li>Social icons hide cleanly when a link is empty</li>
        </ul>
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <ExternalLink className="w-4 h-4" /> Open live site in new tab
        </a>
      </section>
    </div>
  );
}
