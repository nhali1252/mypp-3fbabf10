ALTER TABLE public.portfolio_items
  ADD COLUMN IF NOT EXISTS show_in_feed boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS feed_caption text,
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_portfolio_items_featured
  ON public.portfolio_items (featured)
  WHERE featured = true;

CREATE INDEX IF NOT EXISTS idx_portfolio_items_show_in_feed
  ON public.portfolio_items (show_in_feed)
  WHERE show_in_feed = true;