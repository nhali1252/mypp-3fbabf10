CREATE TABLE public.heading_shimmer_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL UNIQUE,
  enabled boolean,
  intensity smallint,
  sweep_size smallint,
  speed_ms integer,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT path_starts_with_slash CHECK (path LIKE '/%'),
  CONSTRAINT intensity_range CHECK (intensity IS NULL OR (intensity >= 0 AND intensity <= 100)),
  CONSTRAINT sweep_range CHECK (sweep_size IS NULL OR (sweep_size >= 50 AND sweep_size <= 600)),
  CONSTRAINT speed_range CHECK (speed_ms IS NULL OR (speed_ms >= 500 AND speed_ms <= 30000))
);

ALTER TABLE public.heading_shimmer_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read shimmer overrides"
  ON public.heading_shimmer_overrides FOR SELECT
  TO public USING (true);

CREATE POLICY "Admins insert shimmer overrides"
  ON public.heading_shimmer_overrides FOR INSERT
  TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update shimmer overrides"
  ON public.heading_shimmer_overrides FOR UPDATE
  TO authenticated USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete shimmer overrides"
  ON public.heading_shimmer_overrides FOR DELETE
  TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_heading_shimmer_overrides_updated_at
  BEFORE UPDATE ON public.heading_shimmer_overrides
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_now();

CREATE INDEX idx_heading_shimmer_overrides_path ON public.heading_shimmer_overrides (path);