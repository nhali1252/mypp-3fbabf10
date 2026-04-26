-- Per-page quote/highlight blocks. One row per page slug.
CREATE TABLE public.page_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug text NOT NULL UNIQUE,
  eyebrow text,
  quote text NOT NULL DEFAULT '',
  author text,
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.page_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read page_quotes"
  ON public.page_quotes FOR SELECT
  USING (true);

CREATE POLICY "Admins manage page_quotes"
  ON public.page_quotes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Editors update page_quotes"
  ON public.page_quotes FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'editor'))
  WITH CHECK (public.has_role(auth.uid(), 'editor'));

CREATE TRIGGER page_quotes_set_updated_at
  BEFORE UPDATE ON public.page_quotes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed default quotes for the existing main pages.
INSERT INTO public.page_quotes (page_slug, eyebrow, quote, author) VALUES
  ('basic',     'Identity',    'Design is the silent ambassador of your brand.',                'Paul Rand'),
  ('about',     'Story',       'I don''t design pretty pictures — I design clarity, intent, and identity.', 'Ali Nur Hasan'),
  ('portfolio', 'Craft',       'Every project is a small bet. The portfolio is the proof.',     null),
  ('projects',  'Build',       'Ideas are easy. Shipping is the work.',                          null),
  ('services',  'Value',       'Good design is honest. Great design earns trust.',               'Dieter Rams'),
  ('contact',   'Connection',  'Great work starts with a conversation — say hi.',                null),
  ('reviews',   'Trust',       'The best reviews aren''t written. They''re shipped.',            null)
ON CONFLICT (page_slug) DO NOTHING;