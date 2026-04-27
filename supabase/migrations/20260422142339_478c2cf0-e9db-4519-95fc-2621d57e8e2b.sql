-- /F hero content
CREATE TABLE public.f_hero (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  headline text NOT NULL DEFAULT 'Designer with 2 years of design work with TasTaj.',
  intro text NOT NULL DEFAULT 'I''m Ali Nur Hasan — a Designer with 2 years of design experience working with TasTaj. I create logos, banners, posters, product visuals and basic websites, blending Canva, Adobe tools and AI assistance to deliver clean, brand-ready work.',
  eyebrow text NOT NULL DEFAULT 'Skills · About · TasTaj',
  highlight text NOT NULL DEFAULT '2 years',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.f_hero ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read f_hero" ON public.f_hero FOR SELECT USING (true);
CREATE POLICY "Admins manage f_hero" ON public.f_hero FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER f_hero_set_updated_at BEFORE UPDATE ON public.f_hero
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.f_hero DEFAULT VALUES;

-- /F skills + working-style cards
CREATE TABLE public.f_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'design' CHECK (kind IN ('design','soft')),
  title text NOT NULL,
  description text,
  icon text NOT NULL DEFAULT 'Sparkles',
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.f_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read f_skills" ON public.f_skills FOR SELECT
  USING (active OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage f_skills" ON public.f_skills FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER f_skills_set_updated_at BEFORE UPDATE ON public.f_skills
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX f_skills_kind_order_idx ON public.f_skills (kind, sort_order);

-- /F mini portfolio / weekly project items
CREATE TABLE public.f_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text,
  url text,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.f_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read f_projects" ON public.f_projects FOR SELECT
  USING (active OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage f_projects" ON public.f_projects FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER f_projects_set_updated_at BEFORE UPDATE ON public.f_projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX f_projects_order_idx ON public.f_projects (sort_order);

-- Realtime
ALTER TABLE public.f_hero REPLICA IDENTITY FULL;
ALTER TABLE public.f_skills REPLICA IDENTITY FULL;
ALTER TABLE public.f_projects REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.f_hero;
ALTER PUBLICATION supabase_realtime ADD TABLE public.f_skills;
ALTER PUBLICATION supabase_realtime ADD TABLE public.f_projects;

-- Seed: design skills
INSERT INTO public.f_skills (kind, title, description, icon, sort_order) VALUES
  ('design','Logo design','Clean, memorable identities.','Palette',10),
  ('design','Logo making','Simple, sharp brand marks.','Brush',20),
  ('design','Banner design','Eye-catching promotional visuals.','Image',30),
  ('design','Product-level design','Polished visuals for products and promotions.','Layers',40),
  ('design','Poster design','Bold layouts with strong hierarchy.','Megaphone',50),
  ('design','Basic website design','Clear, modern, responsive layouts.','Globe',60),
  ('design','Canva design','Practical graphics for everyday content.','Wand2',70),
  ('design','Brand identity design','Consistent visual systems for brands.','Sparkles',80),
  ('design','Layout & composition','Balanced structure and spacing.','Layout',90),
  ('design','Typography selection','Strong text styling and type pairing.','Type',100),
  ('design','Visual communication','Turning ideas into visuals that are easy to understand.','Eye',110),
  ('design','Creative concept dev.','Fresh directions built from goals and audience needs.','Brush',120),
  ('design','Social media design sense','Scroll-stopping, platform-ready content.','Image',130),
  ('design','AI-assisted design workflow','Faster brainstorming and design exploration.','Wand2',140);

-- Seed: working style
INSERT INTO public.f_skills (kind, title, description, icon, sort_order) VALUES
  ('soft','Communication','Clear updates and smooth collaboration.','MessagesSquare',10),
  ('soft','Client understanding','Design based on real needs.','HeartHandshake',20),
  ('soft','Time management','Organized and on schedule.','Clock',30),
  ('soft','Adaptability','Flexible to project changes.','Users',40),
  ('soft','Attention to detail','Polished, professional finishing.','Eye',50);