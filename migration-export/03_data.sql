--
-- PostgreSQL database dump
--

\restrict 2tbcsQ1gCWyV3Lif9wTKQv9M7BNtaJVXfco0MuvMFtkPDWGgEV7ug8lYOpAYXiB

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: about_content; Type: TABLE DATA; Schema: public; Owner: -
--

SET SESSION AUTHORIZATION DEFAULT;

ALTER TABLE public.about_content DISABLE TRIGGER ALL;

INSERT INTO public.about_content (id, title, intro, bio, image_url, skills, stats, experience_summary, updated_at, page_key) VALUES ('82219b98-36f4-43f5-9a6a-75a26d249439', 'About me', 'BBA 3rd Year — Department of Marketing.', 'I am Ali Nur Hasan, a BBA 3rd Year student in the Department of Marketing at Habibullah Bahar College under National University (Session 2022–23). I am passionate about how businesses grow globally and how marketing drives long-term value. Beyond the classroom I focus on disciplined learning, digital productivity, business communication, teamwork, and professional development.', NULL, '["Marketing", "Business Awareness", "Communication", "Excel", "PowerPoint", "Google Workspace", "Problem Solving", "Teamwork", "Fast Learner", "Bengali — Native", "English — B2"]', '[{"label": "Year", "value": "3rd"}, {"label": "GPA HSC", "value": "4.00"}, {"label": "GPA SSC", "value": "4.67"}, {"label": "Languages", "value": "2"}]', 'Student · Self-learner · Community contributor', '2026-04-22 13:21:42.855685+00', 'F');
INSERT INTO public.about_content (id, title, intro, bio, image_url, skills, stats, experience_summary, updated_at, page_key) VALUES ('5c657b62-7516-4ce9-9d3c-7284e4b175d3', 'About me', 'BBA 3rd Year — Department of Marketing.', 'I am Ali Nur Hasan, a BBA 3rd Year student in the Department of Marketing at Habibullah Bahar College under National University (Session 2022–23). I am passionate about how businesses grow globally and how marketing drives long-term value. Beyond the classroom I focus on disciplined learning, digital productivity, business communication, teamwork, and professional development.', NULL, '["Marketing", "Business Awareness", "Communication", "Excel", "PowerPoint", "Google Workspace", "Problem Solving", "Teamwork", "Fast Learner", "Bengali — Native", "English — B2"]', '[{"label": "Year", "value": "3rd"}, {"label": "GPA HSC", "value": "4.00"}, {"label": "GPA SSC", "value": "4.67"}, {"label": "Languages", "value": "2"}]', 'Student · Self-learner · Community contributor', '2026-04-22 13:38:37.795891+00', 'P');
INSERT INTO public.about_content (id, title, intro, bio, image_url, skills, stats, experience_summary, updated_at, page_key) VALUES ('81d9d732-cdb7-4042-b9e1-6f20054fd429', 'About me', 'BBA 3rd Year — Department of Marketing.', 'I am Nur Hasan Ali, a BBA 3rd Year student in the Department of Marketing, Habibullah Bahar College, affiliated with National University (Session 2022–23). I am passionate about how businesses grow globally and how digital marketing drives long-term value. Beyond the classroom, I focus on disciplined learning, digital productivity, business communication, teamwork, and professional development.', NULL, '["Marketing", "Business Awareness", "Communication", "Excel", "PowerPoint", "Google Workspace", "Problem Solving", "Teamwork", "Fast Learner", "Bengali — Native", "English — B2"]', '[{"label": "Year", "value": "BBA 3rd"}, {"label": "GPA HSC", "value": "4.00"}, {"label": "GPA SSC", "value": "4.67"}, {"label": "Languages", "value": "2"}]', 'Student · Self-learner · Community contributor', '2026-04-23 12:22:53.502602+00', 'B');


ALTER TABLE public.about_content ENABLE TRIGGER ALL;

--
-- Data for Name: activities; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.activities DISABLE TRIGGER ALL;

INSERT INTO public.activities (id, title, period, description, tags, sort_order, active, created_at, updated_at) VALUES ('cbba35fb-ad6d-4311-88f8-440fd65d844c', 'BADHAN Blood Donation Club', '2021–2024', 'Organized donation drives, facilitated donor connections, and built communication and community-service skills.', '["Community", "Leadership", "Communication"]', 1, true, '2026-04-22 10:39:46.793093+00', '2026-04-22 10:39:46.793093+00');
INSERT INTO public.activities (id, title, period, description, tags, sort_order, active, created_at, updated_at) VALUES ('0b1c1057-3320-4eca-9a59-5d1e1f47f860', 'Bangladesh Scouts', '2014–2019', 'Led team activities, maintained discipline during events, and developed leadership across five structured years.', '["Discipline", "Teamwork", "Leadership"]', 2, true, '2026-04-22 10:39:46.793093+00', '2026-04-22 10:39:46.793093+00');
INSERT INTO public.activities (id, title, period, description, tags, sort_order, active, created_at, updated_at) VALUES ('29f5eec5-bd26-4c46-9777-ef963da34aa7', 'Self-directed Learning', NULL, 'Ongoing development via 10 Minute School, Udemy, and YouTube — business, management, and professional skills.', '["10 Minute School", "Udemy", "YouTube"]', 3, true, '2026-04-22 10:39:46.793093+00', '2026-04-22 10:39:46.793093+00');
INSERT INTO public.activities (id, title, period, description, tags, sort_order, active, created_at, updated_at) VALUES ('36c19661-4b11-4bb8-8eac-668a205c13bf', 'Workshops & Seminars', NULL, 'Participated in workshops on economic growth and business trends, with continued self-learning in digital business.', '["Workshops", "Seminars"]', 4, true, '2026-04-22 10:39:46.793093+00', '2026-04-22 10:39:46.793093+00');


ALTER TABLE public.activities ENABLE TRIGGER ALL;

--
-- Data for Name: contact_settings; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.contact_settings DISABLE TRIGGER ALL;

