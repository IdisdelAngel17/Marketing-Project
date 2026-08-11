-- Copies, guiones y reportes semanales
-- Ejecuta este SQL en Supabase → SQL Editor (después de 001_profiles.sql)

create table if not exists public.post_copies (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users (id) on delete cascade,
  brand text not null default '',
  network text not null,
  topic text not null default '',
  audience text not null default '',
  tone text not null default 'cercano',
  goal text not null default 'engagement',
  headline text not null,
  body text not null,
  hashtags text[] not null default '{}',
  cta text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.video_scripts (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users (id) on delete cascade,
  brand text not null default '',
  format text not null,
  duration text not null,
  topic text not null default '',
  audience text not null default '',
  tone text not null default 'directo',
  goal text not null default 'alcance',
  title text not null,
  hook text not null,
  scenes jsonb not null default '[]'::jsonb,
  cta text not null default '',
  caption text not null default '',
  hashtags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.weekly_reports (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users (id) on delete cascade,
  week_label text not null,
  start_date date not null,
  end_date date not null,
  client text not null,
  highlights text[] not null default '{}',
  recommendations text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.report_posts (
  id text primary key default gen_random_uuid()::text,
  report_id text not null references public.weekly_reports (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  network text not null,
  published_at date not null,
  reach integer not null default 0,
  impressions integer not null default 0,
  likes integer not null default 0,
  comments integer not null default 0,
  shares integer not null default 0,
  saves integer not null default 0,
  clicks integer not null default 0,
  engagement_rate numeric not null default 0
);

create index if not exists post_copies_user_idx on public.post_copies (user_id, created_at desc);
create index if not exists video_scripts_user_idx on public.video_scripts (user_id, created_at desc);
create index if not exists weekly_reports_user_idx on public.weekly_reports (user_id, start_date desc);
create index if not exists report_posts_report_idx on public.report_posts (report_id);

alter table public.post_copies enable row level security;
alter table public.video_scripts enable row level security;
alter table public.weekly_reports enable row level security;
alter table public.report_posts enable row level security;

drop policy if exists "copies_own" on public.post_copies;
create policy "copies_own" on public.post_copies
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "scripts_own" on public.video_scripts;
create policy "scripts_own" on public.video_scripts
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "reports_own" on public.weekly_reports;
create policy "reports_own" on public.weekly_reports
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "report_posts_own" on public.report_posts;
create policy "report_posts_own" on public.report_posts
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
