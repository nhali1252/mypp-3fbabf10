create table if not exists public.launcher_hero (
  id uuid primary key default gen_random_uuid(),
  eyebrow text not null default 'Portfolio · TasTaj',
  headline_top text not null default 'Pick a page',
  headline_bottom text not null default 'to explore.',
  intro text not null default 'A curated launcher for Ali Nur Hasan''s portfolio. Each card opens an independent page — managed and editable from the admin panel.',
  updated_at timestamptz not null default now()
);

alter table public.launcher_hero enable row level security;

create policy "Public read launcher_hero" on public.launcher_hero for select using (true);
create policy "Admins manage launcher_hero" on public.launcher_hero for all to authenticated using (has_role(auth.uid(), 'admin'::app_role)) with check (has_role(auth.uid(), 'admin'::app_role));
create policy "Editors update launcher_hero" on public.launcher_hero for update to authenticated using (has_role(auth.uid(), 'editor'::app_role)) with check (has_role(auth.uid(), 'editor'::app_role));

create trigger set_launcher_hero_updated_at before update on public.launcher_hero for each row execute function public.set_updated_at();

insert into public.launcher_hero (eyebrow, headline_top, headline_bottom, intro)
select 'Portfolio · TasTaj', 'Pick a page', 'to explore.', 'A curated launcher for Ali Nur Hasan''s portfolio. Each card opens an independent page — managed and editable from the admin panel.'
where not exists (select 1 from public.launcher_hero);