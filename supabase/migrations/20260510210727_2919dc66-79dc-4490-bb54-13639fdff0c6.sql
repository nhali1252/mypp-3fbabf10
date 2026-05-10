ALTER TABLE public.heading_shimmer_settings
  ADD COLUMN IF NOT EXISTS disabled_paths text[] NOT NULL DEFAULT '{}';