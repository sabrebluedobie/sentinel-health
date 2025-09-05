-- ===== BASELINE: schema, RLS, and RPCs =====
create extension if not exists "uuid-ossp";

-- ---------- glucose_readings ----------
create table if not exists public.glucose_readings (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  device_time   timestamptz not null,
  value_mgdl    numeric not null check (value_mgdl >= 20 and value_mgdl <= 600),
  created_at    timestamptz not null default now()
);

alter table public.glucose_readings enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='glucose_readings' and policyname='gr select own') then
    create policy "gr select own" on public.glucose_readings for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='glucose_readings' and policyname='gr insert own') then
    create policy "gr insert own" on public.glucose_readings for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='glucose_readings' and policyname='gr update own') then
    create policy "gr update own" on public.glucose_readings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='glucose_readings' and policyname='gr delete own') then
    create policy "gr delete own" on public.glucose_readings for delete using (auth.uid() = user_id);
  end if;
end$$;

-- ---------- sleep_data ----------
create table if not exists public.sleep_data (
  id                 uuid primary key default uuid_generate_v4(),
  user_id            uuid not null default auth.uid() references auth.users(id) on delete cascade,
  start_time         timestamptz not null,
  end_time           timestamptz not null,
  total_sleep_hours  numeric not null,
  efficiency         numeric,
  notes              text,
  created_at         timestamptz not null default now(),
  constraint chk_sleep_time check (end_time > start_time)
);

alter table public.sleep_data enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='sleep_data' and policyname='sleep select own') then
    create policy "sleep select own" on public.sleep_data for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='sleep_data' and policyname='sleep insert own') then
    create policy "sleep insert own" on public.sleep_data for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='sleep_data' and policyname='sleep update own') then
    create policy "sleep update own" on public.sleep_data for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='sleep_data' and policyname='sleep delete own') then
    create policy "sleep delete own" on public.sleep_data for delete using (auth.uid() = user_id);
  end if;
end$$;

-- ---------- migraine_episodes ----------
create table if not exists public.migraine_episodes (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  started_at    timestamptz not null,
  pain          numeric, -- 0..10 optional
  symptoms      text,
  notes         text,
  created_at    timestamptz not null default now(),
  constraint pain_range check (pain is null or (pain >= 0 and pain <= 10))
);

alter table public.migraine_episodes enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='migraine_episodes' and policyname='me select own') then
    create policy "me select own" on public.migraine_episodes for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='migraine_episodes' and policyname='me insert own') then
    create policy "me insert own" on public.migraine_episodes for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='migraine_episodes' and policyname='me update own') then
    create policy "me update own" on public.migraine_episodes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='migraine_episodes' and policyname='me delete own') then
    create policy "me delete own" on public.migraine_episodes for delete using (auth.uid() = user_id);
  end if;
end$$;

-- ---------- simple daily RPCs (RLS-friendly) ----------
create or replace function public.dm_glucose_simple(days int)
returns table(day date, avg_glucose numeric)
language sql
security invoker
as $$
  select
    date(gr.device_time at time zone 'UTC') as day,
    avg(gr.value_mgdl)::numeric as avg_glucose
  from public.glucose_readings gr
  where gr.user_id = auth.uid()
    and gr.device_time >= now() - make_interval(days => days)
  group by 1
  order by 1;
$$;

create or replace function public.dm_sleep_simple(days int)
returns table(day date, sleep_hours numeric)
language sql
security invoker
as $$
  select
    date(s.start_time at time zone 'UTC') as day,
    sum(s.total_sleep_hours)::numeric as sleep_hours
  from public.sleep_data s
  where s.user_id = auth.uid()
    and s.start_time >= now() - make_interval(days => days)
  group by 1
  order by 1;
$$;

create or replace function public.dm_migraine_simple(days int)
returns table(day date, avg_pain numeric, migraine_count int)
language sql
security invoker
as $$
  select
    date(m.started_at at time zone 'UTC') as day,
    avg(m.pain)::numeric as avg_pain,
    count(*)::int as migraine_count
  from public.migraine_episodes m
  where m.user_id = auth.uid()
    and m.started_at >= now() - make_interval(days => days)
  group by 1
  order by 1;
$$;
