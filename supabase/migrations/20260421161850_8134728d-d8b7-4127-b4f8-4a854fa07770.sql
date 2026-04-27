DROP POLICY IF EXISTS "Media public read" ON storage.objects;

CREATE POLICY "Media authenticated read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'media');