-- Migration: Add Medication Management Module (Safe Version)
-- Created: 2025-12-31
-- This version drops existing policies first to avoid conflicts

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "medications_select_own" ON public.medications;
DROP POLICY IF EXISTS "medications_insert_own" ON public.medications;
DROP POLICY IF EXISTS "medications_update_own" ON public.medications;
DROP POLICY IF EXISTS "medications_delete_own" ON public.medications;
DROP POLICY IF EXISTS "medication_logs_select_own" ON public.medication_logs;
DROP POLICY IF EXISTS "medication_logs_insert_own" ON public.medication_logs;
DROP POLICY IF EXISTS "medication_logs_update_own" ON public.medication_logs;
DROP POLICY IF EXISTS "medication_logs_delete_own" ON public.medication_logs;

-- Medications table
CREATE TABLE IF NOT EXISTS public.medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Medication details
  name TEXT NOT NULL,
  dosage TEXT, -- e.g., "300mg", "10 units"
  form TEXT, -- pill, injection, liquid, etc.
  
  -- Scheduling
  frequency TEXT, -- daily, twice_daily, as_needed, custom
  times JSONB, -- ["08:00", "20:00"] for scheduled times
  
  -- Purpose & notes
  purpose TEXT, -- "mood stabilizer", "migraine preventive", etc.
  prescriber TEXT, -- doctor name
  pharmacy TEXT,
  notes TEXT,
  
  -- Critical medication flag
  is_critical BOOLEAN DEFAULT FALSE, -- for meds like lithium that MUST be taken on time
  
  -- Reminders
  reminders_enabled BOOLEAN DEFAULT FALSE,
  reminder_advance_minutes INTEGER DEFAULT 15, -- remind 15 min before
  
  -- Active status
  is_active BOOLEAN DEFAULT TRUE,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_times CHECK (times IS NULL OR jsonb_typeof(times) = 'array')
);

-- Medication logs table (when user takes medication)
CREATE TABLE IF NOT EXISTS public.medication_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  
  -- Log details
  scheduled_time TIMESTAMPTZ, -- when it was supposed to be taken
  taken_at TIMESTAMPTZ NOT NULL, -- when it was actually taken
  dosage_taken TEXT, -- if different from usual dosage
  
  -- Status
  status TEXT NOT NULL DEFAULT 'taken', -- taken, skipped, missed
  CHECK (status IN ('taken', 'skipped', 'missed')),
  
  -- Notes
  notes TEXT, -- "took with food", "forgot morning dose", etc.
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT fk_medication FOREIGN KEY (medication_id) REFERENCES public.medications(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Medications
CREATE POLICY "medications_select_own" ON public.medications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "medications_insert_own" ON public.medications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "medications_update_own" ON public.medications
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "medications_delete_own" ON public.medications
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies - Medication Logs
CREATE POLICY "medication_logs_select_own" ON public.medication_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "medication_logs_insert_own" ON public.medication_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "medication_logs_update_own" ON public.medication_logs
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "medication_logs_delete_own" ON public.medication_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_medications_user_id ON public.medications(user_id);
CREATE INDEX IF NOT EXISTS idx_medications_is_active ON public.medications(is_active);
CREATE INDEX IF NOT EXISTS idx_medication_logs_user_id ON public.medication_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_logs_medication_id ON public.medication_logs(medication_id);
CREATE INDEX IF NOT EXISTS idx_medication_logs_taken_at ON public.medication_logs(taken_at);

-- Function to get adherence rate
CREATE OR REPLACE FUNCTION public.get_medication_adherence(
  p_user_id UUID,
  p_medication_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_expected INTEGER,
  total_taken INTEGER,
  adherence_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_expected INTEGER;
  v_total_taken INTEGER;
BEGIN
  -- Count expected doses (simplified - assumes daily for now)
  -- In reality, you'd calculate based on frequency
  v_total_expected := p_days;
  
  -- Count actual doses taken
  SELECT COUNT(*)
  INTO v_total_taken
  FROM public.medication_logs
  WHERE user_id = p_user_id
    AND medication_id = p_medication_id
    AND status = 'taken'
    AND taken_at >= NOW() - (p_days || ' days')::INTERVAL;
  
  -- Calculate adherence rate
  RETURN QUERY
  SELECT 
    v_total_expected,
    v_total_taken,
    CASE 
      WHEN v_total_expected > 0 THEN 
        ROUND((v_total_taken::NUMERIC / v_total_expected::NUMERIC) * 100, 1)
      ELSE 0
    END as adherence_rate;
END;
$$;

-- Function to get upcoming doses
CREATE OR REPLACE FUNCTION public.get_upcoming_doses(
  p_user_id UUID,
  p_hours_ahead INTEGER DEFAULT 24
)
RETURNS TABLE (
  medication_id UUID,
  medication_name TEXT,
  dosage TEXT,
  scheduled_time TIMESTAMPTZ,
  is_critical BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH medication_times AS (
    SELECT 
      m.id,
      m.name,
      m.dosage,
      m.is_critical,
      jsonb_array_elements_text(m.times) as time_str
    FROM public.medications m
    WHERE m.user_id = p_user_id
      AND m.is_active = true
      AND m.times IS NOT NULL
  )
  SELECT 
    mt.id,
    mt.name,
    mt.dosage,
    (CURRENT_DATE + mt.time_str::TIME)::TIMESTAMPTZ as scheduled_time,
    mt.is_critical
  FROM medication_times mt
  WHERE (CURRENT_DATE + mt.time_str::TIME)::TIMESTAMPTZ 
    BETWEEN NOW() 
    AND NOW() + (p_hours_ahead || ' hours')::INTERVAL
  ORDER BY scheduled_time ASC;
END;
$$;

-- Trigger for updated_at (only create if the function exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    DROP TRIGGER IF EXISTS update_medications_updated_at ON public.medications;
    CREATE TRIGGER update_medications_updated_at
      BEFORE UPDATE ON public.medications
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Comments
COMMENT ON TABLE public.medications IS 'User medications and prescriptions';
COMMENT ON TABLE public.medication_logs IS 'Medication adherence tracking';
COMMENT ON COLUMN public.medications.is_critical IS 'Flag for critical meds (lithium, insulin, etc) that require strict adherence';
COMMENT ON COLUMN public.medications.reminders_enabled IS 'Whether user wants reminders for this medication';
COMMENT ON COLUMN public.medication_logs.status IS 'taken = successfully took, skipped = intentionally skipped, missed = forgot';
