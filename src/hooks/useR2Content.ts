/**
 * Client-side helper for reading content. Backed by Supabase via the
 * `getContent` server function (previously R2). The `useR2Content` name is
 * preserved so existing consumers continue to compile unchanged.
 */
import { useQuery } from "@tanstack/react-query";
import { getContent, type ContentKey } from "@/server/content.functions";

// Re-export under the legacy name so existing imports keep working.
export type R2ContentKey = ContentKey;

export function useR2Content<T = unknown>(
  key: ContentKey,
  opts?: { staleTime?: number; initialData?: T | null },
) {
  return useQuery({
    queryKey: ["r2-content", key],
    queryFn: async (): Promise<T | null> => {
      const res = await getContent({ data: { key } });
      return (res?.data ?? null) as T | null;
    },
    staleTime: opts?.staleTime ?? 60_000,
    initialData: opts?.initialData !== undefined ? (opts.initialData as T | null) : undefined,
  });
}
