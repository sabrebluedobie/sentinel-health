-- Migration: Update existing Dexcom integration schema
-- Created: 2025-12-31
-- Note: This updates an existing dexcom_connections table

-- Add missing columns to dexcom_connections
DO $$
BEGIN
  -- Rename expires_at to token_expires_at for consistency
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'dexcom_connections' 
    AND column_name = 'expires_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'dexcom_connections' 
    AND column_name = 'token_expires_at'
  ) THEN
    ALTER TABLE public.dexcom_connections 
    RENAME COLUMN expires_at TO token_expires_at;
  END IF;

  -- Add dexcom_user_id if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'dexcom_connections' 
    AND column_name = 'dexcom_user_id'
  ) THEN
    ALTER TABLE public.dexcom_connections 
    ADD COLUMN dexcom_user_id TEXT;
  END IF;

  -- Add last_sync_at if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'dexcom_connections' 
    AND column_name = 'last_sync_at'
  ) THEN
    ALTER TABLE public.dexcom_connections 
    ADD COLUMN last_sync_at TIMESTAMPTZ;
  END IF;

  -- Add sync_enabled if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'dexcom_connections' 
    AND column_name = 'sync_enabled'
  ) THEN
    ALTER TABLE public.dexcom_connections 
    ADD COLUMN sync_enabled BOOLEAN DEFAULT TRUE;
  END IF;
END$$;

-- Ensure RLS is enabled
ALTER TABLE public.dexcom_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies (skip if already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'dexcom_connections' 
    AND policyname = 'dexcom_select_own'
  ) THEN
    CREATE POLICY "dexcom_select_own" ON public.dexcom_connections
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'dexcom_connections' 
    AND policyname = 'dexcom_insert_own'
  ) THEN
    CREATE POLICY "dexcom_insert_own" ON public.dexcom_connections
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'dexcom_connections' 
    AND policyname = 'dexcom_update_own'
  ) THEN
    CREATE POLICY "dexcom_update_own" ON public.dexcom_connections
      FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'dexcom_connections' 
    AND policyname = 'dexcom_delete_own'
  ) THEN
    CREATE POLICY "dexcom_delete_own" ON public.dexcom_connections
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END$$;

-- Index for last_sync_at lookups
CREATE INDEX IF NOT EXISTS idx_dexcom_connections_last_sync 
  ON public.dexcom_connections(last_sync_at);

-- Add source column to glucose_readings if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'glucose_readings' 
    AND column_name = 'source'
  ) THEN
    ALTER TABLE public.glucose_readings 
    ADD COLUMN source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'nightscout', 'dexcom'));
  END IF;
END$$;

-- Add trend/direction column for Dexcom data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'glucose_readings' 
    AND column_name = 'trend'
  ) THEN
    ALTER TABLE public.glucose_readings 
    ADD COLUMN trend TEXT; -- 'rising', 'falling', 'stable', etc.
  END IF;
END$$;

-- Add Dexcom-specific ID to prevent duplicates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'glucose_readings' 
    AND column_name = 'external_id'
  ) THEN
    ALTER TABLE public.glucose_readings 
    ADD COLUMN external_id TEXT; -- Dexcom's systemTime or recordId
  END IF;
END$$;

-- Index for deduplication
CREATE INDEX IF NOT EXISTS idx_glucose_readings_external_id 
  ON public.glucose_readings(external_id) 
  WHERE external_id IS NOT NULL;

-- Index for source filtering
CREATE INDEX IF NOT EXISTS idx_glucose_readings_source 
  ON public.glucose_readings(source);

-- Function to clean up old glucose readings (120 days retention)
CREATE OR REPLACE FUNCTION public.cleanup_old_glucose_readings()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.glucose_readings
  WHERE device_time < NOW() - INTERVAL '120 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Function to get user's Dexcom connection status
CREATE OR REPLACE FUNCTION public.get_dexcom_status(p_user_id UUID)
RETURNS TABLE (
  connected BOOLEAN,
  last_sync_at TIMESTAMPTZ,
  sync_enabled BOOLEAN,
  token_expires_at TIMESTAMPTZ,
  needs_refresh BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TRUE as connected,
    dc.last_sync_at,
    dc.sync_enabled,
    dc.token_expires_at,
    (dc.token_expires_at < NOW() + INTERVAL '1 hour') as needs_refresh
  FROM public.dexcom_connections dc
  WHERE dc.user_id = p_user_id;
  
  -- If no rows, return disconnected status
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::TIMESTAMPTZ, FALSE, NULL::TIMESTAMPTZ, FALSE;
  END IF;
END;
$$;

-- Ensure update_updated_at_column function exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure trigger exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_dexcom_connections_updated_at'
  ) THEN
    CREATE TRIGGER update_dexcom_connections_updated_at
      BEFORE UPDATE ON public.dexcom_connections
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END$$;

-- Comments for documentation
COMMENT ON TABLE public.dexcom_connections IS 'Stores Dexcom Clarity OAuth tokens per user';
COMMENT ON COLUMN public.dexcom_connections.access_token IS 'Dexcom OAuth access token (encrypted in app)';
COMMENT ON COLUMN public.dexcom_connections.refresh_token IS 'Dexcom OAuth refresh token (encrypted in app)';
COMMENT ON COLUMN public.dexcom_connections.dexcom_user_id IS 'Dexcom user identifier from their API';
COMMENT ON COLUMN public.glucose_readings.source IS 'Data source: manual, nightscout, or dexcom';
COMMENT ON COLUMN public.glucose_readings.trend IS 'Glucose trend direction from CGM';
COMMENT ON COLUMN public.glucose_readings.external_id IS 'External system ID for deduplication';
