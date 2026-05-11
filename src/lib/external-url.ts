/**
 * Normalize a user-provided URL so it always opens as an absolute external link.
 *
 * Without this, values like "github.com/foo" get treated as relative paths and
 * the browser appends them to the current origin (e.g. i.alii.uk/github.com/foo).
 */
export function toExternalUrl(raw: string | null | undefined): string {
  if (!raw) return "";
  const v = raw.trim();
  if (!v) return "";
  if (/^(https?:|mailto:|tel:)/i.test(v)) return v;
  if (v.startsWith("//")) return `https:${v}`;
  if (v.startsWith("/") || v.startsWith("#")) return v; // intentional internal/anchor
  return `https://${v.replace(/^\/+/, "")}`;
}
