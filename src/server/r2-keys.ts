/** Compatibility shim — R2 has been removed. */
export const R2_KEYS = {} as Record<string, string>;
export const R2_ASSET_PREFIXES = {} as Record<string, string>;
export type R2ContentKey = import("./content.functions").ContentKey;
export type R2AssetFolder = import("./content.functions").AssetFolder;
export const FEED_INDEX_PAGE_SIZE = 24;
export function feedIndexPageKey(_opts?: unknown): string {
  return "";
}
