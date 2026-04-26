ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS welcome_animation_ms integer NOT NULL DEFAULT 600,
  ADD COLUMN IF NOT EXISTS default_motion_pref text NOT NULL DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS section_visibility jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.site_settings
  DROP CONSTRAINT IF EXISTS site_settings_default_motion_pref_check;
ALTER TABLE public.site_settings
  ADD CONSTRAINT site_settings_default_motion_pref_check
  CHECK (default_motion_pref IN ('on','off','auto'));

ALTER TABLE public.site_settings
  DROP CONSTRAINT IF EXISTS site_settings_welcome_ms_check;
ALTER TABLE public.site_settings
  ADD CONSTRAINT site_settings_welcome_ms_check
  CHECK (welcome_animation_ms BETWEEN 0 AND 5000);