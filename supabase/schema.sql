-- Money Operating System — Supabase schema
-- Run this in the Supabase SQL editor (Project → SQL → New query).
--
-- Storage model: one JSON document per user, upserted on every sync.
-- Because there is exactly one row per user (primary key = user_id), the sync
-- can never create duplicate records.

create table if not exists public.app_data (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Row Level Security: each user can only ever read/write their own row.
alter table public.app_data enable row level security;

drop policy if exists "app_data_select_own" on public.app_data;
create policy "app_data_select_own"
  on public.app_data for select
  using (auth.uid() = user_id);

drop policy if exists "app_data_insert_own" on public.app_data;
create policy "app_data_insert_own"
  on public.app_data for insert
  with check (auth.uid() = user_id);

drop policy if exists "app_data_update_own" on public.app_data;
create policy "app_data_update_own"
  on public.app_data for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "app_data_delete_own" on public.app_data;
create policy "app_data_delete_own"
  on public.app_data for delete
  using (auth.uid() = user_id);

-- Keep updated_at fresh on every write.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists app_data_set_updated_at on public.app_data;
create trigger app_data_set_updated_at
  before update on public.app_data
  for each row execute function public.set_updated_at();
