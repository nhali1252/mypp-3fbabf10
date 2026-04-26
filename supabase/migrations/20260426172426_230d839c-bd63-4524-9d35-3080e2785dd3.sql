ALTER TABLE public.portfolio_folders
  ADD COLUMN IF NOT EXISTS parent_id uuid NULL
  REFERENCES public.portfolio_folders(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_portfolio_folders_parent_id
  ON public.portfolio_folders(parent_id);