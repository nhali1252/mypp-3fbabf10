/**
 * Compatibility shim. R2 has been removed — these names now resolve to the
 * Supabase-backed `content.functions.ts`. Kept so existing imports across
 * admin pages continue to compile while the revert is in progress.
 */
export {
  getContent,
  submitReview,
  listAssets,
  deleteAsset,
  uploadAsset,
} from "./content.functions";
export type { ContentKey, AssetFolder } from "./content.functions";

// presignUpload no longer exists (Supabase Storage uses direct proxy upload).
// Provide a stub so legacy imports don't crash the bundle; calling it throws.
export const presignUpload = async (): Promise<never> => {
  throw new Error(
    "presignUpload is no longer available — use uploadAsset (server-side proxy) instead.",
  );
};
