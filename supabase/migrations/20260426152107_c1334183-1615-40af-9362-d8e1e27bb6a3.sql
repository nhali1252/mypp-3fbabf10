-- Feed social: reactions, threaded comments, reports
-- Plus: verified-user flag on profiles, per-item watermark override.

-- 1) Profile flags ---------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false;

-- 2) Per-item watermark override ------------------------------------------
ALTER TABLE public.portfolio_items
  ADD COLUMN IF NOT EXISTS watermark_text text;

-- 3) Reactions -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feed_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction text NOT NULL CHECK (reaction IN ('like','fire','love','wow')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (item_id, user_id, reaction)
);
CREATE INDEX IF NOT EXISTS idx_feed_reactions_item ON public.feed_reactions (item_id);
CREATE INDEX IF NOT EXISTS idx_feed_reactions_user ON public.feed_reactions (user_id);

ALTER TABLE public.feed_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read reactions"
  ON public.feed_reactions FOR SELECT TO public USING (true);

CREATE POLICY "Auth users add own reactions"
  ON public.feed_reactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own reactions"
  ON public.feed_reactions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins delete any reaction"
  ON public.feed_reactions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4) Comments --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feed_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.feed_comments(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 1000),
  status text NOT NULL DEFAULT 'visible' CHECK (status IN ('visible','hidden','reported','deleted')),
  edited_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_feed_comments_item ON public.feed_comments (item_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_comments_parent ON public.feed_comments (parent_id);
CREATE INDEX IF NOT EXISTS idx_feed_comments_user ON public.feed_comments (user_id);

ALTER TABLE public.feed_comments ENABLE ROW LEVEL SECURITY;

-- Public sees only visible. Authors see their own regardless. Admins see all.
CREATE POLICY "Public read visible comments"
  ON public.feed_comments FOR SELECT TO public
  USING (status = 'visible');

CREATE POLICY "Authors read own comments"
  ON public.feed_comments FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins read all comments"
  ON public.feed_comments FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Auth users insert own comments"
  ON public.feed_comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authors update own recent comments"
  ON public.feed_comments FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND created_at > now() - interval '15 minutes')
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins update any comment"
  ON public.feed_comments FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authors delete own comments"
  ON public.feed_comments FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins delete any comment"
  ON public.feed_comments FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
DROP TRIGGER IF EXISTS feed_comments_set_updated_at ON public.feed_comments;
CREATE TRIGGER feed_comments_set_updated_at
  BEFORE UPDATE ON public.feed_comments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5) Comment reports -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feed_comment_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.feed_comments(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (length(reason) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (comment_id, reporter_id)
);

ALTER TABLE public.feed_comment_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reporters read own reports"
  ON public.feed_comment_reports FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id);

CREATE POLICY "Admins read all reports"
  ON public.feed_comment_reports FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Auth users file reports"
  ON public.feed_comment_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins delete reports"
  ON public.feed_comment_reports FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
