-- Add editable per-project features list
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS features jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Add review moderation workflow
ALTER TABLE public.testimonials
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;

-- Allow anonymous public review submissions (always start as 'pending')
DROP POLICY IF EXISTS "Anon can submit testimonial" ON public.testimonials;
CREATE POLICY "Anon can submit testimonial"
ON public.testimonials
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(client_name) BETWEEN 1 AND 120
  AND length(review) BETWEEN 1 AND 2000
  AND status = 'pending'
  AND published = false
  AND featured = false
);