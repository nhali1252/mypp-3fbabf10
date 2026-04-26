INSERT INTO public.seo_settings (page_key, meta_title, meta_description)
VALUES
  ('portfolio', 'Portfolio — Ali Nur Hasan (TasTaj)', 'Folder-style portfolio gallery synced from my portfolio CMS.'),
  ('projects', 'Projects — Ali Nur Hasan (TasTaj)', 'Selected work and projects by Ali Nur Hasan.'),
  ('about-and-skills', 'About & Skills — Ali Nur Hasan (TasTaj)', 'Designer with 2 years of design experience working with TasTaj — logo, banner, poster, product & basic web design.'),
  ('basic', 'Basic info — Ali Nur Hasan (TasTaj)', 'Basic info for Ali Nur Hasan (TasTaj) — graphic designer at TasTaj.'),
  ('services', 'Services — Ali Nur Hasan (TasTaj)', 'Brand identity, posters, banners and product visuals — built with intent.'),
  ('reviews', 'Client Reviews — Ali Nur Hasan (TasTaj)', 'Read what clients say and leave your own review.'),
  ('feed', 'Feed — Ali Nur Hasan (TasTaj)', 'A live social-style feed of every image and video uploaded across portfolio folders.'),
  ('contact', 'Contact — Ali Nur Hasan (TasTaj)', 'Start a project with Ali Nur Hasan. Share a brief, pick a call slot — replies within 24 hours.')
ON CONFLICT DO NOTHING;