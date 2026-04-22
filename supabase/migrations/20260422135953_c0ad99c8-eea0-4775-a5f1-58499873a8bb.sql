CREATE TABLE public.launcher_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  title text NOT NULL,
  subtitle text,
  description text,
  badge text,
  route text NOT NULL,
  accent text DEFAULT 'from-primary/40 to-primary/10',
  thumbnail_url text,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.launcher_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read launcher_pages"
  ON public.launcher_pages FOR SELECT
  USING (active = true OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admins write launcher_pages"
  ON public.launcher_pages FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Editors update launcher_pages"
  ON public.launcher_pages FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'editor'::app_role))
  WITH CHECK (has_role(auth.uid(), 'editor'::app_role));

CREATE TRIGGER launcher_pages_updated_at
  BEFORE UPDATE ON public.launcher_pages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.launcher_pages (label, title, subtitle, description, badge, route, accent, sort_order, active) VALUES
  ('Page B', 'Basic info', 'Personal introduction', 'Hero card with portrait, brand identity and the original portfolio overview.', 'Profile', '/B', 'from-amber-400/40 to-rose-500/10', 1, true),
  ('Page F', 'Skills & About', 'Graphic design craft', '7 years of design experience — logos, banners, posters, Canva and Adobe workflow.', 'Skills', '/F', 'from-emerald-400/40 to-cyan-500/10', 2, true),
  ('Page P', 'Projects', 'Selected work', 'My Pocketo personal finance app and Hazi Enterprise business automation site.', 'Work', '/P', 'from-violet-500/40 to-fuchsia-500/10', 3, true);