INSERT INTO public.contact_settings (id, email, phone, whatsapp, address, map_link, form_receiver_email, social_links, updated_at, page_key) VALUES ('c15bcbea-e4e7-4b72-a977-99c848bd88cc', 'nurha2u8@gmail.com', '+880 1635-281552', '', 'Dhaka, Bangladesh', NULL, 'nurha2u8@gmail.com', '{"github": "https:github.com/nhali1252", "facebook": "https://www.facebook.com/aluu.official", "linkedin": "", "telegram": "https://t.me/nh_ali_1", "whatsapp": "wa.me/+8801635281552", "instagram": "https://www.instagram.com/_uumma_a"}', '2026-04-23 12:24:55.804467+00', 'B');
INSERT INTO public.contact_settings (id, email, phone, whatsapp, address, map_link, form_receiver_email, social_links, updated_at, page_key) VALUES ('c37c8d65-5d24-4516-b3e3-85f774cb6cbe', 'info@alii.uk', '+880 1635-281552', '', 'Dhaka, Bangladesh', NULL, 'info@alii.uk', '{"github": "https:github.com/nhali1252", "facebook": "https://www.facebook.com/aluu.official", "linkedin": "", "telegram": "https://t.me/nh_ali_1", "whatsapp": "wa.me/+8801635281552", "instagram": "https://www.instagram.com/_uumma_a"}', '2026-04-23 12:25:11.118294+00', 'P');
INSERT INTO public.contact_settings (id, email, phone, whatsapp, address, map_link, form_receiver_email, social_links, updated_at, page_key) VALUES ('47778d19-8964-46be-a358-b73aa3910f7c', 'info@alii.uk', '+880 1635-281552', '', 'Dhaka, Bangladesh', NULL, 'info@alii.uk', '{"github": "https:github.com/nhali1252", "facebook": "https://www.facebook.com/aluu.official", "linkedin": "", "telegram": "https://t.me/nh_ali_1", "whatsapp": "wa.me/+8801635281552", "instagram": "https://www.instagram.com/_uumma_a"}', '2026-04-23 12:25:18.070701+00', 'F');


ALTER TABLE public.contact_settings ENABLE TRIGGER ALL;

--
-- Data for Name: education; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.education DISABLE TRIGGER ALL;

INSERT INTO public.education (id, degree, institution, university, period, gpa, description, sort_order, active, created_at, updated_at) VALUES ('6ca33851-489e-49bf-8328-a48f0249aed3', 'BBA — Department of Marketing', 'Habibullah Bahar College', 'National University', '3rd Year · Session 2022–23', NULL, 'Currently pursuing my Bachelor of Business Administration with a major in Marketing.', 1, true, '2026-04-22 10:39:46.793093+00', '2026-04-22 10:39:46.793093+00');
INSERT INTO public.education (id, degree, institution, university, period, gpa, description, sort_order, active, created_at, updated_at) VALUES ('7e290b11-f4b9-43c1-bee5-8820a0a96a97', 'Secondary School Certificate (SSC)', 'A. Malek Institution', NULL, '2014–2020', 'GPA 4.67 / 5.00', 'Group: Science', 3, true, '2026-04-22 10:39:46.793093+00', '2026-04-22 15:49:47.86192+00');
INSERT INTO public.education (id, degree, institution, university, period, gpa, description, sort_order, active, created_at, updated_at) VALUES ('06e11fb5-549d-4878-b919-ffcd67909b60', 'Higher Secondary Certificate (HSC)', 'Nawab Fayzunnesa Govt. College', NULL, '2020–2022', 'GPA 4.00 / 5.00', 'Group: Business Studies.', 2, true, '2026-04-22 10:39:46.793093+00', '2026-04-22 16:42:31.931414+00');


ALTER TABLE public.education ENABLE TRIGGER ALL;

--
-- Data for Name: env_imports; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.env_imports DISABLE TRIGGER ALL;



ALTER TABLE public.env_imports ENABLE TRIGGER ALL;

--
-- Data for Name: f_hero; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.f_hero DISABLE TRIGGER ALL;

INSERT INTO public.f_hero (id, headline, intro, eyebrow, highlight, updated_at) VALUES ('ce8a90e4-bf1a-4fe1-a16f-b94900573847', 'Designer with 2 years of design work with TasTaj.', 'I''m Ali Nur Hasan — a Designer with 2 years of design experience working with TasTaj. I create logos, banners, posters, product visuals and basic websites, blending Canva, Adobe tools and AI assistance to deliver clean, brand-ready work.', 'Skills · About · TasTaj', '2 years', '2026-04-22 14:23:33.497544+00');


ALTER TABLE public.f_hero ENABLE TRIGGER ALL;

--
-- Data for Name: f_photocard; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.f_photocard DISABLE TRIGGER ALL;

INSERT INTO public.f_photocard (id, name, role, badge_top, badge_bottom, open_label, image_url, updated_at) VALUES ('b7a6134d-79ee-42f5-b700-d014972915df', 'Ali Nur Hasan', 'Designer · TasTaj', '2 yrs', '✦ Designer', 'Open', 'https://mtddsbjuuzghzxlujnpi.supabase.co/storage/v1/object/public/media/profile/ali-portrait-v2.png', '2026-04-27 05:30:30.449993+00');


ALTER TABLE public.f_photocard ENABLE TRIGGER ALL;

--
-- Data for Name: f_projects; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.f_projects DISABLE TRIGGER ALL;

INSERT INTO public.f_projects (id, title, description, image_url, url, tags, sort_order, active, created_at, updated_at) VALUES ('2679ea05-9b84-4102-bb25-03677af74812', 'Pocketo', NULL, NULL, NULL, '["React", "TypeScript", "Finance"]', 1, false, '2026-04-23 08:52:02.762571+00', '2026-04-23 10:13:11.753109+00');
INSERT INTO public.f_projects (id, title, description, image_url, url, tags, sort_order, active, created_at, updated_at) VALUES ('4ff69708-45fb-4975-9cbc-052bf1cb4b59', 'Hazi Enterprise', NULL, NULL, NULL, '["Web", "CMS", "Business"]', 2, false, '2026-04-23 08:52:02.762571+00', '2026-04-23 10:13:17.102363+00');


ALTER TABLE public.f_projects ENABLE TRIGGER ALL;

--
-- Data for Name: f_skills; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.f_skills DISABLE TRIGGER ALL;

