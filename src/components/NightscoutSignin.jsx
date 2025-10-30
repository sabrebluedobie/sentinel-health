// src/components/NightscoutSignin.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Database, CheckCircle, XCircle, Loader } from 'lucide-react';

export default function NightscoutSignin() {
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [nightscoutUrl, setNightscoutUrl] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState(""); // 'success', 'error', 'loading'
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Get the logged-in user
    supabase.auth.getUser().then(({ data }) => {
      const user = data?.user;
      if (user) {
        setUserId(user.id);
        setEmail(user.email || "");
        // Removed checkExistingConnection call to avoid 406 RLS errors
        // User can manually test connection after page loads
      }
    });
  }, []);

  async function handleConnect(e) {
    e.preventDefault();
    
    if (!nightscoutUrl || !apiSecret || !userId) {
      setStatus("Please fill in all fields");
      setStatusType("error");
      return;
    }

    setStatus("Connecting to Nightscout...");
    setStatusType("loading");

    try {
      const res = await fetch("/api/nightscout/connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nightscout_url: nightscoutUrl,
          api_secret: apiSecret,
          user_id: userId,
        }),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error || "Failed to connect to Nightscout");
      }

      setStatus("✓ Connected successfully! Your credentials are saved and encrypted.");
      setStatusType("success");
      setIsConnected(true);
      setApiSecret(""); // Clear the secret from the form

    } catch (e) {
      setStatus("✗ Connection failed: " + (e?.message || String(e)));
      setStatusType("error");
    }
  }

  async function handleTestConnection() {
    if (!userId) {
      setStatus("Please log in first");
      setStatusType("error");
      return;
    }

    setStatus("Testing connection...");
    setStatusType("loading");

    try {
      const res = await fetch(`/api/nightscout/test?user_id=${userId}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Test failed");
      }

      setStatus(`✓ Connection successful! Server: ${json.nightscout_status?.name || 'Nightscout'} v${json.nightscout_status?.version || '?'}`);
      setStatusType("success");
      setIsConnected(true);

    } catch (e) {
      setStatus("✗ Test failed: " + (e?.message || String(e)));
      setStatusType("error");
    }
  }

  async function handleSync() {
    if (!userId) {
      setStatus("Please log in first");
      setStatusType("error");
      return;
    }

    setStatus("Syncing glucose data from Nightscout...");
    setStatusType("loading");

    try {
      const res = await fetch("/api/nightscout/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          days: 7, // Last 7 days
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Sync failed");
      }

      setStatus(`✓ Successfully synced ${json.synced} glucose readings from the last 7 days!`);
      setStatusType("success");

    } catch (e) {
      setStatus("✗ Sync failed: " + (e?.message || String(e)));
      setStatusType("error");
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-4">
        <Database className="text-blue-600 mr-3" size={24} />
        <h2 className="text-xl font-semibold text-gray-900">Nightscout Pro Integration</h2>
      </div>

      <p className="text-sm text-gray-600 mb-6">
        Connect your Nightscout instance to sync glucose readings and view correlations with migraines.
      </p>

      {email && (
        <div className="text-sm text-gray-500 mb-4">
          Signed in as <span className="font-medium">{email}</span>
        </div>
      )}

      {!isConnected ? (
        <form onSubmit={handleConnect} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nightscout URL
            </label>
            <input
              type="url"
              value={nightscoutUrl}
              onChange={(e) => setNightscoutUrl(e.target.value)}
              placeholder="e.g., https://your-site.herokuapp.com or https://your-site.vercel.app"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              (e.g., https://your-site.herokuapp.com or https://your-site.nightscoutpro.com)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Secret
            </label>
            <input
              type="password"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              placeholder="Your Nightscout API secret - found in your Nightscout settings"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Your API secret will be encrypted and securely stored
            </p>
          </div>

          <button
            type="submit"
            disabled={statusType === "loading"}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {statusType === "loading" ? (
              <>
                <Loader className="animate-spin mr-2" size={16} />
                Connecting...
              </>
            ) : (
              "Connect Nightscout"
            )}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex items-center text-green-800">
              <CheckCircle className="mr-2" size={20} />
              <span className="text-sm font-medium">Connected to: {nightscoutUrl}</span>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleTestConnection}
              disabled={statusType === "loading"}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {statusType === "loading" ? (
                <>
                  <Loader className="animate-spin mr-2" size={16} />
                  Testing...
                </>
              ) : (
                "Test Connection"
              )}
            </button>

            <button
              onClick={handleSync}
              disabled={statusType === "loading"}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {statusType === "loading" ? (
                <>
                  <Loader className="animate-spin mr-2" size={16} />
                  Syncing...
                </>
              ) : (
                "Sync Data"
              )}
            </button>
          </div>

          <button
            onClick={() => {
              setIsConnected(false);
              setNightscoutUrl("");
              setStatus("");
            }}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Disconnect & Update Connection
          </button>
        </div>
      )}

      {/* Status Message */}
      {status && (
        <div
          className={`mt-4 p-4 rounded-md flex items-center ${
            statusType === "success"
              ? "bg-green-50 text-green-800"
              : statusType === "error"
              ? "bg-red-50 text-red-800"
              : "bg-gray-50 text-gray-800"
          }`}
        >
          {statusType === "loading" ? (
            <Loader className="animate-spin mr-2" size={20} />
          ) : statusType === "success" ? (
            <CheckCircle className="mr-2" size={20} />
          ) : statusType === "error" ? (
            <XCircle className="mr-2" size={20} />
          ) : null}
          <span className="text-sm">{status}</span>
        </div>
      )}
    </div>
  );
}