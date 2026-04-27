CREATE TABLE public.env_imports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  success boolean NOT NULL,
  started_at timestamp with time zone NOT NULL,
  finished_at timestamp with time zone NOT NULL,
  expected_count integer NOT NULL,
  present_count integer NOT NULL,
  missing jsonb NOT NULL DEFAULT '[]'::jsonb,
  vars jsonb NOT NULL DEFAULT '[]'::jsonb,
  db_check jsonb NOT NULL DEFAULT '{}'::jsonb,
  source text NOT NULL DEFAULT 'cloudflare-worker'
);

ALTER TABLE public.env_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read env_imports"
ON public.env_imports
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_env_imports_created_at ON public.env_imports (created_at DESC);