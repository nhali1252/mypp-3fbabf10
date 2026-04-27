
CREATE TABLE public.footer_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  logo_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.footer_apps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read footer_apps" ON public.footer_apps FOR SELECT USING (true);
CREATE POLICY "Admins write footer_apps" ON public.footer_apps FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Editors update footer_apps" ON public.footer_apps FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'editor'::app_role))
  WITH CHECK (has_role(auth.uid(), 'editor'::app_role));

CREATE TRIGGER set_footer_apps_updated_at BEFORE UPDATE ON public.footer_apps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
