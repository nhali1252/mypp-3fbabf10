CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  service text,
  preferred_date date NOT NULL,
  preferred_time text,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can submit booking"
  ON public.bookings FOR INSERT TO anon
  WITH CHECK (
    length(name) BETWEEN 1 AND 200
    AND length(email) BETWEEN 3 AND 320
    AND (service IS NULL OR length(service) <= 200)
    AND (notes IS NULL OR length(notes) <= 5000)
  );

CREATE POLICY "Authed can submit booking"
  ON public.bookings FOR INSERT TO authenticated
  WITH CHECK (
    length(name) BETWEEN 1 AND 200
    AND length(email) BETWEEN 3 AND 320
    AND (service IS NULL OR length(service) <= 200)
    AND (notes IS NULL OR length(notes) <= 5000)
  );

CREATE POLICY "Admins view bookings"
  ON public.bookings FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update bookings"
  ON public.bookings FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete bookings"
  ON public.bookings FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER bookings_set_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX bookings_created_at_idx ON public.bookings (created_at DESC);
CREATE INDEX bookings_status_idx ON public.bookings (status);