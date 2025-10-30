// src/hooks/useNightscout.js
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook for interacting with Nightscout integration
 * Manages per-user Nightscout credentials stored in Supabase
 */
export function useNightscout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Get user's Nightscout connection settings from Supabase directly
   * @returns {Promise<{ok: boolean, connected: boolean, connection?: any, error?: string}>}
   */
  const getConnection = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Query Supabase directly instead of API route
      const { data, error: dbError } = await supabase
        .from('nightscout_connections')
        .select('nightscout_url, created_at, updated_at')
        .eq('user_id', user.id)
        .single();

      if (dbError && dbError.code !== 'PGRST116') {
        throw dbError;
      }

      return {
        ok: true,
        connected: !!data,
        connection: data || null
      };
    } catch (err) {
      const message = err.message || 'Failed to get Nightscout connection';
      setError(message);
      return { ok: false, connected: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Save user's Nightscout connection settings
   * @param {Object} credentials
   * @param {string} credentials.nightscout_url - Nightscout URL
   * @param {string} credentials.api_secret - API secret
   * @returns {Promise<{ok: boolean, connection?: any, error?: string}>}
   */
  const saveConnection = useCallback(async ({ nightscout_url, api_secret }) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/nightscout/connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          nightscout_url, 
          api_secret,
          user_id: user.id
        })
      });
      
      const result = await response.json();
      
      if (!response.ok || result.error) {
        throw new Error(result.error || 'Failed to save connection');
      }
      
      return { ok: true, connection: result.data };
    } catch (err) {
      const message = err.message || 'Failed to save Nightscout connection';
      setError(message);
      return { ok: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Test Nightscout connection using stored credentials
   * @returns {Promise<{ok: boolean, data?: any, error?: string}>}
   */
  const testConnection = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/nightscout/test?user_id=${user.id}`);
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Connection test failed');
      }
      
      return { 
        ok: true, 
        data: result.nightscout_status,
        version: result.nightscout_status?.version 
      };
    } catch (err) {
      const message = err.message || 'Failed to test Nightscout connection';
      setError(message);
      return { ok: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Save glucose reading to Nightscout
   * @param {Object} data
   * @param {number} data.glucose_value - Glucose value in mg/dL
   * @param {string} data.timestamp - ISO timestamp
   * @param {string} [data.direction] - Arrow direction (optional)
   * @param {string} [data.notes] - Additional note (optional)
   */
  const saveGlucose = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/nightscout/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          entry_type: 'glucose',
          data: {
            glucose_value: data.glucose_value || data.value_mgdl,
            timestamp: data.timestamp || data.time,
            direction: data.direction || data.trend,
            notes: data.notes || data.note
          }
        })
      });
      
      const result = await response.json();
      
      if (!response.ok || result.error) {
        throw new Error(result.error || 'Failed to save glucose');
      }
      
      return { ok: true, data: result };
    } catch (err) {
      const message = err.message || 'Failed to save glucose to Nightscout';
      setError(message);
      return { ok: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Save migraine episode to Nightscout as a Treatment
   * @param {Object} data
   * @param {string} data.timestamp - ISO timestamp
   * @param {number} [data.severity] - 1-10 scale
   * @param {string} [data.notes] - Additional notes
   */
  const saveMigraine = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/nightscout/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          entry_type: 'migraine',
          data: {
            timestamp: data.timestamp || data.start_time,
            severity: data.severity,
            notes: data.notes
          }
        })
      });
      
      const result = await response.json();
      
      if (!response.ok || result.error) {
        throw new Error(result.error || 'Failed to save migraine');
      }
      
      return { ok: true, data: result };
    } catch (err) {
      const message = err.message || 'Failed to save migraine to Nightscout';
      setError(message);
      return { ok: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Save a general note to Nightscout
   * @param {Object} data
   * @param {string} data.notes - Note content
   * @param {string} [data.timestamp] - ISO timestamp (defaults to now)
   */
  const saveNote = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/nightscout/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          entry_type: 'note',
          data: {
            notes: data.notes,
            timestamp: data.timestamp || data.start_time || new Date().toISOString()
          }
        })
      });
      
      const result = await response.json();
      
      if (!response.ok || result.error) {
        throw new Error(result.error || 'Failed to save note');
      }
      
      return { ok: true, data: result };
    } catch (err) {
      const message = err.message || 'Failed to save note to Nightscout';
      setError(message);
      return { ok: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Sync recent entries from Nightscout
   * @param {number} [days=7] - Number of days to sync
   */
  const syncEntries = useCallback(async (days = 7) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/nightscout/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          days
        })
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Sync failed');
      }
      
      return result.synced || 0;
    } catch (err) {
      const message = err.message || 'Failed to sync from Nightscout';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getConnection,
    saveConnection,
    testConnection,
    saveGlucose,
    saveMigraine,
    saveNote,
    syncEntries
  };
}