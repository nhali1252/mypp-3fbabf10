UPDATE public.site_settings
SET site_name = 'Ali Nur Hasan',
    site_title = 'Ali Nur Hasan — Portfolio',
    hero_title = COALESCE(NULLIF(hero_title, ''), 'Ali Nur Hasan'),
    hero_subtitle = 'Designer · Developer · Maker',
    footer_text = COALESCE(NULLIF(footer_text, ''), '© ' || EXTRACT(YEAR FROM now())::text || ' Ali Nur Hasan'),
    updated_at = now();

-- Ensure at least one row exists for the default page_key
INSERT INTO public.site_settings (page_key, site_name, site_title, hero_subtitle, footer_text)
SELECT 'B', 'Ali Nur Hasan', 'Ali Nur Hasan — Portfolio', 'Designer · Developer · Maker', '© ' || EXTRACT(YEAR FROM now())::text || ' Ali Nur Hasan'
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings);