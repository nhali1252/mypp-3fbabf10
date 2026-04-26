/**
 * Server functions backing the per-page quote/highlight block editor.
 * Admin/editor only — same role policy as other content writes.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdminOrEditor(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["admin", "editor"]);
  if (error) throw new Error("Role check failed");
  if (!data?.length) throw new Error("Forbidden — admin or editor role required");
}

const slugSchema = z.string().min(1).max(60).regex(/^[a-z0-9-]+$/, "lowercase, digits, hyphens only");

export type PageQuoteRow = {
  id: string;
  page_slug: string;
  eyebrow: string | null;
  quote: string;
  author: string | null;
  active: boolean;
  updated_at: string;
};

/** Read one page's quote row. Returns `null` if not yet created. */
export const getPageQuote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { slug: string }) =>
    z.object({ slug: slugSchema }).parse(data),
  )
  .handler(async ({ data, context }): Promise<PageQuoteRow | null> => {
    await assertAdminOrEditor(context.userId);
    const { data: row, error } = await supabaseAdmin
      .from("page_quotes")
      .select("*")
      .eq("page_slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (row as PageQuoteRow) ?? null;
  });

/** Upsert (create or update) a page's quote row. */
export const savePageQuote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    slug: string;
    eyebrow?: string | null;
    quote: string;
    author?: string | null;
    active: boolean;
  }) =>
    z
      .object({
        slug: slugSchema,
        eyebrow: z.string().max(80).nullable().optional(),
        quote: z.string().max(500),
        author: z.string().max(120).nullable().optional(),
        active: z.boolean(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdminOrEditor(context.userId);
    const { error } = await supabaseAdmin
      .from("page_quotes")
      .upsert(
        {
          page_slug: data.slug,
          eyebrow: data.eyebrow ?? null,
          quote: data.quote,
          author: data.author ?? null,
          active: data.active,
        },
        { onConflict: "page_slug" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });
