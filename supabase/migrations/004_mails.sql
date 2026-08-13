/* Historial de correos enviados con Resend, opcionales por cliente. */

create table if not exists public.client_mails (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  client_id text references public.clients (id) on delete set null,
  client_name text not null default '',
  to_email text not null,
  cc text not null default '',
  subject text not null,
  body text not null,
  template text not null default 'custom',
  status text not null default 'sent' check (status in ('sent', 'failed')),
  resend_id text not null default '',
  error text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists client_mails_user_idx on public.client_mails (user_id, created_at desc);
create index if not exists client_mails_client_idx on public.client_mails (client_id);

alter table public.client_mails enable row level security;

drop policy if exists "client_mails_own" on public.client_mails;
create policy "client_mails_own" on public.client_mails
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
