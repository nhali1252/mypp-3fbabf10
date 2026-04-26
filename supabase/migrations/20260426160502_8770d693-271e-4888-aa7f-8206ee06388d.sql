-- Append-only moderation audit log for comments and reviews
CREATE TABLE public.moderation_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  moderator_id uuid NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('comment','review')),
  target_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('approve','hide','delete','feature','reject','restore','publish','unpublish')),
  reason text,
  snapshot jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX moderation_log_target_idx ON public.moderation_log (target_type, target_id, created_at DESC);
CREATE INDEX moderation_log_moderator_idx ON public.moderation_log (moderator_id, created_at DESC);

ALTER TABLE public.moderation_log ENABLE ROW LEVEL SECURITY;

-- Admins can read the full audit trail
CREATE POLICY "Admins read moderation_log"
  ON public.moderation_log
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins and editors can append entries; moderator_id must match the caller
CREATE POLICY "Mods append to moderation_log"
  ON public.moderation_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = moderator_id
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'editor'::app_role)
    )
  );

-- No UPDATE / DELETE policies → table is append-only by RLS.
