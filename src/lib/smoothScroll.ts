/**
 * Smoothly scroll to an element by id (or the page top for "#" / "#home" / "/").
 * Accounts for the fixed nav offset so sections don't sit under the header.
 */
const NAV_OFFSET = 76;

export function smoothScrollToId(rawId: string): boolean {
  const id = rawId.replace(/^#/, "").trim();
  if (!id || id === "home" || id === "top") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return true;
  }
  const el = document.getElementById(id);
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  const top = rect.top + window.pageYOffset - NAV_OFFSET;
  window.scrollTo({ top, behavior: "smooth" });
  return true;
}

/** Returns true when the href points to an in-page anchor (e.g. "#about"). */
export function isHashLink(href: string | null | undefined): boolean {
  if (!href) return false;
  return href.startsWith("#") || href.startsWith("/#");
}

export function getHashTarget(href: string): string {
  const i = href.indexOf("#");
  return i >= 0 ? href.slice(i + 1) : "";
}
