CREATE OR REPLACE FUNCTION public.set_updated_at_now()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.heading_shimmer_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean NOT NULL DEFAULT true,
  intensity smallint NOT NULL DEFAULT 70,
  sweep_size smallint NOT NULL DEFAULT 200,
  speed_ms integer NOT NULL DEFAULT 4500,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT heading_shimmer_intensity_chk CHECK (intensity BETWEEN 0 AND 100),
  CONSTRAINT heading_shimmer_sweep_chk CHECK (sweep_size BETWEEN 100 AND 400),
  CONSTRAINT heading_shimmer_speed_chk CHECK (speed_ms BETWEEN 1000 AND 15000)
);

ALTER TABLE public.heading_shimmer_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read heading shimmer settings"
  ON public.heading_shimmer_settings FOR SELECT USING (true);

CREATE POLICY "Admins can insert heading shimmer settings"
  ON public.heading_shimmer_settings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update heading shimmer settings"
  ON public.heading_shimmer_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete heading shimmer settings"
  ON public.heading_shimmer_settings FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_heading_shimmer_updated_at
  BEFORE UPDATE ON public.heading_shimmer_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_now();

INSERT INTO public.heading_shimmer_settings (enabled, intensity, sweep_size, speed_ms)
VALUES (true, 70, 200, 4500);