/**
 * Public SEO loader — fetches `seo_settings` row by `page_key` for use in
 * route loaders + head() builders. RLS is public-read so no auth needed.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabasePublic } from "@/integrations/supabase/client.public";

export type SeoRow = {
  page_key: string;
  meta_title: string | null;
  meta_description: string | null;
  og_image: string | null;
  keywords: string | null;
};

export const getSeo = createServerFn({ method: "GET" })
  .inputValidator((data: { key: string }) =>
    z.object({ key: z.string().min(1).max(60) }).parse(data),
  )
  .handler(async ({ data }): Promise<SeoRow | null> => {
    const { data: row, error } = await supabasePublic
      .from("seo_settings")
      .select("page_key, meta_title, meta_description, og_image, keywords")
      .eq("page_key", data.key)
      .maybeSingle();
    if (error) return null;
    return (row as SeoRow) ?? null;
  });
