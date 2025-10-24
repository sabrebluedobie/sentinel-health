-- ===== Migration: Add missing migraine_episodes columns =====
-- This adds all the fields that LogMigraine.jsx is trying to save

-- Add new columns (all nullable initially to avoid breaking existing data)
alter table public.migraine_episodes
  add column if not exists duration_hours numeric,
  add column if not exists triggers text[],
  add column if not exists medication_taken text,
  add column if not exists medication_effective boolean default false,
  add column if not exists source text default 'manual';

-- Change symptoms from text to text[] array
-- First, check if we need to convert existing data
do $$
begin
  -- Only alter if the column exists and is text type
  if exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'migraine_episodes' 
    and column_name = 'symptoms'
    and data_type = 'text'
  ) then
    -- Convert existing text to array (split on commas if present)
    alter table public.migraine_episodes 
      alter column symptoms type text[] 
      using case 
        when symptoms is null then null
        when symptoms = '' then array[]::text[]
        else string_to_array(symptoms, ',')
      end;
  end if;
end$$;

-- Add constraints
do $
begin
  if not exists (
    select 1 from pg_constraint 
    where conname = 'duration_positive' 
    and conrelid = 'public.migraine_episodes'::regclass
  ) then
    alter table public.migraine_episodes
      add constraint duration_positive 
        check (duration_hours is null or duration_hours >= 0);
  end if;
end$;

-- Add comments for documentation
comment on column public.migraine_episodes.duration_hours is 'Duration of migraine episode in hours';
comment on column public.migraine_episodes.symptoms is 'Array of symptom descriptions (e.g., nausea, aura, dizziness)';
comment on column public.migraine_episodes.triggers is 'Array of suspected triggers (e.g., stress, bright light, food)';
comment on column public.migraine_episodes.medication_taken is 'Medication name and dosage (e.g., sumatriptan 50mg)';
comment on column public.migraine_episodes.medication_effective is 'Whether the medication provided relief';
comment on column public.migraine_episodes.source is 'Data source: manual, voice, import, etc.';

-- Create indexes for better query performance
create index if not exists idx_migraine_episodes_started_at 
  on public.migraine_episodes(user_id, started_at desc);

create index if not exists idx_migraine_episodes_source 
  on public.migraine_episodes(user_id, source);

-- Add a helpful view for medication effectiveness analysis
create or replace view public.migraine_medication_effectiveness as
select 
  user_id,
  medication_taken,
  count(*) as times_taken,
  sum(case when medication_effective then 1 else 0 end) as times_effective,
  round(
    (sum(case when medication_effective then 1 else 0 end)::numeric / count(*)::numeric) * 100, 
    1
  ) as effectiveness_percentage,
  avg(pain) as avg_pain_level
from public.migraine_episodes
where medication_taken is not null and medication_taken != ''
group by user_id, medication_taken
order by times_taken desc;

-- Grant access to the view
grant select on public.migraine_medication_effectiveness to authenticated;

comment on view public.migraine_medication_effectiveness is 'Analysis of medication effectiveness across migraine episodes';
