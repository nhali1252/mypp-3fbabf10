/**
 * Analytics maintenance — admin-only retention pruning for the page_views
 * table to prevent unbounded growth.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const prunePageViews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { days?: number }) =>
    z.object({ days: z.number().int().min(7).max(3650).default(90) }).parse(data),
  )
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { data: roles } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", userId);
    if (!roles?.some((r: any) => r.role === "admin")) {
      throw new Error("Admin only");
    }
    const cutoff = new Date(Date.now() - data.days * 86400_000).toISOString();
    const { error, count } = await supabaseAdmin
      .from("page_views")
      .delete({ count: "exact" })
      .lt("created_at", cutoff);
    if (error) throw new Error(error.message);
    return { deleted: count ?? 0, cutoff, days: data.days };
  });
