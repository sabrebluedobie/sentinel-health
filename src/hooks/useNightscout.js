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
   * Get user's Nightscout connection settings
   * @returns {Promise<{ok: boolean, connected: boolean, connection?: any, error?: string}>}
   */
  const getConnection = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/nightscout/get-connection', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.error || 'Failed to get connection');
      }
      
      return result;
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/nightscout/connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ nightscout_url, api_secret })
      });
      
      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.error || 'Failed to save connection');
      }
      
      return result;
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
   * @returns {Promise<{ok: boolean, version?: string, error?: string}>}
   */
  const testConnection = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/nightscout/test', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.error || 'Connection test failed');
      }
      
      return result;
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
   * @param {number} data.value_mgdl - Glucose value in mg/dL
   * @param {string} data.time - ISO timestamp
   * @param {string} data.reading_type - "sgv" (CGM) or "mbg" (finger stick)
   * @param {string} [data.trend] - Arrow direction (optional)
   * @param {string} [data.note] - Additional note (optional)
   */
  const saveGlucose = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/nightscout/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          kind: 'glucose',
          ...data
        })
      });
      
      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.error || 'Failed to save glucose');
      }
      
      return result;
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
   * @param {string} data.start_time - ISO timestamp
   * @param {string} [data.end_time] - ISO timestamp (optional)
   * @param {number} [data.severity] - 1-10 scale
   * @param {string} [data.triggers] - Comma-separated triggers
   * @param {string} [data.meds_taken] - Medications taken
   * @param {string} [data.notes] - Additional notes
   */
  const saveMigraine = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/nightscout/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          kind: 'migraine',
          ...data
        })
      });
      
      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.error || 'Failed to save migraine');
      }
      
      return result;
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
   * @param {string} [data.title] - Note title
   * @param {string} data.notes - Note content
   * @param {string} [data.start_time] - ISO timestamp (defaults to now)
   */
  const saveNote = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/nightscout/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          kind: 'note',
          ...data
        })
      });
      
      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.error || 'Failed to save note');
      }
      
      return result;
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
   * @param {number} [count=50] - Number of entries to fetch
   */
  const syncEntries = useCallback(async (count = 50) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/nightscout/sync?count=${count}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.error || 'Sync failed');
      }
      
      return result.data || [];
    } catch (err) {
      const message = err.message || 'Failed to sync from Nightscout';
      setError(message);
      return [];
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
}// src/hooks/useNightscout.js
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
   * Get user's Nightscout connection settings
   * @returns {Promise<{ok: boolean, connected: boolean, connection?: any, error?: string}>}
   */
  const getConnection = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/nightscout/get-connection', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.error || 'Failed to get connection');
      }
      
      return result;
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/nightscout/connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ nightscout_url, api_secret })
      });
      
      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.error || 'Failed to save connection');
      }
      
      return result;
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
   * @returns {Promise<{ok: boolean, version?: string, error?: string}>}
   */
  const testConnection = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/nightscout/test', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.error || 'Connection test failed');
      }
      
      return result;
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
   * @param {number} data.value_mgdl - Glucose value in mg/dL
   * @param {string} data.time - ISO timestamp
   * @param {string} data.reading_type - "sgv" (CGM) or "mbg" (finger stick)
   * @param {string} [data.trend] - Arrow direction (optional)
   * @param {string} [data.note] - Additional note (optional)
   */
  const saveGlucose = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/nightscout/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          kind: 'glucose',
          ...data
        })
      });
      
      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.error || 'Failed to save glucose');
      }
      
      return result;
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
   * @param {string} data.start_time - ISO timestamp
   * @param {string} [data.end_time] - ISO timestamp (optional)
   * @param {number} [data.severity] - 1-10 scale
   * @param {string} [data.triggers] - Comma-separated triggers
   * @param {string} [data.meds_taken] - Medications taken
   * @param {string} [data.notes] - Additional notes
   */
  const saveMigraine = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/nightscout/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          kind: 'migraine',
          ...data
        })
      });
      
      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.error || 'Failed to save migraine');
      }
      
      return result;
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
   * @param {string} [data.title] - Note title
   * @param {string} data.notes - Note content
   * @param {string} [data.start_time] - ISO timestamp (defaults to now)
   */
  const saveNote = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/nightscout/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          kind: 'note',
          ...data
        })
      });
      
      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.error || 'Failed to save note');
      }
      
      return result;
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
   * @param {number} [count=50] - Number of entries to fetch
   */
  const syncEntries = useCallback(async (count = 50) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/nightscout/sync?count=${count}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.error || 'Sync failed');
      }
      
      return result.data || [];
    } catch (err) {
      const message = err.message || 'Failed to sync from Nightscout';
      setError(message);
      return [];
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