INSERT INTO public.f_skills (id, kind, title, description, icon, sort_order, active, created_at, updated_at) VALUES ('5940126f-044f-41ab-b10a-ebf5872154ff', 'design', 'Logo design', 'Clean, memorable identities.', 'Palette', 10, true, '2026-04-22 14:23:33.497544+00', '2026-04-22 14:23:33.497544+00');
INSERT INTO public.f_skills (id, kind, title, description, icon, sort_order, active, created_at, updated_at) VALUES ('792b43c7-3469-47b6-9f6b-0ba6ea1e6713', 'design', 'Logo making', 'Simple, sharp brand marks.', 'Brush', 20, true, '2026-04-22 14:23:33.497544+00', '2026-04-22 14:23:33.497544+00');
INSERT INTO public.f_skills (id, kind, title, description, icon, sort_order, active, created_at, updated_at) VALUES ('7a1dafc0-df67-4e09-953e-f0f13740a891', 'design', 'Banner design', 'Eye-catching promotional visuals.', 'Image', 30, true, '2026-04-22 14:23:33.497544+00', '2026-04-22 14:23:33.497544+00');
INSERT INTO public.f_skills (id, kind, title, description, icon, sort_order, active, created_at, updated_at) VALUES ('e17d0c9e-1d63-4ab5-bc34-c859e622bcbe', 'design', 'Product-level design', 'Polished visuals for products and promotions.', 'Layers', 40, true, '2026-04-22 14:23:33.497544+00', '2026-04-22 14:23:33.497544+00');
INSERT INTO public.f_skills (id, kind, title, description, icon, sort_order, active, created_at, updated_at) VALUES ('9797e321-11e4-46c0-ba27-4df643214e83', 'design', 'Poster design', 'Bold layouts with strong hierarchy.', 'Megaphone', 50, true, '2026-04-22 14:23:33.497544+00', '2026-04-22 14:23:33.497544+00');
INSERT INTO public.f_skills (id, kind, title, description, icon, sort_order, active, created_at, updated_at) VALUES ('79fc727c-4314-433d-8ae3-bcf270b40d35', 'design', 'Basic website design', 'Clear, modern, responsive layouts.', 'Globe', 60, true, '2026-04-22 14:23:33.497544+00', '2026-04-22 14:23:33.497544+00');
INSERT INTO public.f_skills (id, kind, title, description, icon, sort_order, active, created_at, updated_at) VALUES ('b7f3557c-178e-42d1-8556-d4919b4da809', 'design', 'Canva design', 'Practical graphics for everyday content.', 'Wand2', 70, true, '2026-04-22 14:23:33.497544+00', '2026-04-22 14:23:33.497544+00');
INSERT INTO public.f_skills (id, kind, title, description, icon, sort_order, active, created_at, updated_at) VALUES ('9a573476-1afd-4d3c-b2cc-07c0fedf55a1', 'design', 'Brand identity design', 'Consistent visual systems for brands.', 'Sparkles', 80, true, '2026-04-22 14:23:33.497544+00', '2026-04-22 14:23:33.497544+00');
INSERT INTO public.f_skills (id, kind, title, description, icon, sort_order, active, created_at, updated_at) VALUES ('4ce53c14-4adb-4f2a-ab68-0a2949c7c139', 'design', 'Layout & composition', 'Balanced structure and spacing.', 'Layout', 90, true, '2026-04-22 14:23:33.497544+00', '2026-04-22 14:23:33.497544+00');
INSERT INTO public.f_skills (id, kind, title, description, icon, sort_order, active, created_at, updated_at) VALUES ('594933d3-6972-44d7-93fb-2f89ae7eeaec', 'design', 'Typography selection', 'Strong text styling and type pairing.', 'Type', 100, true, '2026-04-22 14:23:33.497544+00', '2026-04-22 14:23:33.497544+00');
INSERT INTO public.f_skills (id, kind, title, description, icon, sort_order, active, created_at, updated_at) VALUES ('cbb9bdaa-382d-43aa-808a-d692908c7d8c', 'design', 'Visual communication', 'Turning ideas into visuals that are easy to understand.', 'Eye', 110, true, '2026-04-22 14:23:33.497544+00', '2026-04-22 14:23:33.497544+00');
INSERT INTO public.f_skills (id, kind, title, description, icon, sort_order, active, created_at, updated_at) VALUES ('d67b3c59-21b3-40d3-b5f8-b864e54be9b5', 'design', 'Creative concept dev.', 'Fresh directions built from goals and audience needs.', 'Brush', 120, true, '2026-04-22 14:23:33.497544+00', '2026-04-22 14:23:33.497544+00');
INSERT INTO public.f_skills (id, kind, title, description, icon, sort_order, active, created_at, updated_at) VALUES ('e5f364bd-e054-4dba-99c4-7a54a2870c80', 'design', 'Social media design sense', 'Scroll-stopping, platform-ready content.', 'Image', 130, true, '2026-04-22 14:23:33.497544+00', '2026-04-22 14:23:33.497544+00');
INSERT INTO public.f_skills (id, kind, title, description, icon, sort_order, active, created_at, updated_at) VALUES ('3696a58f-3640-497b-9151-38bdf3a34245', 'design', 'AI-assisted design workflow', 'Faster brainstorming and design exploration.', 'Wand2', 140, true, '2026-04-22 14:23:33.497544+00', '2026-04-22 14:23:33.497544+00');
INSERT INTO public.f_skills (id, kind, title, description, icon, sort_order, active, created_at, updated_at) VALUES ('7791754a-82ba-4345-b3bb-56ddfcefdeff', 'soft', 'Communication', 'Clear updates and smooth collaboration.', 'MessagesSquare', 10, true, '2026-04-22 14:23:33.497544+00', '2026-04-22 14:23:33.497544+00');
INSERT INTO public.f_skills (id, kind, title, description, icon, sort_order, active, created_at, updated_at) VALUES ('6bf0a4b6-3dcb-4fa3-93c8-653adf042dc6', 'soft', 'Client understanding', 'Design based on real needs.', 'HeartHandshake', 20, true, '2026-04-22 14:23:33.497544+00', '2026-04-22 14:23:33.497544+00');
INSERT INTO public.f_skills (id, kind, title, description, icon, sort_order, active, created_at, updated_at) VALUES ('3e964802-2b7f-453b-ac71-0fb72088d5a1', 'soft', 'Time management', 'Organized and on schedule.', 'Clock', 30, true, '2026-04-22 14:23:33.497544+00', '2026-04-22 14:23:33.497544+00');
INSERT INTO public.f_skills (id, kind, title, description, icon, sort_order, active, created_at, updated_at) VALUES ('5fb45839-7470-434b-ae2a-fbb5afa4298a', 'soft', 'Adaptability', 'Flexible to project changes.', 'Users', 40, true, '2026-04-22 14:23:33.497544+00', '2026-04-22 14:23:33.497544+00');
INSERT INTO public.f_skills (id, kind, title, description, icon, sort_order, active, created_at, updated_at) VALUES ('b0a38b12-0d4a-4711-88cb-84076d6bdec5', 'soft', 'Attention to detail', 'Polished, professional finishing.', 'Eye', 50, true, '2026-04-22 14:23:33.497544+00', '2026-04-22 14:23:33.497544+00');


