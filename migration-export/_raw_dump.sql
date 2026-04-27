--
-- PostgreSQL database dump
--

\restrict 8SxXUHzabmqS2pR6Xd1OBYfLhUL0YeOkqdTRZQKs955I4aHqUq91t7LOI8KlAIe

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'editor'
);


--
-- Name: grant_first_user_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.grant_first_user_admin() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END; $$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;


--
-- Name: list_public_tables(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.list_public_tables() RETURNS TABLE(table_name text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT t.tablename::text
  FROM pg_catalog.pg_tables t
  WHERE t.schemaname = 'public'
$$;


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;


SET default_table_access_method = heap;

--
-- Name: about_content; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.about_content (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    intro text,
    bio text,
    image_url text,
    skills jsonb DEFAULT '[]'::jsonb,
    stats jsonb DEFAULT '[]'::jsonb,
    experience_summary text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    page_key text DEFAULT 'B'::text NOT NULL
);


--
-- Name: activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    period text,
    description text,
    tags jsonb DEFAULT '[]'::jsonb,
    sort_order integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: contact_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text,
    phone text,
    whatsapp text,
    address text,
    map_link text,
    form_receiver_email text,
    social_links jsonb DEFAULT '{}'::jsonb,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    page_key text DEFAULT 'B'::text NOT NULL
);


--
-- Name: education; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.education (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    degree text NOT NULL,
    institution text,
    university text,
    period text,
    gpa text,
    description text,
    sort_order integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: env_imports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.env_imports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    success boolean NOT NULL,
    started_at timestamp with time zone NOT NULL,
    finished_at timestamp with time zone NOT NULL,
    expected_count integer NOT NULL,
    present_count integer NOT NULL,
    missing jsonb DEFAULT '[]'::jsonb NOT NULL,
    vars jsonb DEFAULT '[]'::jsonb NOT NULL,
    db_check jsonb DEFAULT '{}'::jsonb NOT NULL,
    source text DEFAULT 'cloudflare-worker'::text NOT NULL,
    created_count integer DEFAULT 0 NOT NULL,
    updated_count integer DEFAULT 0 NOT NULL,
    logs jsonb DEFAULT '[]'::jsonb NOT NULL
);


--
-- Name: f_hero; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.f_hero (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    headline text DEFAULT 'Designer with 2 years of design work with TasTaj.'::text NOT NULL,
    intro text DEFAULT 'I''m Ali Nur Hasan — a Designer with 2 years of design experience working with TasTaj. I create logos, banners, posters, product visuals and basic websites, blending Canva, Adobe tools and AI assistance to deliver clean, brand-ready work.'::text NOT NULL,
    eyebrow text DEFAULT 'Skills · About · TasTaj'::text NOT NULL,
    highlight text DEFAULT '2 years'::text NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.f_hero REPLICA IDENTITY FULL;


--
-- Name: f_photocard; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.f_photocard (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text DEFAULT 'Ali Nur Hasan'::text NOT NULL,
    role text DEFAULT 'Designer · TasTaj'::text NOT NULL,
    badge_top text DEFAULT '2 yrs'::text,
    badge_bottom text DEFAULT '✦ Designer'::text,
    open_label text DEFAULT 'Open'::text,
    image_url text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: f_projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.f_projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    image_url text,
    url text,
    tags jsonb DEFAULT '[]'::jsonb NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.f_projects REPLICA IDENTITY FULL;


--
-- Name: f_skills; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.f_skills (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    kind text DEFAULT 'design'::text NOT NULL,
    title text NOT NULL,
    description text,
    icon text DEFAULT 'Sparkles'::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT f_skills_kind_check CHECK ((kind = ANY (ARRAY['design'::text, 'soft'::text])))
);

ALTER TABLE ONLY public.f_skills REPLICA IDENTITY FULL;


--
-- Name: feed_comment_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feed_comment_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    comment_id uuid NOT NULL,
    reporter_id uuid NOT NULL,
    reason text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT feed_comment_reports_reason_check CHECK (((length(reason) >= 1) AND (length(reason) <= 500)))
);


--
-- Name: feed_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feed_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    item_id text NOT NULL,
    user_id uuid NOT NULL,
    parent_id uuid,
    body text NOT NULL,
    status text DEFAULT 'visible'::text NOT NULL,
    edited_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT feed_comments_body_check CHECK (((length(body) >= 1) AND (length(body) <= 1000))),
    CONSTRAINT feed_comments_status_check CHECK ((status = ANY (ARRAY['visible'::text, 'hidden'::text, 'reported'::text, 'deleted'::text])))
);


--
-- Name: feed_reactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feed_reactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    item_id text NOT NULL,
    user_id uuid NOT NULL,
    reaction text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT feed_reactions_reaction_check CHECK ((reaction = ANY (ARRAY['like'::text, 'fire'::text, 'love'::text, 'wow'::text])))
);


