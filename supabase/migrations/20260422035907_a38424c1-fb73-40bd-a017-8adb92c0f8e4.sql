-- ============================================================
-- V8 merge: idempotent schema additions for the existing project
-- ============================================================

-- 1) New site_settings columns (V8 added 6 fields)
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS site_name TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS primary_color TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS secondary_color TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS hero_title TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS hero_subtitle TEXT;

-- 2) user_roles.is_active flag (V8 migration 3)
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- 3) Admins view all profiles (V8 migration 3)
DROP POLICY IF EXISTS "Admins view all profiles" ON public.profiles;
CREATE POLICY "Admins view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4) Service CMS schema: folders / slots / taxi_services
CREATE TABLE IF NOT EXISTS public.folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  status boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS folders_updated ON public.folders;
CREATE TRIGGER folders_updated BEFORE UPDATE ON public.folders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP POLICY IF EXISTS "Public read folders" ON public.folders;
CREATE POLICY "Public read folders" ON public.folders FOR SELECT
  USING (status = true OR public.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY IF EXISTS "Admins manage folders" ON public.folders;
CREATE POLICY "Admins manage folders" ON public.folders FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TABLE IF NOT EXISTS public.slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id uuid NOT NULL REFERENCES public.folders(id) ON DELETE CASCADE,
  title text NOT NULL,
  subtitle text,
  type text,
  highlight_text text,
  contact_number text,
  whatsapp_number text,
  card_size text NOT NULL DEFAULT 'medium',
  sort_order integer NOT NULL DEFAULT 0,
  status boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS slots_folder_idx ON public.slots(folder_id);
ALTER TABLE public.slots ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS slots_updated ON public.slots;
CREATE TRIGGER slots_updated BEFORE UPDATE ON public.slots
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP POLICY IF EXISTS "Public read slots" ON public.slots;
CREATE POLICY "Public read slots" ON public.slots FOR SELECT
  USING (status = true OR public.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY IF EXISTS "Admins manage slots" ON public.slots;
CREATE POLICY "Admins manage slots" ON public.slots FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TABLE IF NOT EXISTS public.taxi_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id uuid NOT NULL REFERENCES public.slots(id) ON DELETE CASCADE,
  service_name text NOT NULL,
  description text,
  price text,
  duration text,
  features jsonb DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  status boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS taxi_services_slot_idx ON public.taxi_services(slot_id);
ALTER TABLE public.taxi_services ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS taxi_services_updated ON public.taxi_services;
CREATE TRIGGER taxi_services_updated BEFORE UPDATE ON public.taxi_services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP POLICY IF EXISTS "Public read taxi_services" ON public.taxi_services;
CREATE POLICY "Public read taxi_services" ON public.taxi_services FOR SELECT
  USING (status = true OR public.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY IF EXISTS "Admins manage taxi_services" ON public.taxi_services;
CREATE POLICY "Admins manage taxi_services" ON public.taxi_services FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));