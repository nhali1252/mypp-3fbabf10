-- =========================================
-- ROLES
-- =========================================
CREATE TYPE public.app_role AS ENUM ('admin', 'editor');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- PROFILES
-- =========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- SINGLETON CONTENT TABLES
CREATE TABLE public.hero_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eyebrow TEXT,
  headline TEXT NOT NULL,
  subheadline TEXT,
  primary_cta_label TEXT DEFAULT 'Schedule a Call',
  primary_cta_url TEXT DEFAULT '#contact',
  secondary_cta_label TEXT DEFAULT 'Learn More',
  secondary_cta_url TEXT DEFAULT '#about',
  portrait_url TEXT,
  background_style TEXT DEFAULT 'dark',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hero_content ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER hero_updated BEFORE UPDATE ON public.hero_content FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.about_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  intro TEXT,
  bio TEXT,
  image_url TEXT,
  skills JSONB DEFAULT '[]'::jsonb,
  stats JSONB DEFAULT '[]'::jsonb,
  experience_summary TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.about_content ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER about_updated BEFORE UPDATE ON public.about_content FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.contact_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  address TEXT,
  map_link TEXT,
  form_receiver_email TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contact_settings ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER contact_updated BEFORE UPDATE ON public.contact_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_title TEXT NOT NULL DEFAULT 'Portfolio',
  logo_url TEXT,
  favicon_url TEXT,
  theme_primary TEXT DEFAULT '#D9FF3D',
  footer_text TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER site_updated BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- COLLECTIONS
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER services_updated BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  image_url TEXT,
  gallery JSONB DEFAULT '[]'::jsonb,
  category TEXT,
  summary TEXT,
  description TEXT,
  tools JSONB DEFAULT '[]'::jsonb,
  live_url TEXT,
  github_url TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  published BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER projects_updated BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  role TEXT,
  company TEXT,
  review TEXT NOT NULL,
  avatar_url TEXT,
  rating INT DEFAULT 5,
  published BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER testimonials_updated BEFORE UPDATE ON public.testimonials FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_replied BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.seo_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key TEXT UNIQUE NOT NULL,
  meta_title TEXT,
  meta_description TEXT,
  og_image TEXT,
  keywords TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.seo_settings ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER seo_updated BEFORE UPDATE ON public.seo_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.nav_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true
);
ALTER TABLE public.nav_links ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.footer_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true
);
ALTER TABLE public.footer_links ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  degree TEXT NOT NULL,
  institution TEXT,
  university TEXT,
  period TEXT,
  gpa TEXT,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER education_updated BEFORE UPDATE ON public.education FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  period TEXT,
  description TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER activities_updated BEFORE UPDATE ON public.activities FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.ticker_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ticker_items ENABLE ROW LEVEL SECURITY;

-- POLICIES
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'hero_content','about_content','contact_settings','site_settings',
    'services','projects','testimonials','seo_settings','nav_links','footer_links','media',
    'education','activities','ticker_items'
  ]) LOOP
    EXECUTE format('CREATE POLICY "Public read %1$s" ON public.%1$I FOR SELECT USING (true)', t);
    EXECUTE format('CREATE POLICY "Admins write %1$s" ON public.%1$I FOR ALL TO authenticated USING (public.has_role(auth.uid(), ''admin'')) WITH CHECK (public.has_role(auth.uid(), ''admin''))', t);
    EXECUTE format('CREATE POLICY "Editors update %1$s" ON public.%1$I FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), ''editor'')) WITH CHECK (public.has_role(auth.uid(), ''editor''))', t);
  END LOOP;
END $$;

CREATE POLICY "Anon can submit message" ON public.messages
  FOR INSERT TO anon
  WITH CHECK (
    length(name) BETWEEN 1 AND 200 AND
    length(email) BETWEEN 3 AND 320 AND
    length(message) BETWEEN 1 AND 5000
  );
CREATE POLICY "Authed can submit message" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    length(name) BETWEEN 1 AND 200 AND
    length(email) BETWEEN 3 AND 320 AND
    length(message) BETWEEN 1 AND 5000
  );
CREATE POLICY "Admins view messages" ON public.messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update messages" ON public.messages FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete messages" ON public.messages FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Admins upload media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update media" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));