--
-- Name: folders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.folders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    icon text,
    sort_order integer DEFAULT 0 NOT NULL,
    status boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: footer_apps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.footer_apps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    url text NOT NULL,
    logo_url text,
    sort_order integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: footer_cta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.footer_cta (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    singleton boolean DEFAULT true NOT NULL,
    eyebrow text DEFAULT 'Start a project'::text NOT NULL,
    headline text DEFAULT 'Have a brief or an idea? Let''s talk.'::text NOT NULL,
    subtext text DEFAULT 'Replies within 24 hours · Calls Mon–Fri'::text NOT NULL,
    primary_label text DEFAULT 'Start a project'::text NOT NULL,
    primary_url text DEFAULT '/contact'::text NOT NULL,
    show_email boolean DEFAULT true NOT NULL,
    email_label text DEFAULT 'Email'::text NOT NULL,
    show_whatsapp boolean DEFAULT true NOT NULL,
    whatsapp_label text DEFAULT 'WhatsApp'::text NOT NULL,
    show_call boolean DEFAULT true NOT NULL,
    call_label text DEFAULT 'Call'::text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: footer_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.footer_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    label text NOT NULL,
    url text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL
);


--
-- Name: hero_content; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hero_content (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    eyebrow text,
    headline text NOT NULL,
    subheadline text,
    primary_cta_label text DEFAULT 'Schedule a Call'::text,
    primary_cta_url text DEFAULT '#contact'::text,
    secondary_cta_label text DEFAULT 'Learn More'::text,
    secondary_cta_url text DEFAULT '#about'::text,
    portrait_url text,
    background_style text DEFAULT 'dark'::text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    page_key text DEFAULT 'B'::text NOT NULL,
    backdrop_name text
);


--
-- Name: launcher_hero; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.launcher_hero (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    eyebrow text DEFAULT 'Portfolio · TasTaj'::text NOT NULL,
    headline_top text DEFAULT 'Pick a page'::text NOT NULL,
    headline_bottom text DEFAULT 'to explore.'::text NOT NULL,
    intro text DEFAULT 'A curated launcher for Ali Nur Hasan''s portfolio. Each card opens an independent page — managed and editable from the admin panel.'::text NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: launcher_pages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.launcher_pages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    label text NOT NULL,
    title text NOT NULL,
    subtitle text,
    description text,
    badge text,
    route text NOT NULL,
    accent text DEFAULT 'from-primary/40 to-primary/10'::text,
    thumbnail_url text,
    sort_order integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    subject text,
    message text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    is_replied boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: moderation_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.moderation_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    moderator_id uuid NOT NULL,
    target_type text NOT NULL,
    target_id uuid NOT NULL,
    action text NOT NULL,
    reason text,
    snapshot jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT moderation_log_action_check CHECK ((action = ANY (ARRAY['approve'::text, 'hide'::text, 'delete'::text, 'feature'::text, 'reject'::text, 'restore'::text, 'publish'::text, 'unpublish'::text]))),
    CONSTRAINT moderation_log_target_type_check CHECK ((target_type = ANY (ARRAY['comment'::text, 'review'::text])))
);


--
-- Name: nav_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nav_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    label text NOT NULL,
    url text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL
);


--
-- Name: page_loader_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_loader_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    singleton boolean DEFAULT true NOT NULL,
    initial_ms integer DEFAULT 250 NOT NULL,
    route_ms integer DEFAULT 250 NOT NULL,
    default_label text DEFAULT ''::text NOT NULL,
    default_tagline text DEFAULT ''::text NOT NULL,
    routes jsonb DEFAULT '{}'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: page_quotes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_quotes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    page_slug text NOT NULL,
    eyebrow text,
    quote text DEFAULT ''::text NOT NULL,
    author text,
    active boolean DEFAULT true NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: portfolio_folders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portfolio_folders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    icon text,
    cover_url text,
    sort_order integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    parent_id uuid
);


--
-- Name: portfolio_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portfolio_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    folder_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    image_url text,
    external_url text,
    tags jsonb DEFAULT '[]'::jsonb NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    watermark_text text,
    show_in_feed boolean DEFAULT true NOT NULL,
    feed_caption text,
    featured boolean DEFAULT false NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    display_name text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    verified boolean DEFAULT false NOT NULL
);


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    image_url text,
    gallery jsonb DEFAULT '[]'::jsonb,
    category text,
    summary text,
    description text,
    tools jsonb DEFAULT '[]'::jsonb,
    live_url text,
    github_url text,
    featured boolean DEFAULT false NOT NULL,
    published boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    features jsonb DEFAULT '[]'::jsonb NOT NULL
);


