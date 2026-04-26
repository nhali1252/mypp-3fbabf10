/**
 * Client-side helper for reading R2 content JSON files via the
 * `getContent` server function. Cached per-key by React Query in the hooks
 * that consume it.
 */
import { useQuery } from "@tanstack/react-query";
import { getContent } from "@/server/r2.functions";
import type { R2ContentKey } from "@/server/r2-keys";

export function useR2Content<T = unknown>(
  key: R2ContentKey,
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
