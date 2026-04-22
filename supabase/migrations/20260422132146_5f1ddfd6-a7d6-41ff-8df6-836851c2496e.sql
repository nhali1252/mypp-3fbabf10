-- Add page_key to page-scoped CMS tables
ALTER TABLE public.hero_content
  ADD COLUMN IF NOT EXISTS page_key text NOT NULL DEFAULT 'B';
ALTER TABLE public.about_content
  ADD COLUMN IF NOT EXISTS page_key text NOT NULL DEFAULT 'B';
ALTER TABLE public.contact_settings
  ADD COLUMN IF NOT EXISTS page_key text NOT NULL DEFAULT 'B';
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS page_key text NOT NULL DEFAULT 'B';

-- Tag existing rows explicitly
UPDATE public.hero_content SET page_key = 'B' WHERE page_key IS NULL OR page_key = '';
UPDATE public.about_content SET page_key = 'B' WHERE page_key IS NULL OR page_key = '';
UPDATE public.contact_settings SET page_key = 'B' WHERE page_key IS NULL OR page_key = '';
UPDATE public.site_settings SET page_key = 'B' WHERE page_key IS NULL OR page_key = '';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hero_content_page_key ON public.hero_content(page_key);
CREATE INDEX IF NOT EXISTS idx_about_content_page_key ON public.about_content(page_key);
CREATE INDEX IF NOT EXISTS idx_contact_settings_page_key ON public.contact_settings(page_key);
CREATE INDEX IF NOT EXISTS idx_site_settings_page_key ON public.site_settings(page_key);

-- Duplicate B rows into F so /F starts with the same base content
INSERT INTO public.hero_content (page_key, eyebrow, headline, subheadline, primary_cta_label, primary_cta_url, secondary_cta_label, secondary_cta_url, portrait_url, background_style)
SELECT 'F', eyebrow, headline, subheadline, primary_cta_label, primary_cta_url, secondary_cta_label, secondary_cta_url, portrait_url, background_style
FROM public.hero_content WHERE page_key = 'B'
AND NOT EXISTS (SELECT 1 FROM public.hero_content WHERE page_key = 'F')
LIMIT 1;

INSERT INTO public.about_content (page_key, title, intro, bio, image_url, skills, stats, experience_summary)
SELECT 'F', title, intro, bio, image_url, skills, stats, experience_summary
FROM public.about_content WHERE page_key = 'B'
AND NOT EXISTS (SELECT 1 FROM public.about_content WHERE page_key = 'F')
LIMIT 1;

INSERT INTO public.contact_settings (page_key, email, phone, whatsapp, address, map_link, form_receiver_email, social_links)
SELECT 'F', email, phone, whatsapp, address, map_link, form_receiver_email, social_links
FROM public.contact_settings WHERE page_key = 'B'
AND NOT EXISTS (SELECT 1 FROM public.contact_settings WHERE page_key = 'F')
LIMIT 1;

INSERT INTO public.site_settings (page_key, site_title, site_name, footer_text, theme_primary, favicon_url, logo_url, secondary_color, hero_title, hero_subtitle, primary_color)
SELECT 'F', site_title, site_name, footer_text, theme_primary, favicon_url, logo_url, secondary_color, hero_title, hero_subtitle, primary_color
FROM public.site_settings WHERE page_key = 'B'
AND NOT EXISTS (SELECT 1 FROM public.site_settings WHERE page_key = 'F')
LIMIT 1;