--
-- Name: seo_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seo_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    page_key text NOT NULL,
    meta_title text,
    meta_description text,
    og_image text,
    keywords text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    icon text,
    sort_order integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: site_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    site_title text DEFAULT 'Portfolio'::text NOT NULL,
    logo_url text,
    favicon_url text,
    theme_primary text DEFAULT '#D9FF3D'::text,
    footer_text text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    site_name text,
    primary_color text,
    secondary_color text,
    hero_title text,
    hero_subtitle text,
    page_key text DEFAULT 'B'::text NOT NULL,
    welcome_animation_ms integer DEFAULT 600 NOT NULL,
    default_motion_pref text DEFAULT 'auto'::text NOT NULL,
    section_visibility jsonb DEFAULT '{}'::jsonb NOT NULL,
    reactions_enabled boolean DEFAULT true NOT NULL,
    CONSTRAINT site_settings_default_motion_pref_check CHECK ((default_motion_pref = ANY (ARRAY['on'::text, 'off'::text, 'auto'::text]))),
    CONSTRAINT site_settings_welcome_ms_check CHECK (((welcome_animation_ms >= 0) AND (welcome_animation_ms <= 5000)))
);


--
-- Name: slots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.slots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    folder_id uuid NOT NULL,
    title text NOT NULL,
    subtitle text,
    type text,
    highlight_text text,
    contact_number text,
    whatsapp_number text,
    card_size text DEFAULT 'medium'::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    status boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: taxi_services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.taxi_services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slot_id uuid NOT NULL,
    service_name text NOT NULL,
    description text,
    price text,
    duration text,
    features jsonb DEFAULT '[]'::jsonb,
    sort_order integer DEFAULT 0 NOT NULL,
    status boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    badge text,
    contact_number text,
    button_text text,
    button_link text
);


--
-- Name: testimonials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.testimonials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_name text NOT NULL,
    role text,
    company text,
    review text NOT NULL,
    avatar_url text,
    rating integer DEFAULT 5,
    published boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    status text DEFAULT 'approved'::text NOT NULL,
    featured boolean DEFAULT false NOT NULL
);


--
-- Name: ticker_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ticker_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    text text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: about_content about_content_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.about_content
    ADD CONSTRAINT about_content_pkey PRIMARY KEY (id);


--
-- Name: activities activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_pkey PRIMARY KEY (id);


--
-- Name: contact_settings contact_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_settings
    ADD CONSTRAINT contact_settings_pkey PRIMARY KEY (id);


--
-- Name: education education_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.education
    ADD CONSTRAINT education_pkey PRIMARY KEY (id);


--
-- Name: env_imports env_imports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.env_imports
    ADD CONSTRAINT env_imports_pkey PRIMARY KEY (id);


--
-- Name: f_hero f_hero_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.f_hero
    ADD CONSTRAINT f_hero_pkey PRIMARY KEY (id);


--
-- Name: f_photocard f_photocard_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.f_photocard
    ADD CONSTRAINT f_photocard_pkey PRIMARY KEY (id);


--
-- Name: f_projects f_projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.f_projects
    ADD CONSTRAINT f_projects_pkey PRIMARY KEY (id);


--
-- Name: f_skills f_skills_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.f_skills
    ADD CONSTRAINT f_skills_pkey PRIMARY KEY (id);


--
-- Name: feed_comment_reports feed_comment_reports_comment_id_reporter_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feed_comment_reports
    ADD CONSTRAINT feed_comment_reports_comment_id_reporter_id_key UNIQUE (comment_id, reporter_id);


--
-- Name: feed_comment_reports feed_comment_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feed_comment_reports
    ADD CONSTRAINT feed_comment_reports_pkey PRIMARY KEY (id);


--
-- Name: feed_comments feed_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feed_comments
    ADD CONSTRAINT feed_comments_pkey PRIMARY KEY (id);


--
-- Name: feed_reactions feed_reactions_item_id_user_id_reaction_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feed_reactions
    ADD CONSTRAINT feed_reactions_item_id_user_id_reaction_key UNIQUE (item_id, user_id, reaction);


--
-- Name: feed_reactions feed_reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feed_reactions
    ADD CONSTRAINT feed_reactions_pkey PRIMARY KEY (id);


--
-- Name: folders folders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT folders_pkey PRIMARY KEY (id);


--
-- Name: folders folders_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT folders_slug_key UNIQUE (slug);


--
-- Name: footer_apps footer_apps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.footer_apps
    ADD CONSTRAINT footer_apps_pkey PRIMARY KEY (id);


--
-- Name: footer_cta footer_cta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.footer_cta
    ADD CONSTRAINT footer_cta_pkey PRIMARY KEY (id);


--
-- Name: footer_cta footer_cta_singleton_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.footer_cta
    ADD CONSTRAINT footer_cta_singleton_key UNIQUE (singleton);


--
-- Name: footer_links footer_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.footer_links
    ADD CONSTRAINT footer_links_pkey PRIMARY KEY (id);


