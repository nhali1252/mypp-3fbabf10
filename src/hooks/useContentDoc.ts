/**
 * Client-side helper for reading content. Backed by Supabase via the
 * `getContent` server function.
 */
import { useQuery } from "@tanstack/react-query";
import { getContent, type ContentKey } from "@/server/content.functions";

export type { ContentKey };

export function useContentDoc<T = unknown>(
  key: ContentKey,
  opts?: { staleTime?: number; initialData?: T | null },
) {
  return useQuery({
    queryKey: ["content", key],
    queryFn: async (): Promise<T | null> => {
      const res = await getContent({ data: { key } });
      return (res?.data ?? null) as T | null;
    },
    staleTime: opts?.staleTime ?? 60_000,
    initialData: opts?.initialData !== undefined ? (opts.initialData as T | null) : undefined,
  });
}
