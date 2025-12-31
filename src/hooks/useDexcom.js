// src/hooks/useDexcom.js
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook for Dexcom Clarity API integration
 * Handles OAuth flow, token management, and glucose data syncing
 * 
 * @returns {Object} Dexcom integration methods and state
 */
export function useDexcom() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [syncing, setSyncing] = useState(false);

  /**
   * Check if user has Dexcom connected
   */
  const checkConnection = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { connected: false };

      const { data, error: dbError } = await supabase
        .from('dexcom_connections')
        .select('last_sync_at, sync_enabled, token_expires_at')
        .eq('user_id', user.id)
        .single();

      if (dbError && dbError.code !== 'PGRST116') {
        throw dbError;
      }

      const isConnected = !!data;
      setConnected(isConnected);
      if (data?.last_sync_at) {
        setLastSync(new Date(data.last_sync_at));
      }

      return {
        connected: isConnected,
        lastSync: data?.last_sync_at,
        syncEnabled: data?.sync_enabled,
        tokenExpiresAt: data?.token_expires_at,
      };
    } catch (err) {
      console.error('[Dexcom] Error checking connection:', err);
      setError(err.message);
      return { connected: false };
    }
  }, []);

  // Auto-check connection on mount
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  /**
   * Start OAuth flow - redirects to Dexcom authorization
   */
  const connect = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Call serverless function to get OAuth URL
      const response = await fetch('/api/dexcom/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Failed to start OAuth flow');
      }

      // Redirect to Dexcom
      window.location.href = result.authUrl;

    } catch (err) {
      const message = err.message || 'Failed to connect to Dexcom';
      setError(message);
      setLoading(false);
      return { ok: false, error: message };
    }
  }, []);

  /**
   * Handle OAuth callback (called after Dexcom redirects back)
   * @param {string} code - Authorization code from Dexcom
   */
  const handleCallback = useCallback(async (code) => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Exchange code for tokens
      const response = await fetch('/api/dexcom/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code,
          user_id: user.id,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Failed to complete OAuth');
      }

      setConnected(true);
      return { ok: true, data: result };

    } catch (err) {
      const message = err.message || 'Failed to complete Dexcom connection';
      setError(message);
      return { ok: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Disconnect Dexcom (revoke tokens)
   */
  const disconnect = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Delete connection from database
      const { error: dbError } = await supabase
        .from('dexcom_connections')
        .delete()
        .eq('user_id', user.id);

      if (dbError) throw dbError;

      setConnected(false);
      setLastSync(null);
      return { ok: true };

    } catch (err) {
      const message = err.message || 'Failed to disconnect Dexcom';
      setError(message);
      return { ok: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Manually sync glucose data from Dexcom
   * @param {Object} options
   * @param {number} [options.days=7] - Number of days to sync
   * @param {Date} [options.startDate] - Start date for sync
   * @param {Date} [options.endDate] - End date for sync
   */
  const sync = useCallback(async (options = {}) => {
    setSyncing(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const { days = 7, startDate, endDate } = options;

      // Call sync function
      const response = await fetch('/api/dexcom/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          days,
          start_date: startDate?.toISOString(),
          end_date: endDate?.toISOString(),
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Sync failed');
      }

      setLastSync(new Date());
      
      // Update last_sync_at in database
      await supabase
        .from('dexcom_connections')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('user_id', user.id);

      return {
        ok: true,
        synced: result.synced || 0,
        message: `Synced ${result.synced || 0} glucose readings`,
      };

    } catch (err) {
      const message = err.message || 'Failed to sync from Dexcom';
      setError(message);
      return { ok: false, error: message, synced: 0 };
    } finally {
      setSyncing(false);
    }
  }, []);

  /**
   * Get sync stats (how much data was synced)
   */
  const getSyncStats = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get count of Dexcom readings
      const { count, error: countError } = await supabase
        .from('glucose_readings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('source', 'dexcom');

      if (countError) throw countError;

      // Get date range
      const { data: rangeData, error: rangeError } = await supabase
        .from('glucose_readings')
        .select('device_time')
        .eq('user_id', user.id)
        .eq('source', 'dexcom')
        .order('device_time', { ascending: false })
        .limit(1);

      if (rangeError) throw rangeError;

      const latestReading = rangeData?.[0]?.device_time;

      return {
        totalReadings: count || 0,
        latestReading: latestReading ? new Date(latestReading) : null,
      };

    } catch (err) {
      console.error('[Dexcom] Error getting sync stats:', err);
      return null;
    }
  }, []);

  /**
   * Clean up old glucose readings (120 days retention)
   */
  const cleanupOldReadings = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('cleanup_old_glucose_readings');

      if (error) throw error;

      return {
        ok: true,
        deleted: data || 0,
      };

    } catch (err) {
      console.error('[Dexcom] Error cleaning up old readings:', err);
      return { ok: false, error: err.message };
    }
  }, []);

  return {
    // State
    loading,
    error,
    connected,
    lastSync,
    syncing,

    // Methods
    connect,
    disconnect,
    handleCallback,
    sync,
    checkConnection,
    getSyncStats,
    cleanupOldReadings,

    // Clear error
    clearError: useCallback(() => setError(null), []),
  };
}