--
-- Name: hero_content hero_content_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hero_content
    ADD CONSTRAINT hero_content_pkey PRIMARY KEY (id);


--
-- Name: launcher_hero launcher_hero_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.launcher_hero
    ADD CONSTRAINT launcher_hero_pkey PRIMARY KEY (id);


--
-- Name: launcher_pages launcher_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.launcher_pages
    ADD CONSTRAINT launcher_pages_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: moderation_log moderation_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moderation_log
    ADD CONSTRAINT moderation_log_pkey PRIMARY KEY (id);


--
-- Name: nav_links nav_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nav_links
    ADD CONSTRAINT nav_links_pkey PRIMARY KEY (id);


--
-- Name: page_loader_settings page_loader_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_loader_settings
    ADD CONSTRAINT page_loader_settings_pkey PRIMARY KEY (id);


--
-- Name: page_loader_settings page_loader_settings_singleton_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_loader_settings
    ADD CONSTRAINT page_loader_settings_singleton_key UNIQUE (singleton);


--
-- Name: page_quotes page_quotes_page_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_quotes
    ADD CONSTRAINT page_quotes_page_slug_key UNIQUE (page_slug);


--
-- Name: page_quotes page_quotes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_quotes
    ADD CONSTRAINT page_quotes_pkey PRIMARY KEY (id);


--
-- Name: portfolio_folders portfolio_folders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portfolio_folders
    ADD CONSTRAINT portfolio_folders_pkey PRIMARY KEY (id);


--
-- Name: portfolio_folders portfolio_folders_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portfolio_folders
    ADD CONSTRAINT portfolio_folders_slug_key UNIQUE (slug);


--
-- Name: portfolio_items portfolio_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portfolio_items
    ADD CONSTRAINT portfolio_items_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: projects projects_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_slug_key UNIQUE (slug);


--
-- Name: seo_settings seo_settings_page_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_settings
    ADD CONSTRAINT seo_settings_page_key_key UNIQUE (page_key);


--
-- Name: seo_settings seo_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_settings
    ADD CONSTRAINT seo_settings_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: site_settings site_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_pkey PRIMARY KEY (id);


--
-- Name: slots slots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.slots
    ADD CONSTRAINT slots_pkey PRIMARY KEY (id);


--
-- Name: taxi_services taxi_services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.taxi_services
    ADD CONSTRAINT taxi_services_pkey PRIMARY KEY (id);


--
-- Name: testimonials testimonials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.testimonials
    ADD CONSTRAINT testimonials_pkey PRIMARY KEY (id);


--
-- Name: ticker_items ticker_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticker_items
    ADD CONSTRAINT ticker_items_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: f_projects_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX f_projects_order_idx ON public.f_projects USING btree (sort_order);


--
-- Name: f_skills_kind_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX f_skills_kind_order_idx ON public.f_skills USING btree (kind, sort_order);


--
-- Name: idx_about_content_page_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_about_content_page_key ON public.about_content USING btree (page_key);


--
-- Name: idx_contact_settings_page_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contact_settings_page_key ON public.contact_settings USING btree (page_key);


--
-- Name: idx_env_imports_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_env_imports_created_at ON public.env_imports USING btree (created_at DESC);


--
-- Name: idx_feed_comments_item; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feed_comments_item ON public.feed_comments USING btree (item_id, created_at DESC);


--
-- Name: idx_feed_comments_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feed_comments_parent ON public.feed_comments USING btree (parent_id);


--
-- Name: idx_feed_comments_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feed_comments_user ON public.feed_comments USING btree (user_id);


--
-- Name: idx_feed_reactions_item; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feed_reactions_item ON public.feed_reactions USING btree (item_id);


--
-- Name: idx_feed_reactions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feed_reactions_user ON public.feed_reactions USING btree (user_id);


--
-- Name: idx_hero_content_page_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hero_content_page_key ON public.hero_content USING btree (page_key);


--
-- Name: idx_portfolio_folders_parent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_portfolio_folders_parent_id ON public.portfolio_folders USING btree (parent_id);


--
-- Name: idx_portfolio_items_featured; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_portfolio_items_featured ON public.portfolio_items USING btree (featured) WHERE (featured = true);


--
-- Name: idx_portfolio_items_folder; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_portfolio_items_folder ON public.portfolio_items USING btree (folder_id);


--
-- Name: idx_portfolio_items_show_in_feed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_portfolio_items_show_in_feed ON public.portfolio_items USING btree (show_in_feed) WHERE (show_in_feed = true);


--
-- Name: idx_portfolio_items_sort; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_portfolio_items_sort ON public.portfolio_items USING btree (folder_id, sort_order);


--
-- Name: idx_site_settings_page_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_site_settings_page_key ON public.site_settings USING btree (page_key);


