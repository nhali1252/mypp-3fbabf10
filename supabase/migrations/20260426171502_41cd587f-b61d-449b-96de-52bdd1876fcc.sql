ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS reactions_enabled boolean NOT NULL DEFAULT true;