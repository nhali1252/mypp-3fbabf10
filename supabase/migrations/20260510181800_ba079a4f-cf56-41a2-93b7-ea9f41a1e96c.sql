INSERT INTO public.page_quotes (page_slug, eyebrow, quote, author, active)
VALUES ('home', 'Welcome', 'Every great brand begins with a single, deliberate choice.', 'Ali Nur Hasan — TasTaj', true)
ON CONFLICT (page_slug) DO NOTHING;