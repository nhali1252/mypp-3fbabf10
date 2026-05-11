CREATE TABLE IF NOT EXISTS public.email_template_settings (
  template_key TEXT PRIMARY KEY,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

ALTER TABLE public.email_template_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read email template settings"
  ON public.email_template_settings FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert email template settings"
  ON public.email_template_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update email template settings"
  ON public.email_template_settings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.email_template_settings (template_key, settings) VALUES
  ('contact-confirmation', '{}'::jsonb),
  ('contact-notification', '{}'::jsonb)
ON CONFLICT (template_key) DO NOTHING;