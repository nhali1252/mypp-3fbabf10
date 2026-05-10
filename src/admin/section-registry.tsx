/**
 * Maps `(pageSlug, sectionId)` -> editor component for the new admin shell.
 *
 * Each entry is keyed `"<slug>:<sectionId>"`. Anything not registered renders
 * a "coming next" placeholder.
 *
 * Strategy (Step 4): every section now resolves to either:
 *   - an inline editor (QuoteSectionEditor for the universal quote block), or
 *   - a SectionLink that opens the existing per-feature admin route.
 *
 * This gives the page-editor shell full coverage today while letting us
 * inline editors one-by-one in future steps without breaking anything.
 */
import type { ComponentType } from "react";
import QuoteSectionEditor from "@/components/admin/QuoteSectionEditor";
import HeroEditor from "@/components/admin/HeroEditor";
import { makeSectionLink } from "@/components/admin/SectionLink";

type SectionProps = { slug: string };
type SectionComponent = ComponentType<SectionProps>;

const HeroInline = () => <HeroEditor embedded />;

const REGISTRY: Record<string, SectionComponent> = {
  // ── Basic ─────────────────────────────────────────────────────────────
  "basic:hero": HeroInline,
  "basic:site-settings": makeSectionLink("/admin/settings", "Site settings", "Site name, theme, logo, favicon."),
  "basic:socials": makeSectionLink("/admin/contact", "Social links", "Managed alongside contact channels."),
  "home:quote": QuoteSectionEditor,
  "basic:quote": QuoteSectionEditor,

  // ── About / Skills ────────────────────────────────────────────────────
  "about:intro": makeSectionLink("/admin/about", "Intro & bio", "Title, intro, long bio, portrait."),
  "about:skills": makeSectionLink("/admin/skills", "Skills editor", "Skill chips and ordering."),
  "about:stats": makeSectionLink("/admin/about", "Stats", "Numeric highlights live in the About editor."),
  "about:activities": makeSectionLink("/admin/activities", "Activities editor"),
  "about:education": makeSectionLink("/admin/education", "Education editor"),
  "about:quote": QuoteSectionEditor,

  // ── Portfolio ─────────────────────────────────────────────────────────
  "portfolio:folders": makeSectionLink("/admin/folders", "Folders editor", "Top-level portfolio categories."),
  "portfolio:items": makeSectionLink("/admin/portfolio", "Portfolio items", "Add and reorder individual entries."),
  "portfolio:quote": QuoteSectionEditor,

  // ── Projects ──────────────────────────────────────────────────────────
  "projects:list": makeSectionLink("/admin/projects", "Projects editor", "Add, edit, reorder, publish projects."),
  "projects:quote": QuoteSectionEditor,

  // ── Services ──────────────────────────────────────────────────────────
  "services:list": makeSectionLink("/admin/slots", "Services editor", "Manage the services list."),
  "services:quote": QuoteSectionEditor,

  // ── Contact ───────────────────────────────────────────────────────────
  "contact:channels": makeSectionLink("/admin/contact", "Channels editor", "Email, phone, WhatsApp, address, map."),
  "contact:socials": makeSectionLink("/admin/contact", "Socials", "Per-page social handles."),
  "contact:quote": QuoteSectionEditor,

  // ── Reviews ───────────────────────────────────────────────────────────
  "reviews:list": makeSectionLink("/admin/reviews", "Testimonials editor", "Approve, feature, edit, hide reviews."),
  "reviews:quote": QuoteSectionEditor,
};

export function getSectionEditor(slug: string, sectionId: string): SectionComponent | null {
  return REGISTRY[`${slug}:${sectionId}`] ?? null;
}
