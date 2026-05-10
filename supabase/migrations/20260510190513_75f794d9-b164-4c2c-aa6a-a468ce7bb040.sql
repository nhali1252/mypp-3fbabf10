-- Replace overly broad public read with a filtered policy
DROP POLICY IF EXISTS "Public read testimonials" ON public.testimonials;

CREATE POLICY "Public read approved testimonials"
ON public.testimonials
FOR SELECT
TO anon, authenticated
USING (published = true AND status = 'approved');

-- Admins/editors can read everything (for moderation queue)
CREATE POLICY "Admins read all testimonials"
ON public.testimonials
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));