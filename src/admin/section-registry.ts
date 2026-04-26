/**
 * Maps `(pageSlug, sectionId)` -> editor component for the new admin shell.
 *
 * Each entry is keyed `"<slug>:<sectionId>"`. Anything not registered renders
 * a "coming next" placeholder — that's intentional so we can migrate editors
 * one-by-one without breaking the shell.
 *
 * Step 3 ships only the universal `quote` editor for every page. Step 4 will
 * fill in the rest by importing the existing per-feature editors.
 */
import type { ComponentType } from "react";
import QuoteSectionEditor from "@/components/admin/QuoteSectionEditor";

type SectionProps = { slug: string };
type SectionComponent = ComponentType<SectionProps>;

const REGISTRY: Record<string, SectionComponent> = {
  // Universal — every page has this section.
  "basic:quote": QuoteSectionEditor,
  "about:quote": QuoteSectionEditor,
  "portfolio:quote": QuoteSectionEditor,
  "projects:quote": QuoteSectionEditor,
  "services:quote": QuoteSectionEditor,
  "contact:quote": QuoteSectionEditor,
  "reviews:quote": QuoteSectionEditor,
};

export function getSectionEditor(slug: string, sectionId: string): SectionComponent | null {
  return REGISTRY[`${slug}:${sectionId}`] ?? null;
}
