
-- New: dedicated portfolio CMS (folders + items inside each folder)
CREATE TABLE IF NOT EXISTS public.portfolio_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon text,
  cover_url text,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.portfolio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id uuid NOT NULL REFERENCES public.portfolio_folders(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  image_url text,
  external_url text,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_items_folder ON public.portfolio_items(folder_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_sort ON public.portfolio_items(folder_id, sort_order);

ALTER TABLE public.portfolio_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_items   ENABLE ROW LEVEL SECURITY;

-- Public read (active only, admins see all)
CREATE POLICY "Public read portfolio_folders" ON public.portfolio_folders
  FOR SELECT USING (active OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Public read portfolio_items" ON public.portfolio_items
  FOR SELECT USING (active OR has_role(auth.uid(), 'admin'::app_role));

-- Admin write
CREATE POLICY "Admins manage portfolio_folders" ON public.portfolio_folders
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage portfolio_items" ON public.portfolio_items
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Editors can update
CREATE POLICY "Editors update portfolio_folders" ON public.portfolio_folders
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'editor'::app_role))
  WITH CHECK (has_role(auth.uid(), 'editor'::app_role));
CREATE POLICY "Editors update portfolio_items" ON public.portfolio_items
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'editor'::app_role))
  WITH CHECK (has_role(auth.uid(), 'editor'::app_role));

-- updated_at triggers (reuse existing public.set_updated_at)
CREATE TRIGGER trg_portfolio_folders_updated
  BEFORE UPDATE ON public.portfolio_folders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_portfolio_items_updated
  BEFORE UPDATE ON public.portfolio_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed initial folders from f_skills design categories so the public
-- /portfolio page shows folders immediately (Step 6 requirement: folder
-- names must come from /about-and-skills). Admin can edit/add later.
INSERT INTO public.portfolio_folders (name, slug, description, sort_order)
VALUES
  ('Logos',        'logos',        'Logo design & brand marks',                 1),
  ('Banners',      'banners',      'Web banners & social cover art',            2),
  ('Posters',      'posters',      'Posters, flyers and event print',           3),
  ('Packaging',    'packaging',    'Packaging design & label artwork',          4),
  ('Invitations',  'invitations',  'Invitation suites & cards',                 5),
  ('Social',       'social',       'Social media templates & campaigns',        6)
ON CONFLICT (slug) DO NOTHING;
