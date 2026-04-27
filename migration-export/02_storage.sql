-- ============================================================================
-- 02_storage.sql -- Run AFTER 01_schema.sql
-- Creates the 'media' storage bucket + RLS policies on storage.objects.
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "Public read media" ON storage.objects;
CREATE POLICY "Public read media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

DROP POLICY IF EXISTS "Media authenticated read" ON storage.objects;
CREATE POLICY "Media authenticated read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'media');

DROP POLICY IF EXISTS "Media authenticated insert" ON storage.objects;
CREATE POLICY "Media authenticated insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS "Media authenticated update" ON storage.objects;
CREATE POLICY "Media authenticated update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'media');

DROP POLICY IF EXISTS "Media authenticated delete" ON storage.objects;
CREATE POLICY "Media authenticated delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'media');

DROP POLICY IF EXISTS "Admins upload media" ON storage.objects;
CREATE POLICY "Admins upload media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'media'
    AND (public.has_role(auth.uid(), 'admin'::public.app_role)
         OR public.has_role(auth.uid(), 'editor'::public.app_role))
  );

DROP POLICY IF EXISTS "Admins update media" ON storage.objects;
CREATE POLICY "Admins update media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'media'
    AND (public.has_role(auth.uid(), 'admin'::public.app_role)
         OR public.has_role(auth.uid(), 'editor'::public.app_role))
  );

DROP POLICY IF EXISTS "Admins delete media" ON storage.objects;
CREATE POLICY "Admins delete media"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'media'
    AND (public.has_role(auth.uid(), 'admin'::public.app_role)
         OR public.has_role(auth.uid(), 'editor'::public.app_role))
  );
