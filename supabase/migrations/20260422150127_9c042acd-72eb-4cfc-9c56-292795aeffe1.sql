CREATE TABLE IF NOT EXISTS public.f_photocard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Ali Nur Hasan',
  role text NOT NULL DEFAULT 'Designer · TasTaj',
  badge_top text DEFAULT '2 yrs',
  badge_bottom text DEFAULT '✦ Designer',
  open_label text DEFAULT 'Open',
  image_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.f_photocard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read f_photocard" ON public.f_photocard
  FOR SELECT TO public USING (true);

CREATE POLICY "Admins manage f_photocard" ON public.f_photocard
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Editors update f_photocard" ON public.f_photocard
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'editor'::app_role))
  WITH CHECK (has_role(auth.uid(), 'editor'::app_role));

CREATE TRIGGER set_f_photocard_updated_at
  BEFORE UPDATE ON public.f_photocard
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.f_photocard (name, role, badge_top, badge_bottom, open_label)
SELECT 'Ali Nur Hasan', 'Designer · TasTaj', '2 yrs', '✦ Designer', 'Open'
WHERE NOT EXISTS (SELECT 1 FROM public.f_photocard);

ALTER PUBLICATION supabase_realtime ADD TABLE public.f_photocard;