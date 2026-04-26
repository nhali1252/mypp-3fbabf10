CREATE OR REPLACE FUNCTION public.list_public_tables()
RETURNS TABLE(table_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.tablename::text
  FROM pg_catalog.pg_tables t
  WHERE t.schemaname = 'public'
$$;

REVOKE ALL ON FUNCTION public.list_public_tables() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_public_tables() TO authenticated;