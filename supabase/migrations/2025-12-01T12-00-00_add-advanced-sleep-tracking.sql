-- ===== Migration: Add advanced sleep tracking fields =====

-- Add new columns to sleep_data table
ALTER TABLE public.sleep_data
  ADD COLUMN IF NOT EXISTS data_source text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS sleep_quality integer CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
  ADD COLUMN IF NOT EXISTS restfulness integer CHECK (restfulness >= 1 AND restfulness <= 10),
  
  -- Sleep stages (minutes)
  ADD COLUMN IF NOT EXISTS deep_sleep_minutes integer,
  ADD COLUMN IF NOT EXISTS light_sleep_minutes integer,
  ADD COLUMN IF NOT EXISTS rem_sleep_minutes integer,
  ADD COLUMN IF NOT EXISTS awake_minutes integer,
  
  -- Physiological metrics
  ADD COLUMN IF NOT EXISTS resting_heart_rate integer,
  ADD COLUMN IF NOT EXISTS hrv integer,
  ADD COLUMN IF NOT EXISTS avg_spo2 numeric,
  ADD COLUMN IF NOT EXISTS lowest_spo2 numeric,
  ADD COLUMN IF NOT EXISTS avg_respiration numeric,
  ADD COLUMN IF NOT EXISTS body_battery_change integer,
  
  -- Calculated scores
  ADD COLUMN IF NOT EXISTS sleep_score integer CHECK (sleep_score >= 0 AND sleep_score <= 100),
  ADD COLUMN IF NOT EXISTS body_battery_recovery integer CHECK (body_battery_recovery >= 0 AND body_battery_recovery <= 100);

-- Add comments for documentation
COMMENT ON COLUMN public.sleep_data.data_source IS 'Source of sleep data: manual, wearable, csv_import';
COMMENT ON COLUMN public.sleep_data.sleep_quality IS 'Subjective sleep quality rating 1-10';
COMMENT ON COLUMN public.sleep_data.restfulness IS 'Subjective restfulness rating 1-10';
COMMENT ON COLUMN public.sleep_data.deep_sleep_minutes IS 'Minutes in deep sleep stage';
COMMENT ON COLUMN public.sleep_data.light_sleep_minutes IS 'Minutes in light sleep stage';
COMMENT ON COLUMN public.sleep_data.rem_sleep_minutes IS 'Minutes in REM sleep stage';
COMMENT ON COLUMN public.sleep_data.awake_minutes IS 'Minutes awake during sleep period';
COMMENT ON COLUMN public.sleep_data.resting_heart_rate IS 'Resting heart rate in bpm during sleep';
COMMENT ON COLUMN public.sleep_data.hrv IS 'Heart rate variability in milliseconds';
COMMENT ON COLUMN public.sleep_data.avg_spo2 IS 'Average blood oxygen saturation percentage';
COMMENT ON COLUMN public.sleep_data.lowest_spo2 IS 'Lowest blood oxygen saturation percentage';
COMMENT ON COLUMN public.sleep_data.avg_respiration IS 'Average breaths per minute';
COMMENT ON COLUMN public.sleep_data.body_battery_change IS 'Garmin Body Battery change during sleep';
COMMENT ON COLUMN public.sleep_data.sleep_score IS 'Calculated sleep score 0-100 (Sentrya algorithm)';
COMMENT ON COLUMN public.sleep_data.body_battery_recovery IS 'Calculated body battery recovery 0-100';

-- Create index for sleep score queries
CREATE INDEX IF NOT EXISTS idx_sleep_data_sleep_score 
  ON public.sleep_data(user_id, start_time DESC, sleep_score);

-- Create view for sleep quality trends
CREATE OR REPLACE VIEW public.sleep_quality_trends AS
SELECT 
  user_id,
  DATE(start_time AT TIME ZONE 'UTC') AS day,
  AVG(sleep_score)::numeric AS avg_sleep_score,
  AVG(body_battery_recovery)::numeric AS avg_body_battery,
  AVG(total_sleep_hours)::numeric AS avg_hours,
  COUNT(*) AS sleep_sessions
FROM public.sleep_data
WHERE sleep_score IS NOT NULL
GROUP BY user_id, DATE(start_time AT TIME ZONE 'UTC')
ORDER BY day DESC;

GRANT SELECT ON public.sleep_quality_trends TO authenticated;

COMMENT ON VIEW public.sleep_quality_trends IS 'Daily sleep quality metrics for trend analysis';

-- Create RPC for sleep insights
CREATE OR REPLACE FUNCTION public.get_sleep_insights(days integer DEFAULT 30)
RETURNS TABLE(
  avg_sleep_score numeric,
  avg_body_battery numeric,
  avg_sleep_hours numeric,
  best_sleep_day date,
  best_sleep_score integer,
  worst_sleep_day date,
  worst_sleep_score integer,
  consistent_sleeper boolean
)
LANGUAGE sql
SECURITY INVOKER
AS $$
  WITH sleep_stats AS (
    SELECT 
      AVG(sleep_score)::numeric AS avg_score,
      AVG(body_battery_recovery)::numeric AS avg_battery,
      AVG(total_sleep_hours)::numeric AS avg_hours,
      STDDEV(sleep_score)::numeric AS score_stddev
    FROM public.sleep_data
    WHERE user_id = auth.uid()
      AND start_time >= NOW() - make_interval(days => days)
      AND sleep_score IS NOT NULL
  ),
  best_day AS (
    SELECT 
      DATE(start_time AT TIME ZONE 'UTC') AS day,
      sleep_score
    FROM public.sleep_data
    WHERE user_id = auth.uid()
      AND start_time >= NOW() - make_interval(days => days)
      AND sleep_score IS NOT NULL
    ORDER BY sleep_score DESC
    LIMIT 1
  ),
  worst_day AS (
    SELECT 
      DATE(start_time AT TIME ZONE 'UTC') AS day,
      sleep_score
    FROM public.sleep_data
    WHERE user_id = auth.uid()
      AND start_time >= NOW() - make_interval(days => days)
      AND sleep_score IS NOT NULL
    ORDER BY sleep_score ASC
    LIMIT 1
  )
  SELECT 
    s.avg_score,
    s.avg_battery,
    s.avg_hours,
    b.day,
    b.sleep_score,
    w.day,
    w.sleep_score,
    (s.score_stddev < 15) AS consistent_sleeper
  FROM sleep_stats s
  CROSS JOIN best_day b
  CROSS JOIN worst_day w;
$$;

COMMENT ON FUNCTION public.get_sleep_insights IS 'Returns sleep quality insights for the specified number of days';