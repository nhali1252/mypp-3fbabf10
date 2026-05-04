DROP POLICY IF EXISTS "Profiles viewable by authenticated" ON public.profiles;
CREATE POLICY "Profiles viewable by everyone"
ON public.profiles
FOR SELECT
TO public
USING (true);