ALTER TABLE public.f_skills ENABLE TRIGGER ALL;

--
-- Data for Name: feed_comments; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.feed_comments DISABLE TRIGGER ALL;



ALTER TABLE public.feed_comments ENABLE TRIGGER ALL;

--
-- Data for Name: feed_comment_reports; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.feed_comment_reports DISABLE TRIGGER ALL;



ALTER TABLE public.feed_comment_reports ENABLE TRIGGER ALL;

--
-- Data for Name: feed_reactions; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.feed_reactions DISABLE TRIGGER ALL;



ALTER TABLE public.feed_reactions ENABLE TRIGGER ALL;

--
-- Data for Name: folders; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.folders DISABLE TRIGGER ALL;



ALTER TABLE public.folders ENABLE TRIGGER ALL;

--
-- Data for Name: footer_apps; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.footer_apps DISABLE TRIGGER ALL;



ALTER TABLE public.footer_apps ENABLE TRIGGER ALL;

--
-- Data for Name: footer_cta; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.footer_cta DISABLE TRIGGER ALL;

INSERT INTO public.footer_cta (id, singleton, eyebrow, headline, subtext, primary_label, primary_url, show_email, email_label, show_whatsapp, whatsapp_label, show_call, call_label, active, updated_at) VALUES ('1cc27cfa-f24a-4e38-a647-135c5cdcd4a8', true, 'Start a project', 'Have a brief or an idea? Let''s talk.', 'Replies within 24 hours · Calls Mon–Fri', 'Start a project', '/contact', true, 'Email', false, 'WhatsApp', true, 'Call', true, '2026-04-23 10:10:17.473746+00');


ALTER TABLE public.footer_cta ENABLE TRIGGER ALL;

--
-- Data for Name: footer_links; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.footer_links DISABLE TRIGGER ALL;

INSERT INTO public.footer_links (id, label, url, sort_order, active) VALUES ('d711ae67-5285-4cd5-9950-8dc675393179', 'Privacy', '/privacy', 1, true);
INSERT INTO public.footer_links (id, label, url, sort_order, active) VALUES ('b6203d31-fd5a-418f-9d60-e38ad747f4cd', 'Terms', '/terms', 2, true);
INSERT INTO public.footer_links (id, label, url, sort_order, active) VALUES ('2da2dd06-5908-4312-9d11-caa2b98e284f', 'Contact', '#contact', 3, true);


ALTER TABLE public.footer_links ENABLE TRIGGER ALL;

--
-- Data for Name: hero_content; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.hero_content DISABLE TRIGGER ALL;

INSERT INTO public.hero_content (id, eyebrow, headline, subheadline, primary_cta_label, primary_cta_url, secondary_cta_label, secondary_cta_url, portrait_url, background_style, updated_at, page_key, backdrop_name) VALUES ('60c64907-8590-4ce2-ac55-d40d0f3b5176', 'BBA Marketing · 3rd Year', 'Marketing Student Exploring Branding, Business Communication & Digital Growth', 'Motivated learner passionate about how businesses grow, how brands connect, and how modern marketing creates long-term value.', 'Contact Me', '#contact', 'Learn More', '#about', NULL, 'dark', '2026-04-22 13:21:42.855685+00', 'F', NULL);
INSERT INTO public.hero_content (id, eyebrow, headline, subheadline, primary_cta_label, primary_cta_url, secondary_cta_label, secondary_cta_url, portrait_url, background_style, updated_at, page_key, backdrop_name) VALUES ('05094405-d1a2-40ef-93f7-c7ca83809947', 'BBA Marketing · 3rd Year', 'Marketing Student Exploring Branding, Business Communication & Digital Growth', 'Motivated learner passionate about how businesses grow, how brands connect, and how modern marketing creates long-term value.', 'Contact Me', '#contact', 'Learn More', '#about', NULL, 'dark', '2026-04-22 15:40:36.530631+00', 'B', 'Nur Hasan Ali');
INSERT INTO public.hero_content (id, eyebrow, headline, subheadline, primary_cta_label, primary_cta_url, secondary_cta_label, secondary_cta_url, portrait_url, background_style, updated_at, page_key, backdrop_name) VALUES ('1be84d24-1aa0-4157-8f41-f826e44c7be6', 'BBA Marketing · 3rd Year', 'Marketing Student Exploring Branding, Business Communication & Digital Growth', 'Motivated learner passionate about how businesses grow, how brands connect, and how modern marketing creates long-term value.', 'Contact Me', '#contact', 'Learn More', '#about', NULL, 'dark', '2026-04-23 12:23:35.743863+00', 'P', 'Ali');


ALTER TABLE public.hero_content ENABLE TRIGGER ALL;

--
-- Data for Name: launcher_hero; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.launcher_hero DISABLE TRIGGER ALL;

INSERT INTO public.launcher_hero (id, eyebrow, headline_top, headline_bottom, intro, updated_at) VALUES ('b484274e-6e7e-4724-be1f-8aa9c731475a', 'Portfolio · TasTaj', 'Pick a page', 'to explore more.', 'A curated launcher for Nur Hasan Ali''s portfolio. Each card opens an independent page .', '2026-04-23 10:24:25.021369+00');


ALTER TABLE public.launcher_hero ENABLE TRIGGER ALL;

--
-- Data for Name: launcher_pages; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.launcher_pages DISABLE TRIGGER ALL;

