import { createClient } from "@supabase/supabase-js";
const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(url, key, { auth: { persistSession: false } });

const BUCKET = "media";

async function main() {
  // Recursively list and delete all objects
  async function rmDir(prefix: string) {
    let offset = 0;
    while (true) {
      const { data, error } = await admin.storage.from(BUCKET).list(prefix, {
        limit: 1000,
        offset,
        sortBy: { column: "name", order: "asc" },
      });
      if (error) throw error;
      if (!data || data.length === 0) break;

      const files: string[] = [];
      for (const item of data) {
        const path = prefix ? `${prefix}/${item.name}` : item.name;
        // Folders have id === null in Supabase Storage list output
        if ((item as any).id === null) {
          await rmDir(path);
        } else {
          files.push(path);
        }
      }
      if (files.length > 0) {
        const { error: delErr } = await admin.storage.from(BUCKET).remove(files);
        if (delErr) throw delErr;
        console.log(`Removed ${files.length} object(s) under "${prefix || "/"}"`);
      }
      if (data.length < 1000) break;
      offset += 1000;
    }
  }

  await rmDir("");

  // Delete the bucket itself
  const { error } = await admin.storage.deleteBucket(BUCKET);
  if (error) throw error;
  console.log(`Bucket "${BUCKET}" deleted.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
