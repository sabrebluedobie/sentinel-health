// src/hooks/useNightscout.js
import { useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

/**
 * Hook for interacting with Nightscout integration
 * Manages per-user Nightscout credentials stored in Supabase
 */
export function useNightscout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getConnection = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error: dbError } = await supabase
        .from("nightscout_connections")
        .select("url, created_at, updated_at")
        .eq("user_id", user.id)
        .maybeSingle(); // ✅ avoids 406

      if (dbError) throw dbError;

      return {
        ok: true,
        connected: !!data?.url,
        connection: data || null,
      };
    } catch (err) {
      const message = err?.message || "Failed to get Nightscout connection";
      setError(message);
      return { ok: false, connected: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const saveConnection = useCallback(async ({ nightscout_url, api_secret }) => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const response = await fetch("/api/nightscout/connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nightscout_url,
          api_secret,
          user_id: user.id,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || "Failed to save connection");
      }

      return { ok: true, connection: result.data };
    } catch (err) {
      const message = err?.message || "Failed to save Nightscout connection";
      setError(message);
      return { ok: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const testConnection = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const response = await fetch(`/api/nightscout/test?user_id=${user.id}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Connection test failed");
      }

      return {
        ok: true,
        data: result.data,
        version: result.data?.version,
      };
    } catch (err) {
      const message = err?.message || "Failed to test Nightscout connection";
      setError(message);
      return { ok: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const syncEntries = useCallback(async (days = 7) => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const response = await fetch("/api/nightscout/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, days }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Sync failed");
      }

      return result.synced || 0;
    } catch (err) {
      const message = err?.message || "Failed to sync from Nightscout";
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
    syncEntries,
  };
}
