
CREATE TABLE public.page_loader_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  initial_ms integer NOT NULL DEFAULT 250,
  route_ms integer NOT NULL DEFAULT 250,
  default_label text NOT NULL DEFAULT '',
  default_tagline text NOT NULL DEFAULT '',
  routes jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.page_loader_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read page_loader_settings"
  ON public.page_loader_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins manage page_loader_settings"
  ON public.page_loader_settings FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Editors update page_loader_settings"
  ON public.page_loader_settings FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'editor'::app_role))
  WITH CHECK (has_role(auth.uid(), 'editor'::app_role));

CREATE TRIGGER trg_page_loader_settings_updated
  BEFORE UPDATE ON public.page_loader_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.page_loader_settings (singleton, initial_ms, route_ms, default_label, default_tagline, routes)
VALUES (
  true, 250, 250, '', '',
  '{
    "/": {"label":"Welcome","tagline":"Pick a page to explore"},
    "/basic": {"label":"Basic info","tagline":"About · Education · Activities"},
    "/about-and-skills": {"label":"Skills & About","tagline":"Design · Tools · Workflow"},
    "/portfolio": {"label":"Portfolio","tagline":"Client & design work"},
    "/projects": {"label":"Projects","tagline":"Personal & code projects"},
    "/services": {"label":"Services","tagline":"What I offer"},
    "/services-design": {"label":"Design Services","tagline":"Branding · Identity · Print"},
    "/contact": {"label":"Contact","tagline":"Start a project"},
    "/auth": {"label":"Sign in","tagline":"Admin access"},
    "/reset-password": {"label":"Reset password","tagline":"Account recovery"},
    "/admin": {"label":"Admin","tagline":"Content management"}
  }'::jsonb
);
