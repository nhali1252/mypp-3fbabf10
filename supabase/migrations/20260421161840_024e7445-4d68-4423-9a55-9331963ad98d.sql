DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Media public read') THEN
    CREATE POLICY "Media public read" ON storage.objects
      FOR SELECT USING (bucket_id = 'media');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Media authenticated insert') THEN
    CREATE POLICY "Media authenticated insert" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'media');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Media authenticated update') THEN
    CREATE POLICY "Media authenticated update" ON storage.objects
      FOR UPDATE TO authenticated
      USING (bucket_id = 'media');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Media authenticated delete') THEN
    CREATE POLICY "Media authenticated delete" ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'media');
  END IF;
END $$;