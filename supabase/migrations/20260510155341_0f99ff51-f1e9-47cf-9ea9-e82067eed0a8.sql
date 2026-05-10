ALTER TABLE public.site_settings ALTER COLUMN welcome_animation_ms SET DEFAULT 2000;
UPDATE public.site_settings SET welcome_animation_ms = 2000 WHERE welcome_animation_ms = 600;