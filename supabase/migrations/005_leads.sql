/* Inbox de leads. Ejecuta este archivo completo en Supabase → SQL Editor. */

create table if not exists public.leads (
  id text primary key,
  name text not null,
  email text not null,
  phone text not null default '',
  company text not null default '',
  source text not null default 'landing',
  interest text not null default 'demo',
  message text not null default '',
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'won', 'lost')),
  notes text not null default '',
  client_id text references public.clients (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_created_idx on public.leads (created_at desc);
create index if not exists leads_status_idx on public.leads (status);

alter table public.leads enable row level security;

grant usage on schema public to anon, authenticated;
grant insert on table public.leads to anon, authenticated;
grant select, update on table public.leads to authenticated;

drop policy if exists "leads_insert_public" on public.leads;
create policy "leads_insert_public" on public.leads
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "leads_select_auth" on public.leads;
create policy "leads_select_auth" on public.leads
  for select
  to authenticated
  using (true);

drop policy if exists "leads_update_auth" on public.leads;
create policy "leads_update_auth" on public.leads
  for update
  to authenticated
  using (true)
  with check (true);
