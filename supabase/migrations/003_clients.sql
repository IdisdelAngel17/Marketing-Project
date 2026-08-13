/* CRM de clientes. Idempotente: crea copies/guiones/reportes si faltan y los enlaza al cliente. */

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

create table if not exists public.clients (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  brand text not null default '',
  industry text not null default '',
  contact_name text not null default '',
  email text not null default '',
  phone text not null default '',
  website text not null default '',
  notes text not null default '',
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.client_networks (
  id text primary key,
  client_id text not null references public.clients (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  network text not null,
  handle text not null default '',
  url text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.client_analyses (
  id text primary key,
  client_id text not null references public.clients (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.client_strategies (
  id text primary key,
  client_id text not null references public.clients (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.client_calendars (
  id text primary key,
  client_id text not null references public.clients (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.post_copies add column if not exists client_id text references public.clients (id) on delete set null;
alter table public.video_scripts add column if not exists client_id text references public.clients (id) on delete set null;
alter table public.weekly_reports add column if not exists client_id text references public.clients (id) on delete set null;

create index if not exists clients_user_idx on public.clients (user_id, updated_at desc);
create index if not exists client_networks_client_idx on public.client_networks (client_id);
create index if not exists client_analyses_client_idx on public.client_analyses (client_id, created_at desc);
create index if not exists client_strategies_client_idx on public.client_strategies (client_id, created_at desc);
create index if not exists client_calendars_client_idx on public.client_calendars (client_id, created_at desc);
create index if not exists post_copies_client_idx on public.post_copies (client_id);
create index if not exists video_scripts_client_idx on public.video_scripts (client_id);
create index if not exists weekly_reports_client_idx on public.weekly_reports (client_id);

alter table public.clients enable row level security;
alter table public.client_networks enable row level security;
alter table public.client_analyses enable row level security;
alter table public.client_strategies enable row level security;
alter table public.client_calendars enable row level security;

drop policy if exists "clients_own" on public.clients;
create policy "clients_own" on public.clients
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "client_networks_own" on public.client_networks;
create policy "client_networks_own" on public.client_networks
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "client_analyses_own" on public.client_analyses;
create policy "client_analyses_own" on public.client_analyses
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "client_strategies_own" on public.client_strategies;
create policy "client_strategies_own" on public.client_strategies
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "client_calendars_own" on public.client_calendars;
create policy "client_calendars_own" on public.client_calendars
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