--
-- Name: moderation_log_moderator_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX moderation_log_moderator_idx ON public.moderation_log USING btree (moderator_id, created_at DESC);


--
-- Name: moderation_log_target_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX moderation_log_target_idx ON public.moderation_log USING btree (target_type, target_id, created_at DESC);


--
-- Name: slots_folder_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX slots_folder_idx ON public.slots USING btree (folder_id);


--
-- Name: taxi_services_slot_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX taxi_services_slot_idx ON public.taxi_services USING btree (slot_id);


--
-- Name: about_content about_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER about_updated BEFORE UPDATE ON public.about_content FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: activities activities_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER activities_updated BEFORE UPDATE ON public.activities FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: contact_settings contact_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER contact_updated BEFORE UPDATE ON public.contact_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: education education_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER education_updated BEFORE UPDATE ON public.education FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: f_hero f_hero_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER f_hero_set_updated_at BEFORE UPDATE ON public.f_hero FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: f_projects f_projects_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER f_projects_set_updated_at BEFORE UPDATE ON public.f_projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: f_skills f_skills_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER f_skills_set_updated_at BEFORE UPDATE ON public.f_skills FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: feed_comments feed_comments_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER feed_comments_set_updated_at BEFORE UPDATE ON public.feed_comments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: folders folders_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER folders_updated BEFORE UPDATE ON public.folders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: hero_content hero_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER hero_updated BEFORE UPDATE ON public.hero_content FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: launcher_pages launcher_pages_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER launcher_pages_updated_at BEFORE UPDATE ON public.launcher_pages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: page_quotes page_quotes_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER page_quotes_set_updated_at BEFORE UPDATE ON public.page_quotes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: profiles profiles_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: projects projects_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER projects_updated BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: seo_settings seo_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER seo_updated BEFORE UPDATE ON public.seo_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: services services_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER services_updated BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: f_photocard set_f_photocard_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_f_photocard_updated_at BEFORE UPDATE ON public.f_photocard FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: footer_apps set_footer_apps_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_footer_apps_updated_at BEFORE UPDATE ON public.footer_apps FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: launcher_hero set_launcher_hero_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_launcher_hero_updated_at BEFORE UPDATE ON public.launcher_hero FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: site_settings site_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER site_updated BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: slots slots_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER slots_updated BEFORE UPDATE ON public.slots FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: taxi_services taxi_services_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER taxi_services_updated BEFORE UPDATE ON public.taxi_services FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: testimonials testimonials_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER testimonials_updated BEFORE UPDATE ON public.testimonials FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: footer_cta trg_footer_cta_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_footer_cta_updated BEFORE UPDATE ON public.footer_cta FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: page_loader_settings trg_page_loader_settings_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_page_loader_settings_updated BEFORE UPDATE ON public.page_loader_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: portfolio_folders trg_portfolio_folders_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_portfolio_folders_updated BEFORE UPDATE ON public.portfolio_folders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: portfolio_items trg_portfolio_items_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_portfolio_items_updated BEFORE UPDATE ON public.portfolio_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: feed_comment_reports feed_comment_reports_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feed_comment_reports
    ADD CONSTRAINT feed_comment_reports_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.feed_comments(id) ON DELETE CASCADE;


--
-- Name: feed_comment_reports feed_comment_reports_reporter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feed_comment_reports
    ADD CONSTRAINT feed_comment_reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: feed_comments feed_comments_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feed_comments
    ADD CONSTRAINT feed_comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.feed_comments(id) ON DELETE CASCADE;


--
-- Name: feed_comments feed_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feed_comments
    ADD CONSTRAINT feed_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: feed_reactions feed_reactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feed_reactions
    ADD CONSTRAINT feed_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: portfolio_folders portfolio_folders_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portfolio_folders
    ADD CONSTRAINT portfolio_folders_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.portfolio_folders(id) ON DELETE RESTRICT;


