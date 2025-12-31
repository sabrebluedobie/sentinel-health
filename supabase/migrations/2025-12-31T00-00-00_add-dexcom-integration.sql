-- Migration: Add Dexcom Clarity OAuth integration
-- Created: 2025-12-31

-- Table to store Dexcom OAuth tokens per user
CREATE TABLE IF NOT EXISTS public.dexcom_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- OAuth tokens
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  
  -- Metadata
  dexcom_user_id TEXT, -- Dexcom's user identifier
  last_sync_at TIMESTAMPTZ,
  sync_enabled BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- One connection per user
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.dexcom_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "dexcom_select_own" ON public.dexcom_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "dexcom_insert_own" ON public.dexcom_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "dexcom_update_own" ON public.dexcom_connections
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "dexcom_delete_own" ON public.dexcom_connections
  FOR DELETE USING (auth.uid() = user_id);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_dexcom_connections_user_id ON public.dexcom_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_dexcom_connections_last_sync ON public.dexcom_connections(last_sync_at);

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

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_dexcom_connections_updated_at
  BEFORE UPDATE ON public.dexcom_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE public.dexcom_connections IS 'Stores Dexcom Clarity OAuth tokens per user';
COMMENT ON COLUMN public.dexcom_connections.access_token IS 'Dexcom OAuth access token (encrypted in app)';
COMMENT ON COLUMN public.dexcom_connections.refresh_token IS 'Dexcom OAuth refresh token (encrypted in app)';
COMMENT ON COLUMN public.dexcom_connections.dexcom_user_id IS 'Dexcom user identifier from their API';
COMMENT ON COLUMN public.glucose_readings.source IS 'Data source: manual, nightscout, or dexcom';
COMMENT ON COLUMN public.glucose_readings.trend IS 'Glucose trend direction from CGM';
COMMENT ON COLUMN public.glucose_readings.external_id IS 'External system ID for deduplication';
