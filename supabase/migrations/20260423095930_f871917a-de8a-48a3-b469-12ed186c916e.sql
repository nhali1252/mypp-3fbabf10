
CREATE TABLE public.footer_cta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  eyebrow text NOT NULL DEFAULT 'Start a project',
  headline text NOT NULL DEFAULT 'Have a brief or an idea? Let''s talk.',
  subtext text NOT NULL DEFAULT 'Replies within 24 hours · Calls Mon–Fri',
  primary_label text NOT NULL DEFAULT 'Start a project',
  primary_url text NOT NULL DEFAULT '/contact',
  show_email boolean NOT NULL DEFAULT true,
  email_label text NOT NULL DEFAULT 'Email',
  show_whatsapp boolean NOT NULL DEFAULT true,
  whatsapp_label text NOT NULL DEFAULT 'WhatsApp',
  show_call boolean NOT NULL DEFAULT true,
  call_label text NOT NULL DEFAULT 'Call',
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.footer_cta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read footer_cta"
  ON public.footer_cta FOR SELECT USING (true);

CREATE POLICY "Admins manage footer_cta"
  ON public.footer_cta FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Editors update footer_cta"
  ON public.footer_cta FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'editor'::app_role))
  WITH CHECK (has_role(auth.uid(), 'editor'::app_role));

CREATE TRIGGER trg_footer_cta_updated
  BEFORE UPDATE ON public.footer_cta
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.footer_cta DEFAULT VALUES;
