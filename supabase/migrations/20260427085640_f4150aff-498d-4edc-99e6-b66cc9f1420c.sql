ALTER TABLE public.env_imports
  ADD COLUMN IF NOT EXISTS created_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS logs jsonb NOT NULL DEFAULT '[]'::jsonb;