import { useEffect } from "react";
import { getHashTarget, isHashLink, smoothScrollToId } from "@/lib/smoothScroll";

/**
 * Global click interceptor: any anchor whose href is "#section" or "/#section"
 * gets smooth-scrolled instead of doing a hard browser jump. Modifier-clicks
 * (cmd/ctrl/shift/middle-mouse) and external links are left untouched.
 */
export function useSmoothAnchors() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      const a = target?.closest("a") as HTMLAnchorElement | null;
      if (!a) return;
      if (a.target && a.target !== "" && a.target !== "_self") return;

      const rawHref = a.getAttribute("href");
      if (!isHashLink(rawHref)) return;

      const id = getHashTarget(rawHref!);
      if (!id) return;

      if (smoothScrollToId(id)) {
        e.preventDefault();
        // Update the URL hash without triggering another jump.
        if (history.replaceState) {
          history.replaceState(null, "", `#${id}`);
        }
      }
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
}
