// src/hooks/useDexcom.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useDexcom() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Check if user has a Dexcom connection on mount
  useEffect(() => {
    checkConnection();
  }, []);

  async function checkConnection() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('dexcom_connections')
        .select('created_at, updated_at')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        setIsConnected(true);
        setLastSync(data.updated_at);
      } else {
        setIsConnected(false);
      }
    } catch (err) {
      console.error('Error checking Dexcom connection:', err);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  }

  async function connectDexcom() {
    try {
      // Get the auth URL from the edge function
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dexcom-oauth-start`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to start OAuth flow');
      }

      const { authUrl } = await response.json();

      // Redirect to Dexcom OAuth page
      window.location.href = authUrl;
    } catch (err) {
      console.error('Error connecting to Dexcom:', err);
      throw err;
    }
  }

  async function disconnectDexcom() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const { error } = await supabase
        .from('dexcom_connections')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setIsConnected(false);
      setLastSync(null);
    } catch (err) {
      console.error('Error disconnecting Dexcom:', err);
      throw err;
    }
  }

  async function syncDexcom() {
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dexcom-sync`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to sync Dexcom data');
      }

      const result = await response.json();
      
      // Update last sync time
      setLastSync(new Date().toISOString());
      
      return result;
    } catch (err) {
      console.error('Error syncing Dexcom data:', err);
      throw err;
    } finally {
      setSyncing(false);
    }
  }

  return {
    isConnected,
    lastSync,
    loading,
    syncing,
    connectDexcom,
    disconnectDexcom,
    syncDexcom,
    checkConnection,
  };
}