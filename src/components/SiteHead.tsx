import { useEffect } from "react";
import { useSiteSettings } from "@/hooks/useContent";

/**
 * Applies the admin-managed site_title and favicon_url to the live document.
 * Mounted once at the root so every page reflects the current branding.
 */
export function SiteHead() {
  const { data } = useSiteSettings();

  useEffect(() => {
    if (!data) return;

    // Browser tab title
    const title = (data.site_title || "").trim();
    if (title) document.title = title;

    // Favicon (replace any existing rel=icon links)
    const href = (data.favicon_url || "").trim();
    if (href) {
      document
        .querySelectorAll<HTMLLinkElement>(
          "link[rel='icon'], link[rel='shortcut icon'], link[rel='apple-touch-icon']",
        )
        .forEach((el) => el.parentNode?.removeChild(el));

      const icon = document.createElement("link");
      icon.rel = "icon";
      icon.href = href;
      document.head.appendChild(icon);

      const apple = document.createElement("link");
      apple.rel = "apple-touch-icon";
      apple.href = href;
      document.head.appendChild(apple);
    }
  }, [data?.site_title, data?.favicon_url]);

  return null;
}