INSERT INTO public.launcher_pages (id, label, title, subtitle, description, badge, route, accent, thumbnail_url, sort_order, active, created_at, updated_at) VALUES ('010b6c0f-ab51-4054-944c-1811ad85bc0d', 'Contact', 'Contact', 'Start a project', 'Pick a slot, share a brief and I will reply within 24 hours.', 'Talk', '/contact', 'from-rose-500/40 to-orange-500/10', NULL, 6, true, '2026-04-23 08:35:07.344323+00', '2026-04-23 09:06:35.955114+00');
INSERT INTO public.launcher_pages (id, label, title, subtitle, description, badge, route, accent, thumbnail_url, sort_order, active, created_at, updated_at) VALUES ('4549e077-1bed-4a7f-a494-50423c3c8001', 'Person Info', 'Basic info', 'Personal introduction', 'Hero card with portrait, brand identity and the original portfolio overview.', 'Profile', '/basic', 'from-amber-400/40 to-rose-500/10', NULL, 1, true, '2026-04-22 13:59:49.930329+00', '2026-04-23 12:13:50.421931+00');
INSERT INTO public.launcher_pages (id, label, title, subtitle, description, badge, route, accent, thumbnail_url, sort_order, active, created_at, updated_at) VALUES ('0182f798-142b-4f3d-bd22-01996749637d', 'Skills and About', 'Skills & About', 'Design & craft', '2 years of design experience — logos, banners, posters, Canva and Adobe workflow.', 'Skills', '/about-and-skills', 'from-emerald-400/40 to-cyan-500/10', NULL, 2, true, '2026-04-22 13:59:49.930329+00', '2026-04-23 12:14:28.00652+00');
INSERT INTO public.launcher_pages (id, label, title, subtitle, description, badge, route, accent, thumbnail_url, sort_order, active, created_at, updated_at) VALUES ('51053135-deeb-4090-b5a3-9763c5aded6f', 'Portfolio', 'Portfolio', 'Client & design work', 'Branding, posters, packaging, invitations and digital design — selected client and TasTaj projects.', 'Work', '/portfolio', 'from-violet-500/40 to-fuchsia-500/10', NULL, 3, true, '2026-04-22 13:59:49.930329+00', '2026-04-23 12:14:42.25387+00');
INSERT INTO public.launcher_pages (id, label, title, subtitle, description, badge, route, accent, thumbnail_url, sort_order, active, created_at, updated_at) VALUES ('1d9cb434-dbf2-4750-82c2-cb2684894690', 'Projects', 'Projects', 'Personal & code projects', 'Pocketo personal-finance app, Hazi Enterprise automation site and other things I build with code.', 'Build', '/projects', 'from-emerald-400/40 to-cyan-500/10', NULL, 4, true, '2026-04-23 09:06:35.955114+00', '2026-04-23 12:14:54.245959+00');
INSERT INTO public.launcher_pages (id, label, title, subtitle, description, badge, route, accent, thumbnail_url, sort_order, active, created_at, updated_at) VALUES ('2143cace-f484-4d21-bdb4-83968f3ff136', 'Services', 'Services', 'What I offer', 'Editorial services page — branding, design systems and the modern toolkit I work with.', 'Offer', '/services', 'from-sky-500/40 to-indigo-500/10', NULL, 5, true, '2026-04-23 08:50:43.934865+00', '2026-04-23 12:15:03.890849+00');
INSERT INTO public.launcher_pages (id, label, title, subtitle, description, badge, route, accent, thumbnail_url, sort_order, active, created_at, updated_at) VALUES ('dfae9705-f786-4a7c-8ba0-ae75ed7ae926', 'Client Reviews', 'Reviews', 'What clients say', 'Read honest client reviews and leave your own — star ratings, comments, and real feedback.', 'Reviews', '/reviews', 'from-yellow-400/40 to-amber-500/10', NULL, 7, true, '2026-04-24 03:09:52.460429+00', '2026-04-24 03:09:52.460429+00');


ALTER TABLE public.launcher_pages ENABLE TRIGGER ALL;

--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.messages DISABLE TRIGGER ALL;

