UPDATE public.page_quotes SET author='Let''s start a conversation' WHERE page_slug='contact' AND (author IS NULL OR author='');
UPDATE public.page_quotes SET author='Selected works · 2023–today' WHERE page_slug='portfolio' AND (author IS NULL OR author='');
UPDATE public.page_quotes SET author='From idea to shipped product' WHERE page_slug='projects' AND (author IS NULL OR author='');
UPDATE public.page_quotes SET author='What clients say after launch' WHERE page_slug='reviews' AND (author IS NULL OR author='');