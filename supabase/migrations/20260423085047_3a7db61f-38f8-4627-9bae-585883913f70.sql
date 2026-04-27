-- Update Projects launcher card to point to /portfolio
UPDATE launcher_pages SET route = '/portfolio', label = 'Portfolio', title = 'Portfolio', subtitle = 'Selected work', description = 'Folder-style gallery of selected design and dev work.', badge = 'Work' WHERE route = '/projects';

-- Insert Services launcher card if missing
INSERT INTO launcher_pages (label, title, subtitle, description, badge, route, accent, sort_order, active)
SELECT 'Services', 'Services', 'What I offer', 'Editorial services page — branding, design systems and the modern toolkit I work with.', 'Offer', '/services', 'from-sky-500/40 to-indigo-500/10', 4, true
WHERE NOT EXISTS (SELECT 1 FROM launcher_pages WHERE route = '/services');