-- Add Nightscout integration + align glucose_readings to what the API expects

-- 1) Nightscout connections
create table if not exists public.nightscout_connections (
  id             uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,

  url             text not null,
  api_secret      text not null,

  last_synced_at  timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique(user_id)
);

alter table public.nightscout_connections enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='nightscout_connections' and policyname='nightscout_select_own'
  ) then
    create policy "nightscout_select_own"
      on public.nightscout_connections
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='nightscout_connections' and policyname='nightscout_insert_own'
  ) then
    create policy "nightscout_insert_own"
      on public.nightscout_connections
      for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='nightscout_connections' and policyname='nightscout_update_own'
  ) then
    create policy "nightscout_update_own"
      on public.nightscout_connections
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='nightscout_connections' and policyname='nightscout_delete_own'
  ) then
    create policy "nightscout_delete_own"
      on public.nightscout_connections
      for delete
      using (auth.uid() = user_id);
  end if;
end $$;

create index if not exists idx_nightscout_connections_user_id
  on public.nightscout_connections(user_id);

create index if not exists idx_nightscout_connections_last_synced_at
  on public.nightscout_connections(last_synced_at);


-- 2) Extend glucose_readings so Nightscout can upsert safely

-- reading_type (Nightscout sync sets 'random')
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='glucose_readings' and column_name='reading_type'
  ) then
    alter table public.glucose_readings
      add column reading_type text default 'random'
      check (reading_type in ('fasting','pre_meal','post_meal','bedtime','random'));
  end if;
end $$;

-- note (Nightscout sync writes a note)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='glucose_readings' and column_name='note'
  ) then
    alter table public.glucose_readings add column note text;
  end if;
end $$;

-- nightscout_id (Nightscout sync uses onConflict: 'nightscout_id')
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='glucose_readings' and column_name='nightscout_id'
  ) then
    alter table public.glucose_readings add column nightscout_id text;
  end if;
end $$;

create unique index if not exists ux_glucose_readings_nightscout_id
  on public.glucose_readings(nightscout_id)
  where nightscout_id is not null;
