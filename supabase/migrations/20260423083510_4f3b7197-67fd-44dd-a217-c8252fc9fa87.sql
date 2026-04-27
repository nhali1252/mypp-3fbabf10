INSERT INTO public.launcher_pages (label, title, subtitle, description, badge, route, accent, sort_order, active)
SELECT 'Contact', 'Contact', 'Start a project', 'Pick a slot, share a brief and I will reply within 24 hours.', 'Talk', '/contact', 'from-rose-500/40 to-orange-500/10', 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.launcher_pages WHERE route = '/contact');