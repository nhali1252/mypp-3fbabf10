/**
 * Backup server functions — export all content tables to a single JSON blob,
 * and optionally restore from one. Admin-only.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Tables that hold editable content. Excludes auth/email infra & logs.
const TABLES = [
  "site_settings", "seo_settings", "nav_links",
  "hero_content", "about_content", "activities", "education",
  "contact_settings", "footer_apps", "footer_cta", "footer_links",
  "launcher_hero", "launcher_pages", "page_loader_settings", "page_quotes",
  "portfolio_folders", "portfolio_items", "folders", "slots",
  "projects", "services",
  "f_hero", "f_photocard", "f_projects", "f_skills",
] as const;

export const exportBackup = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: roles } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", userId);
    if (!roles?.some((r: any) => r.role === "admin")) {
      throw new Error("Admin only");
    }
    const out: Record<string, any[]> = {};
    await Promise.all(
      TABLES.map(async (t) => {
        const { data, error } = await supabaseAdmin.from(t as any).select("*");
        if (error) throw new Error(`${t}: ${error.message}`);
        out[t] = data ?? [];
      }),
    );
    return {
      version: 1,
      exported_at: new Date().toISOString(),
      tables: out,
    };
  });

const importSchema = z.object({
  payload: z.object({
    version: z.number(),
    tables: z.record(z.string(), z.array(z.any())),
  }),
  mode: z.enum(["merge", "replace"]).default("merge"),
});

export const importBackup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => importSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: roles } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", userId);
    if (!roles?.some((r: any) => r.role === "admin")) {
      throw new Error("Admin only");
    }
    const results: { table: string; inserted: number; error?: string }[] = [];
    for (const t of TABLES) {
      const rows = data.payload.tables[t];
      if (!Array.isArray(rows)) continue;
      try {
        if (data.mode === "replace") {
          await supabaseAdmin.from(t as any).delete().not("id", "is", null);
        }
        if (rows.length) {
          const { error } = await supabaseAdmin
            .from(t as any)
            .upsert(rows as any, { onConflict: "id" });
          if (error) throw error;
        }
        results.push({ table: t, inserted: rows.length });
      } catch (e: any) {
        results.push({ table: t, inserted: 0, error: e.message });
      }
    }
    return { results };
  });
