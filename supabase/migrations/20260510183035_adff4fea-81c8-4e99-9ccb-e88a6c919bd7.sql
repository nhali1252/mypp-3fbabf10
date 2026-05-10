-- 1. contact_settings: drop public anon read; keep admin/editor write policies as-is.
DROP POLICY IF EXISTS "Public read contact_settings" ON public.contact_settings;

-- Allow authenticated admins/editors to read directly (for admin UI).
CREATE POLICY "Admins read contact_settings"
  ON public.contact_settings
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

-- 2. storage.objects: drop the over-broad authenticated write/delete/update policies on media.
DROP POLICY IF EXISTS "Media authenticated insert" ON storage.objects;
DROP POLICY IF EXISTS "Media authenticated update" ON storage.objects;
DROP POLICY IF EXISTS "Media authenticated delete" ON storage.objects;
-- "Admins upload media" / "Admins update media" / "Admins delete media" remain.
-- "Media authenticated read" remains so the admin MediaPicker can list assets.