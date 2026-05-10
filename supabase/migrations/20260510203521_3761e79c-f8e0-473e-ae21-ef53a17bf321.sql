CREATE OR REPLACE FUNCTION public.get_public_contact()
RETURNS TABLE (
  email text,
  phone text,
  whatsapp text,
  address text,
  map_link text,
  social_links jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email, phone, whatsapp, address, map_link, social_links
  FROM public.contact_settings
  ORDER BY updated_at DESC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_contact() TO anon, authenticated;