INSERT INTO public.messages (id, name, email, phone, subject, message, is_read, is_replied, created_at) VALUES ('b68ed163-786c-4558-a1bc-6bc12c9e4952', 'Hasan', 'a4mrhasan@gmail.com', NULL, 'Logo Design — Thambi', 'Required to create a Facebook professional thambi

Preferred call slot: Fri 24 Apr at 09:00', true, false, '2026-04-23 13:16:53.696569+00');


ALTER TABLE public.messages ENABLE TRIGGER ALL;

--
-- Data for Name: moderation_log; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.moderation_log DISABLE TRIGGER ALL;



ALTER TABLE public.moderation_log ENABLE TRIGGER ALL;

--
-- Data for Name: nav_links; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.nav_links DISABLE TRIGGER ALL;

INSERT INTO public.nav_links (id, label, url, sort_order, active) VALUES ('0ac20f26-0828-497c-9d9f-906a50206b82', 'Home', '#home', 1, true);
INSERT INTO public.nav_links (id, label, url, sort_order, active) VALUES ('1c6ebb7c-c38b-47b7-9c17-5c30a5f1a79e', 'About', '#about', 2, true);
INSERT INTO public.nav_links (id, label, url, sort_order, active) VALUES ('54567508-a84c-47b1-93e2-ff2397292d8c', 'Education', '#education', 3, true);
INSERT INTO public.nav_links (id, label, url, sort_order, active) VALUES ('82e639d8-1de1-449a-b33e-5f83252cc65e', 'Skills', '#skills', 4, true);
INSERT INTO public.nav_links (id, label, url, sort_order, active) VALUES ('b9583c54-7593-415c-8423-129de6a93d59', 'Work', '#portfolio', 5, true);
INSERT INTO public.nav_links (id, label, url, sort_order, active) VALUES ('5d4b8718-5856-4b37-83fe-3a876996fe11', 'Contact', '#contact', 6, true);


ALTER TABLE public.nav_links ENABLE TRIGGER ALL;

--
-- Data for Name: page_loader_settings; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.page_loader_settings DISABLE TRIGGER ALL;

INSERT INTO public.page_loader_settings (id, singleton, initial_ms, route_ms, default_label, default_tagline, routes, updated_at) VALUES ('078a224e-64f5-40d9-9222-947208df9923', true, 220, 220, '', '', '{"/": {"label": "Welcome", "tagline": "Pick a page to explore more✨"}, "/auth": {"label": "Sign in", "tagline": "Admin access"}, "/admin": {"label": "Admin", "tagline": "Content management"}, "/basic": {"label": "Basic info", "tagline": "About · Education · Activities"}, "/contact": {"label": "Contact", "tagline": "Start a project"}, "/reviews": {"label": "Client Reviews", "tagline": "Honest reviews from real clients"}, "/projects": {"label": "Projects", "tagline": "Personal & code projects"}, "/services": {"label": "Services", "tagline": "What I offer"}, "/portfolio": {"label": "Portfolio", "tagline": "Client & design work"}, "/about-and-skills": {"label": "Skills & About", "tagline": "Design · Tools · Workflow"}}', '2026-04-24 04:31:25.274448+00');


ALTER TABLE public.page_loader_settings ENABLE TRIGGER ALL;

--
-- Data for Name: page_quotes; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.page_quotes DISABLE TRIGGER ALL;

INSERT INTO public.page_quotes (id, page_slug, eyebrow, quote, author, active, updated_at) VALUES ('53c97cb0-623d-4806-b412-5d33854dd1a5', 'basic', 'Identity', 'Design is the silent ambassador of your brand.', 'Paul Rand', true, '2026-04-26 14:47:06.814879+00');
INSERT INTO public.page_quotes (id, page_slug, eyebrow, quote, author, active, updated_at) VALUES ('ec283bed-ec34-4866-a36c-2f035f2a757e', 'portfolio', 'Craft', 'Every project is a small bet. The portfolio is the proof.', NULL, true, '2026-04-26 14:47:06.814879+00');
INSERT INTO public.page_quotes (id, page_slug, eyebrow, quote, author, active, updated_at) VALUES ('57641636-e9df-4c3a-b85a-311e79db23cb', 'projects', 'Build', 'Ideas are easy. Shipping is the work.', NULL, true, '2026-04-26 14:47:06.814879+00');
INSERT INTO public.page_quotes (id, page_slug, eyebrow, quote, author, active, updated_at) VALUES ('ba671938-4dba-4a0d-8d2c-e626a5164fe2', 'services', 'Value', 'Good design is honest. Great design earns trust.', 'Dieter Rams', true, '2026-04-26 14:47:06.814879+00');
INSERT INTO public.page_quotes (id, page_slug, eyebrow, quote, author, active, updated_at) VALUES ('5719aae0-9b68-4b14-9256-0a429c81f410', 'contact', 'Connection', 'Great work starts with a conversation — say hi.', NULL, true, '2026-04-26 14:47:06.814879+00');
INSERT INTO public.page_quotes (id, page_slug, eyebrow, quote, author, active, updated_at) VALUES ('fd092a7b-083f-4dd6-b1c3-a7047a001d11', 'reviews', 'Trust', 'The best reviews aren''t written. They''re shipped.', NULL, true, '2026-04-26 14:47:06.814879+00');
INSERT INTO public.page_quotes (id, page_slug, eyebrow, quote, author, active, updated_at) VALUES ('865a9ea3-21b4-45c8-a8c8-e7fd64425395', 'about', 'Story', 'I don''t design pretty pictures — I design clarity, intent, and identity.', 'Nur Hasan Ali', true, '2026-04-26 15:02:16.316864+00');


ALTER TABLE public.page_quotes ENABLE TRIGGER ALL;

--
-- Data for Name: portfolio_folders; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.portfolio_folders DISABLE TRIGGER ALL;

INSERT INTO public.portfolio_folders (id, name, slug, description, icon, cover_url, sort_order, active, created_at, updated_at, parent_id) VALUES ('6b283561-6ebb-4564-a91c-3eadd81a588a', 'Banners', 'banners', 'Web banners & social cover art', NULL, NULL, 2, true, '2026-04-24 02:53:37.606423+00', '2026-04-24 02:53:37.606423+00', NULL);
INSERT INTO public.portfolio_folders (id, name, slug, description, icon, cover_url, sort_order, active, created_at, updated_at, parent_id) VALUES ('643e0b14-1910-4861-82bc-1088279044a7', 'Posters', 'posters', 'Posters, flyers and event print', NULL, NULL, 3, true, '2026-04-24 02:53:37.606423+00', '2026-04-24 02:53:37.606423+00', NULL);
INSERT INTO public.portfolio_folders (id, name, slug, description, icon, cover_url, sort_order, active, created_at, updated_at, parent_id) VALUES ('8e755c8d-748e-4f1b-b35e-17d64b430f57', 'Packaging', 'packaging', 'Packaging design & label artwork', NULL, NULL, 4, true, '2026-04-24 02:53:37.606423+00', '2026-04-24 02:53:37.606423+00', NULL);
INSERT INTO public.portfolio_folders (id, name, slug, description, icon, cover_url, sort_order, active, created_at, updated_at, parent_id) VALUES ('ca53667a-53ed-49ad-ac35-6042db0a8b9c', 'Invitations', 'invitations', 'Invitation suites & cards', NULL, NULL, 5, true, '2026-04-24 02:53:37.606423+00', '2026-04-24 02:53:37.606423+00', NULL);
INSERT INTO public.portfolio_folders (id, name, slug, description, icon, cover_url, sort_order, active, created_at, updated_at, parent_id) VALUES ('359bcae5-2ef1-4eb3-b002-02a15ec19c82', 'Social', 'social', 'Social media templates & campaigns', NULL, NULL, 6, true, '2026-04-24 02:53:37.606423+00', '2026-04-24 04:26:14.892955+00', NULL);
INSERT INTO public.portfolio_folders (id, name, slug, description, icon, cover_url, sort_order, active, created_at, updated_at, parent_id) VALUES ('13ae910c-6bf3-4835-afd3-9be58c74112b', 'Logos', 'logos', 'Logo design & brand marks', NULL, NULL, 1, true, '2026-04-24 02:53:37.606423+00', '2026-04-27 05:25:11.279126+00', NULL);


ALTER TABLE public.portfolio_folders ENABLE TRIGGER ALL;

--
-- Data for Name: portfolio_items; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.portfolio_items DISABLE TRIGGER ALL;



ALTER TABLE public.portfolio_items ENABLE TRIGGER ALL;

--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.profiles DISABLE TRIGGER ALL;



ALTER TABLE public.profiles ENABLE TRIGGER ALL;

--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.projects DISABLE TRIGGER ALL;

INSERT INTO public.projects (id, title, slug, image_url, gallery, category, summary, description, tools, live_url, github_url, featured, published, sort_order, created_at, updated_at, features) VALUES ('900b4fa5-94b8-4eb7-9a03-2f71fa2fb28d', 'MyPocketo — Personal Pocket Ledger', 'mypocketo', NULL, '[]', 'Personal Finance App', 'A clean, fast pocket ledger to track daily income, expenses, and savings — with smart summaries and a friendly mobile-first UI.', 'MyPocketo (p.alii.uk) is a personal pocket ledger built to make day-to-day money tracking effortless. Log income and expenses in seconds, organise by category, and view monthly summaries that actually make sense. Designed mobile-first with a calm, distraction-free interface.', '["React", "TypeScript", "Tailwind"]', 'https://p.alii.uk', NULL, true, true, 1, '2026-04-22 10:39:46.793093+00', '2026-04-27 05:25:11.279126+00', '[]');
INSERT INTO public.projects (id, title, slug, image_url, gallery, category, summary, description, tools, live_url, github_url, featured, published, sort_order, created_at, updated_at, features) VALUES ('c21d3446-2e82-45cd-9501-d3e266449b22', 'Hazi Enterprise (HE) — Business Automation', 'hazi-enterprise', NULL, '[]', 'Business Automation', 'A business automation platform that streamlines workflows, orders and operations for small enterprises with dashboards and smart integrations.', 'Hazi Enterprise (he.alii.uk) is a business automation platform built to remove repetitive work for small enterprises. It connects orders, customers, inventory and reports into one clean dashboard, with automation flows that handle the busywork in the background.', '["React", "TypeScript", "Automation", "Dashboards"]', 'https://he.alii.uk', NULL, true, true, 2, '2026-04-22 10:39:46.793093+00', '2026-04-27 05:25:11.279126+00', '[]');


ALTER TABLE public.projects ENABLE TRIGGER ALL;

--
-- Data for Name: seo_settings; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.seo_settings DISABLE TRIGGER ALL;

INSERT INTO public.seo_settings (id, page_key, meta_title, meta_description, og_image, keywords, updated_at) VALUES ('61ee349e-61e0-40d4-bb20-bfec909c9e01', 'home', 'Ali''s Portfolio', 'Explore the portfolio of Nur Hasan Ali, featuring creative design work, projects, skills, and professional profile details.', 'https://mtddsbjuuzghzxlujnpi.supabase.co/storage/v1/object/public/media/1776892509046-ho09qkwvdzr.svg', 'BBA Student, Marketing, Habibullah Bahar College, National University, Cumilla, Student Portfolio, Graphic Designer, Logo Designer, Brand Identity, Canva Design', '2026-04-23 10:14:37.806483+00');
INSERT INTO public.seo_settings (id, page_key, meta_title, meta_description, og_image, keywords, updated_at) VALUES ('0f9a354d-628d-4fe9-a12d-0d3df49f284f', 'portfolio', 'Portfolio — Ali Nur Hasan (TasTaj)', 'Folder-style portfolio gallery synced from my portfolio CMS.', NULL, NULL, '2026-04-26 17:41:10.427949+00');
INSERT INTO public.seo_settings (id, page_key, meta_title, meta_description, og_image, keywords, updated_at) VALUES ('1e068cc9-8ae5-4e1c-8df1-78d263afa267', 'projects', 'Projects — Ali Nur Hasan (TasTaj)', 'Selected work and projects by Ali Nur Hasan.', NULL, NULL, '2026-04-26 17:41:10.427949+00');
INSERT INTO public.seo_settings (id, page_key, meta_title, meta_description, og_image, keywords, updated_at) VALUES ('d44d0931-a84c-4bb8-81bc-ed2b9d45ea6e', 'about-and-skills', 'About & Skills — Ali Nur Hasan (TasTaj)', 'Designer with 2 years of design experience working with TasTaj — logo, banner, poster, product & basic web design.', NULL, NULL, '2026-04-26 17:41:10.427949+00');
INSERT INTO public.seo_settings (id, page_key, meta_title, meta_description, og_image, keywords, updated_at) VALUES ('6c5806f4-c275-4176-bbc8-534fa2b0ba19', 'basic', 'Basic info — Ali Nur Hasan (TasTaj)', 'Basic info for Ali Nur Hasan (TasTaj) — graphic designer at TasTaj.', NULL, NULL, '2026-04-26 17:41:10.427949+00');
INSERT INTO public.seo_settings (id, page_key, meta_title, meta_description, og_image, keywords, updated_at) VALUES ('0d988c9a-efab-4d47-8e98-87e9c4673bb1', 'services', 'Services — Ali Nur Hasan (TasTaj)', 'Brand identity, posters, banners and product visuals — built with intent.', NULL, NULL, '2026-04-26 17:41:10.427949+00');
INSERT INTO public.seo_settings (id, page_key, meta_title, meta_description, og_image, keywords, updated_at) VALUES ('c068495f-7b0b-4c59-a6e8-efa1be767306', 'reviews', 'Client Reviews — Ali Nur Hasan (TasTaj)', 'Read what clients say and leave your own review.', NULL, NULL, '2026-04-26 17:41:10.427949+00');
INSERT INTO public.seo_settings (id, page_key, meta_title, meta_description, og_image, keywords, updated_at) VALUES ('2e6d1f70-a10c-40e6-8252-7c3790eb1fcc', 'feed', 'Feed — Ali Nur Hasan (TasTaj)', 'A live social-style feed of every image and video uploaded across portfolio folders.', NULL, NULL, '2026-04-26 17:41:10.427949+00');
INSERT INTO public.seo_settings (id, page_key, meta_title, meta_description, og_image, keywords, updated_at) VALUES ('3151ec25-555c-4410-ac60-8f349ddb6267', 'contact', 'Contact — Ali Nur Hasan (TasTaj)', 'Start a project with Ali Nur Hasan. Share a brief, pick a call slot — replies within 24 hours.', NULL, NULL, '2026-04-26 17:41:10.427949+00');


ALTER TABLE public.seo_settings ENABLE TRIGGER ALL;

--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.services DISABLE TRIGGER ALL;

INSERT INTO public.services (id, title, description, icon, sort_order, active, created_at, updated_at) VALUES ('59faad29-91a7-4714-8834-de8caba85f82', 'Marketing & Business', 'Strategic solutions to grow your brand, increase visibility, and drive measurable business results through modern marketing techniques and data-driven insights.', 'Sparkles', 1, true, '2026-04-22 10:39:46.793093+00', '2026-04-23 10:20:11.103366+00');
INSERT INTO public.services (id, title, description, icon, sort_order, active, created_at, updated_at) VALUES ('44a27de4-a226-4676-8323-e3031e48098f', 'Digital Tools', 'Smart and efficient digital tools designed to simplify workflows, boost productivity, and enhance your overall digital experience.', 'Sparkles', 2, true, '2026-04-22 10:39:46.793093+00', '2026-04-23 10:20:24.780667+00');
INSERT INTO public.services (id, title, description, icon, sort_order, active, created_at, updated_at) VALUES ('dd27a22d-572c-4141-98f5-c1c01ccecf62', 'Personal Strengths', 'Strong communication, problem-solving, and adaptability skills that ensure reliable performance and effective collaboration in any environment.', 'Sparkles', 3, true, '2026-04-22 10:39:46.793093+00', '2026-04-23 10:20:35.239161+00');
INSERT INTO public.services (id, title, description, icon, sort_order, active, created_at, updated_at) VALUES ('c0564d94-5d40-418b-bb5d-56a37a28bbfd', 'Languages', 'Ability to communicate in multiple languages, enabling better connection with diverse audiences and improving global accessibility.', 'Sparkles', 4, true, '2026-04-22 10:39:46.793093+00', '2026-04-23 10:20:48.822412+00');


ALTER TABLE public.services ENABLE TRIGGER ALL;

--
-- Data for Name: site_settings; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.site_settings DISABLE TRIGGER ALL;

INSERT INTO public.site_settings (id, site_title, logo_url, favicon_url, theme_primary, footer_text, updated_at, site_name, primary_color, secondary_color, hero_title, hero_subtitle, page_key, welcome_animation_ms, default_motion_pref, section_visibility, reactions_enabled) VALUES ('6574f54d-da3a-43db-a04a-a00bc5aeaa63', 'Ali''s Portfolio', NULL, NULL, '#D9FF3D', '© 2026 Nur Hasan Ali', '2026-04-27 05:25:11.279126+00', 'NHA', NULL, NULL, 'Nur Hasan Ali', 'Designer · Developer · Maker', 'B', 600, 'auto', '{}', true);
INSERT INTO public.site_settings (id, site_title, logo_url, favicon_url, theme_primary, footer_text, updated_at, site_name, primary_color, secondary_color, hero_title, hero_subtitle, page_key, welcome_animation_ms, default_motion_pref, section_visibility, reactions_enabled) VALUES ('96127ef6-d302-40a5-a0ef-c58420b1a114', 'Ali''s Portfolio', NULL, NULL, '#D9FF3D', '© 2026 Nur Hasan Ali', '2026-04-27 05:25:11.279126+00', 'Ali''s Skills', NULL, NULL, 'Nur Hasan Ali', 'Designer · Developer · Maker', 'F', 600, 'auto', '{}', true);
INSERT INTO public.site_settings (id, site_title, logo_url, favicon_url, theme_primary, footer_text, updated_at, site_name, primary_color, secondary_color, hero_title, hero_subtitle, page_key, welcome_animation_ms, default_motion_pref, section_visibility, reactions_enabled) VALUES ('dbac2eaf-b9d2-45a9-819e-4e85de46f135', 'Ali''s Portfolio', NULL, NULL, '#D9FF3D', '© 2026 Nur Hasan Ali', '2026-04-27 05:25:11.279126+00', 'Ali''s Projects', NULL, NULL, 'Nur Hasan Ali', 'Designer · Developer · Maker', 'P', 600, 'auto', '{}', true);


ALTER TABLE public.site_settings ENABLE TRIGGER ALL;

--
-- Data for Name: slots; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.slots DISABLE TRIGGER ALL;



ALTER TABLE public.slots ENABLE TRIGGER ALL;

--
-- Data for Name: taxi_services; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.taxi_services DISABLE TRIGGER ALL;



ALTER TABLE public.taxi_services ENABLE TRIGGER ALL;

--
-- Data for Name: testimonials; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.testimonials DISABLE TRIGGER ALL;



ALTER TABLE public.testimonials ENABLE TRIGGER ALL;

--
-- Data for Name: ticker_items; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.ticker_items DISABLE TRIGGER ALL;

INSERT INTO public.ticker_items (id, text, sort_order, active, created_at) VALUES ('c2cd57e9-cc2c-46eb-bde7-99d6ff316158', 'BBA Marketing', 1, true, '2026-04-22 10:39:46.793093+00');
INSERT INTO public.ticker_items (id, text, sort_order, active, created_at) VALUES ('872b5a85-e074-4c80-8873-1a76603b8ff5', 'Habibullah Bahar College', 2, true, '2026-04-22 10:39:46.793093+00');
INSERT INTO public.ticker_items (id, text, sort_order, active, created_at) VALUES ('8cc06b5d-b152-4bf2-b9fd-61f0c4650172', 'Business Communications', 3, true, '2026-04-22 10:39:46.793093+00');
INSERT INTO public.ticker_items (id, text, sort_order, active, created_at) VALUES ('0aa1bb40-04f7-496e-8d0d-74ce557fe8bc', 'National University', 4, true, '2026-04-22 10:39:46.793093+00');
INSERT INTO public.ticker_items (id, text, sort_order, active, created_at) VALUES ('0df63b30-62d9-4036-83df-13df160efd72', 'Self Learner', 5, true, '2026-04-22 10:39:46.793093+00');
INSERT INTO public.ticker_items (id, text, sort_order, active, created_at) VALUES ('2a02c15d-7ae5-4d31-b074-ba01253abe3b', 'Community Leader', 6, true, '2026-04-22 10:39:46.793093+00');
INSERT INTO public.ticker_items (id, text, sort_order, active, created_at) VALUES ('84cddeee-c08e-4e1e-b479-b579fab55ca2', 'Dhaka, Bangladesh', 7, true, '2026-04-22 10:39:46.793093+00');


ALTER TABLE public.ticker_items ENABLE TRIGGER ALL;

--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.user_roles DISABLE TRIGGER ALL;

INSERT INTO public.user_roles (id, user_id, role, created_at, is_active) VALUES ('050f7b03-5f51-4e2d-9913-9e444546be28', '6495b0d8-8aa2-4f48-9978-fa0b5ff16a49', 'admin', '2026-04-22 13:08:24.803421+00', true);


ALTER TABLE public.user_roles ENABLE TRIGGER ALL;

--
-- PostgreSQL database dump complete
--

\unrestrict 2tbcsQ1gCWyV3Lif9wTKQv9M7BNtaJVXfco0MuvMFtkPDWGgEV7ug8lYOpAYXiB