--
-- Name: portfolio_items portfolio_items_folder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portfolio_items
    ADD CONSTRAINT portfolio_items_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.portfolio_folders(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: slots slots_folder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.slots
    ADD CONSTRAINT slots_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.folders(id) ON DELETE CASCADE;


--
-- Name: taxi_services taxi_services_slot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.taxi_services
    ADD CONSTRAINT taxi_services_slot_id_fkey FOREIGN KEY (slot_id) REFERENCES public.slots(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: feed_comments Admins delete any comment; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins delete any comment" ON public.feed_comments FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: feed_reactions Admins delete any reaction; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins delete any reaction" ON public.feed_reactions FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: messages Admins delete messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins delete messages" ON public.messages FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: feed_comment_reports Admins delete reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins delete reports" ON public.feed_comment_reports FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: f_hero Admins manage f_hero; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage f_hero" ON public.f_hero TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: f_photocard Admins manage f_photocard; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage f_photocard" ON public.f_photocard TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: f_projects Admins manage f_projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage f_projects" ON public.f_projects TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: f_skills Admins manage f_skills; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage f_skills" ON public.f_skills TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: folders Admins manage folders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage folders" ON public.folders TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: footer_cta Admins manage footer_cta; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage footer_cta" ON public.footer_cta TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: launcher_hero Admins manage launcher_hero; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage launcher_hero" ON public.launcher_hero TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: page_loader_settings Admins manage page_loader_settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage page_loader_settings" ON public.page_loader_settings TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: page_quotes Admins manage page_quotes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage page_quotes" ON public.page_quotes TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: portfolio_folders Admins manage portfolio_folders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage portfolio_folders" ON public.portfolio_folders TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: portfolio_items Admins manage portfolio_items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage portfolio_items" ON public.portfolio_items TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins manage roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage roles" ON public.user_roles TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: slots Admins manage slots; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage slots" ON public.slots TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: taxi_services Admins manage taxi_services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage taxi_services" ON public.taxi_services TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: feed_comments Admins read all comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins read all comments" ON public.feed_comments FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: feed_comment_reports Admins read all reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins read all reports" ON public.feed_comment_reports FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: env_imports Admins read env_imports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins read env_imports" ON public.env_imports FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: moderation_log Admins read moderation_log; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins read moderation_log" ON public.moderation_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: feed_comments Admins update any comment; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins update any comment" ON public.feed_comments FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: messages Admins update messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins update messages" ON public.messages FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: messages Admins view messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins view messages" ON public.messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: about_content Admins write about_content; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins write about_content" ON public.about_content TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: activities Admins write activities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins write activities" ON public.activities TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: contact_settings Admins write contact_settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins write contact_settings" ON public.contact_settings TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: education Admins write education; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins write education" ON public.education TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: footer_apps Admins write footer_apps; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins write footer_apps" ON public.footer_apps TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: footer_links Admins write footer_links; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins write footer_links" ON public.footer_links TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: hero_content Admins write hero_content; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins write hero_content" ON public.hero_content TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: launcher_pages Admins write launcher_pages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins write launcher_pages" ON public.launcher_pages TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: nav_links Admins write nav_links; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins write nav_links" ON public.nav_links TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: projects Admins write projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins write projects" ON public.projects TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: seo_settings Admins write seo_settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins write seo_settings" ON public.seo_settings TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: services Admins write services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins write services" ON public.services TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: site_settings Admins write site_settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins write site_settings" ON public.site_settings TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: testimonials Admins write testimonials; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins write testimonials" ON public.testimonials TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: ticker_items Admins write ticker_items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins write ticker_items" ON public.ticker_items TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: messages Anon can submit message; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anon can submit message" ON public.messages FOR INSERT TO anon WITH CHECK (((length(name) >= 1) AND (length(name) <= 200) AND ((length(email) >= 3) AND (length(email) <= 320)) AND ((length(message) >= 1) AND (length(message) <= 5000))));


--
-- Name: testimonials Anon can submit testimonial; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anon can submit testimonial" ON public.testimonials FOR INSERT TO authenticated, anon WITH CHECK ((((length(client_name) >= 1) AND (length(client_name) <= 120)) AND ((length(review) >= 1) AND (length(review) <= 2000)) AND (status = 'pending'::text) AND (published = false) AND (featured = false)));


--
-- Name: feed_reactions Auth users add own reactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Auth users add own reactions" ON public.feed_reactions FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: feed_comment_reports Auth users file reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Auth users file reports" ON public.feed_comment_reports FOR INSERT TO authenticated WITH CHECK ((auth.uid() = reporter_id));


--
-- Name: feed_comments Auth users insert own comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Auth users insert own comments" ON public.feed_comments FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: messages Authed can submit message; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authed can submit message" ON public.messages FOR INSERT TO authenticated WITH CHECK (((length(name) >= 1) AND (length(name) <= 200) AND ((length(email) >= 3) AND (length(email) <= 320)) AND ((length(message) >= 1) AND (length(message) <= 5000))));


--
-- Name: feed_comments Authors delete own comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authors delete own comments" ON public.feed_comments FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: feed_comments Authors read own comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authors read own comments" ON public.feed_comments FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: feed_comments Authors update own recent comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authors update own recent comments" ON public.feed_comments FOR UPDATE TO authenticated USING (((auth.uid() = user_id) AND (created_at > (now() - '00:15:00'::interval)))) WITH CHECK ((auth.uid() = user_id));


--
-- Name: about_content Editors update about_content; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Editors update about_content" ON public.about_content FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'editor'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'editor'::public.app_role));


--
-- Name: activities Editors update activities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Editors update activities" ON public.activities FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'editor'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'editor'::public.app_role));


--
-- Name: contact_settings Editors update contact_settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Editors update contact_settings" ON public.contact_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'editor'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'editor'::public.app_role));


--
-- Name: education Editors update education; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Editors update education" ON public.education FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'editor'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'editor'::public.app_role));


--
-- Name: f_photocard Editors update f_photocard; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Editors update f_photocard" ON public.f_photocard FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'editor'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'editor'::public.app_role));


--
-- Name: footer_apps Editors update footer_apps; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Editors update footer_apps" ON public.footer_apps FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'editor'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'editor'::public.app_role));


--
-- Name: footer_cta Editors update footer_cta; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Editors update footer_cta" ON public.footer_cta FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'editor'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'editor'::public.app_role));


--
-- Name: footer_links Editors update footer_links; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Editors update footer_links" ON public.footer_links FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'editor'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'editor'::public.app_role));


--
-- Name: hero_content Editors update hero_content; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Editors update hero_content" ON public.hero_content FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'editor'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'editor'::public.app_role));


--
-- Name: launcher_hero Editors update launcher_hero; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Editors update launcher_hero" ON public.launcher_hero FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'editor'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'editor'::public.app_role));


--
-- Name: launcher_pages Editors update launcher_pages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Editors update launcher_pages" ON public.launcher_pages FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'editor'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'editor'::public.app_role));


--
-- Name: nav_links Editors update nav_links; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Editors update nav_links" ON public.nav_links FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'editor'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'editor'::public.app_role));


--
-- Name: page_loader_settings Editors update page_loader_settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Editors update page_loader_settings" ON public.page_loader_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'editor'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'editor'::public.app_role));


--
-- Name: page_quotes Editors update page_quotes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Editors update page_quotes" ON public.page_quotes FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'editor'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'editor'::public.app_role));


--
-- Name: portfolio_folders Editors update portfolio_folders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Editors update portfolio_folders" ON public.portfolio_folders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'editor'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'editor'::public.app_role));


--
-- Name: portfolio_items Editors update portfolio_items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Editors update portfolio_items" ON public.portfolio_items FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'editor'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'editor'::public.app_role));


--
-- Name: projects Editors update projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Editors update projects" ON public.projects FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'editor'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'editor'::public.app_role));


--
-- Name: seo_settings Editors update seo_settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Editors update seo_settings" ON public.seo_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'editor'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'editor'::public.app_role));


--
-- Name: services Editors update services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Editors update services" ON public.services FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'editor'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'editor'::public.app_role));


--
-- Name: site_settings Editors update site_settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Editors update site_settings" ON public.site_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'editor'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'editor'::public.app_role));


--
-- Name: testimonials Editors update testimonials; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Editors update testimonials" ON public.testimonials FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'editor'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'editor'::public.app_role));


--
-- Name: ticker_items Editors update ticker_items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Editors update ticker_items" ON public.ticker_items FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'editor'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'editor'::public.app_role));


--
-- Name: moderation_log Mods append to moderation_log; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Mods append to moderation_log" ON public.moderation_log FOR INSERT TO authenticated WITH CHECK (((auth.uid() = moderator_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'editor'::public.app_role))));


--
-- Name: profiles Profiles viewable by authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Profiles viewable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);


--
-- Name: about_content Public read about_content; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read about_content" ON public.about_content FOR SELECT USING (true);


--
-- Name: activities Public read activities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read activities" ON public.activities FOR SELECT USING (true);


--
-- Name: contact_settings Public read contact_settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read contact_settings" ON public.contact_settings FOR SELECT USING (true);


--
-- Name: education Public read education; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read education" ON public.education FOR SELECT USING (true);


--
-- Name: f_hero Public read f_hero; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read f_hero" ON public.f_hero FOR SELECT USING (true);


--
-- Name: f_photocard Public read f_photocard; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read f_photocard" ON public.f_photocard FOR SELECT USING (true);


--
-- Name: f_projects Public read f_projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read f_projects" ON public.f_projects FOR SELECT USING ((active OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: f_skills Public read f_skills; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read f_skills" ON public.f_skills FOR SELECT USING ((active OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: folders Public read folders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read folders" ON public.folders FOR SELECT USING (((status = true) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: footer_apps Public read footer_apps; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read footer_apps" ON public.footer_apps FOR SELECT USING (true);


--
-- Name: footer_cta Public read footer_cta; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read footer_cta" ON public.footer_cta FOR SELECT USING (true);


--
-- Name: footer_links Public read footer_links; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read footer_links" ON public.footer_links FOR SELECT USING (true);


--
-- Name: hero_content Public read hero_content; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read hero_content" ON public.hero_content FOR SELECT USING (true);


--
-- Name: launcher_hero Public read launcher_hero; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read launcher_hero" ON public.launcher_hero FOR SELECT USING (true);


--
-- Name: launcher_pages Public read launcher_pages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read launcher_pages" ON public.launcher_pages FOR SELECT USING (((active = true) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'editor'::public.app_role)));


--
-- Name: nav_links Public read nav_links; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read nav_links" ON public.nav_links FOR SELECT USING (true);


--
-- Name: page_loader_settings Public read page_loader_settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read page_loader_settings" ON public.page_loader_settings FOR SELECT USING (true);


--
-- Name: page_quotes Public read page_quotes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read page_quotes" ON public.page_quotes FOR SELECT USING (true);


--
-- Name: portfolio_folders Public read portfolio_folders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read portfolio_folders" ON public.portfolio_folders FOR SELECT USING ((active OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: portfolio_items Public read portfolio_items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read portfolio_items" ON public.portfolio_items FOR SELECT USING ((active OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: projects Public read projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read projects" ON public.projects FOR SELECT USING (true);


--
-- Name: feed_reactions Public read reactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read reactions" ON public.feed_reactions FOR SELECT USING (true);


--
-- Name: seo_settings Public read seo_settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read seo_settings" ON public.seo_settings FOR SELECT USING (true);


--
-- Name: services Public read services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read services" ON public.services FOR SELECT USING (true);


--
-- Name: site_settings Public read site_settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read site_settings" ON public.site_settings FOR SELECT USING (true);


--
-- Name: slots Public read slots; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read slots" ON public.slots FOR SELECT USING (((status = true) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: taxi_services Public read taxi_services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read taxi_services" ON public.taxi_services FOR SELECT USING (((status = true) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: testimonials Public read testimonials; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read testimonials" ON public.testimonials FOR SELECT USING (true);


--
-- Name: ticker_items Public read ticker_items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read ticker_items" ON public.ticker_items FOR SELECT USING (true);


--
-- Name: feed_comments Public read visible comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read visible comments" ON public.feed_comments FOR SELECT USING ((status = 'visible'::text));


--
-- Name: feed_comment_reports Reporters read own reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Reporters read own reports" ON public.feed_comment_reports FOR SELECT TO authenticated USING ((auth.uid() = reporter_id));


--
-- Name: feed_reactions Users delete own reactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users delete own reactions" ON public.feed_reactions FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: profiles Users insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((auth.uid() = id));


--
-- Name: profiles Users update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING ((auth.uid() = id));


--
-- Name: user_roles Users view own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: about_content; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.about_content ENABLE ROW LEVEL SECURITY;

--
-- Name: activities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

--
-- Name: contact_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contact_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: education; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;

--
-- Name: env_imports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.env_imports ENABLE ROW LEVEL SECURITY;

--
-- Name: f_hero; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.f_hero ENABLE ROW LEVEL SECURITY;

--
-- Name: f_photocard; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.f_photocard ENABLE ROW LEVEL SECURITY;

--
-- Name: f_projects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.f_projects ENABLE ROW LEVEL SECURITY;

--
-- Name: f_skills; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.f_skills ENABLE ROW LEVEL SECURITY;

--
-- Name: feed_comment_reports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.feed_comment_reports ENABLE ROW LEVEL SECURITY;

--
-- Name: feed_comments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.feed_comments ENABLE ROW LEVEL SECURITY;

--
-- Name: feed_reactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.feed_reactions ENABLE ROW LEVEL SECURITY;

--
-- Name: folders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

--
-- Name: footer_apps; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.footer_apps ENABLE ROW LEVEL SECURITY;

--
-- Name: footer_cta; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.footer_cta ENABLE ROW LEVEL SECURITY;

--
-- Name: footer_links; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.footer_links ENABLE ROW LEVEL SECURITY;

--
-- Name: hero_content; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hero_content ENABLE ROW LEVEL SECURITY;

--
-- Name: launcher_hero; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.launcher_hero ENABLE ROW LEVEL SECURITY;

--
-- Name: launcher_pages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.launcher_pages ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: moderation_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.moderation_log ENABLE ROW LEVEL SECURITY;

--
-- Name: nav_links; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.nav_links ENABLE ROW LEVEL SECURITY;

--
-- Name: page_loader_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.page_loader_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: page_quotes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.page_quotes ENABLE ROW LEVEL SECURITY;

--
-- Name: portfolio_folders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.portfolio_folders ENABLE ROW LEVEL SECURITY;

--
-- Name: portfolio_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: projects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

--
-- Name: seo_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seo_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: services; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

--
-- Name: site_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: slots; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.slots ENABLE ROW LEVEL SECURITY;

--
-- Name: taxi_services; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.taxi_services ENABLE ROW LEVEL SECURITY;

--
-- Name: testimonials; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

--
-- Name: ticker_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ticker_items ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict 8SxXUHzabmqS2pR6Xd1OBYfLhUL0YeOkqdTRZQKs955I4aHqUq91t7LOI8KlAIe

