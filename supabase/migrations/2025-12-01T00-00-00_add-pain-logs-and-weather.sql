-- ===== Migration: Add pain_logs table and weather columns =====

-- ---------- pain_logs table ----------
create table if not exists public.pain_logs (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null default auth.uid() references auth.users(id) on delete cascade,
  logged_at         timestamptz not null,
  pain_location     text not null,
  pain_side         text,
  pain_level        integer not null check (pain_level >= 0 and pain_level <= 10),
  pain_type         text[],
  related_to        text,
  injury_date       date,
  condition_name    text,
  medication_taken  text[],
  medication_dose   text,
  notes             text,
  created_at        timestamptz not null default now()
);

-- RLS for pain_logs
alter table public.pain_logs enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='pain_logs' and policyname='pain select own') then
    create policy "pain select own" on public.pain_logs for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='pain_logs' and policyname='pain insert own') then
    create policy "pain insert own" on public.pain_logs for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='pain_logs' and policyname='pain update own') then
    create policy "pain update own" on public.pain_logs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='pain_logs' and policyname='pain delete own') then
    create policy "pain delete own" on public.pain_logs for delete using (auth.uid() = user_id);
  end if;
end$$;

-- Index for performance
create index if not exists idx_pain_logs_logged_at 
  on public.pain_logs(user_id, logged_at desc);

-- ---------- Add weather columns to migraine_episodes ----------
alter table public.migraine_episodes
  add column if not exists weather_temp numeric,
  add column if not exists weather_pressure numeric,
  add column if not exists weather_humidity numeric,
  add column if not exists weather_conditions text,
  add column if not exists weather_location text;

-- Comments
comment on table public.pain_logs is 'General pain tracking log';
comment on column public.pain_logs.pain_level is 'Pain intensity from 0-10';
comment on column public.pain_logs.pain_location is 'Body location of pain';
comment on column public.pain_logs.pain_side is 'Side of body (left/right/both/center)';
comment on column public.pain_logs.pain_type is 'Array of pain descriptors (sharp, dull, throbbing, etc.)';

comment on column public.migraine_episodes.weather_temp is 'Temperature in Fahrenheit';
comment on column public.migraine_episodes.weather_pressure is 'Barometric pressure in inHg';
comment on column public.migraine_episodes.weather_humidity is 'Relative humidity percentage';
comment on column public.migraine_episodes.weather_conditions is 'Weather description';
comment on column public.migraine_episodes.weather_location is 'Location where weather was recorded';

-- Create RPC for pain tracking
create or replace function public.dm_pain_simple(days int)
returns table(day date, avg_pain numeric)
language sql
security invoker
as $$
  select
    date(p.logged_at at time zone 'UTC') as day,
    avg(p.pain_level)::numeric as avg_pain
  from public.pain_logs p
  where p.user_id = auth.uid()
    and p.logged_at >= now() - make_interval(days => days)
  group by 1
  order by 1;
$$;