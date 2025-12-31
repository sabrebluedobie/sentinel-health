// src/components/DexcomConnection.jsx
import React, { useState, useEffect } from 'react';
import { Link2, RefreshCw, Unlink, CheckCircle, AlertCircle, Clock, Info } from 'lucide-react';
import { useDexcom } from '@/hooks/useDexcom';

export default function DexcomConnection() {
  const {
    loading,
    error,
    connected,
    lastSync,
    syncing,
    connect,
    disconnect,
    sync,
    getSyncStats,
    clearError,
  } = useDexcom();

  const [syncStats, setSyncStats] = useState(null);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  // Load sync stats when component mounts
  useEffect(() => {
    if (connected) {
      loadSyncStats();
    }
  }, [connected]);

  async function loadSyncStats() {
    const stats = await getSyncStats();
    setSyncStats(stats);
  }

  async function handleSync() {
    const result = await sync({ days: 7 });
    if (result.ok) {
      await loadSyncStats();
    }
  }

  async function handleDisconnect() {
    const result = await disconnect();
    if (result.ok) {
      setShowDisconnectConfirm(false);
      setSyncStats(null);
    }
  }

  function formatLastSync(date) {
    if (!date) return 'Never';
    
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800">{error}</p>
              <button
                onClick={clearError}
                className="text-xs text-red-600 hover:text-red-700 underline mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {connected ? (
        <>
          {/* Connected State */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Connected to Dexcom</h3>
                <p className="text-sm text-gray-600">
                  Your glucose data is syncing automatically
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowDisconnectConfirm(true)}
              className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
              disabled={loading}
            >
              <Unlink className="w-4 h-4" />
              Disconnect
            </button>
          </div>

          {/* Sync Stats */}
          {syncStats && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <div>
                <p className="text-xs text-gray-600 mb-1">Total Readings</p>
                <p className="text-3xl font-bold text-blue-600">
                  {syncStats.totalReadings.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Latest Reading</p>
                <p className="text-sm font-semibold text-gray-900">
                  {syncStats.latestReading 
                    ? formatLastSync(syncStats.latestReading)
                    : 'No data yet'}
                </p>
              </div>
            </div>
          )}

          {/* Last Sync */}
          <div className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-700">
              <Clock className="w-4 h-4" />
              <span>Last synced: <strong>{formatLastSync(lastSync)}</strong></span>
            </div>
          </div>

          {/* Sync Button */}
          <button
            onClick={handleSync}
            disabled={syncing || loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
          >
            <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>

          <p className="text-xs text-gray-500 text-center">
            ⏰ Automatically syncs every hour. Manual sync pulls last 7 days of data.
          </p>

          {/* Disconnect Confirmation */}
          {showDisconnectConfirm && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Disconnect Dexcom?
              </h4>
              <p className="text-sm text-yellow-800 mb-3">
                Your existing glucose readings will remain in Sentrya, but new data will not sync automatically.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDisconnect}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                >
                  Disconnect
                </button>
                <button
                  onClick={() => setShowDisconnectConfirm(false)}
                  className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Not Connected State */}
          <div className="text-center py-8">
            <div className="inline-flex p-4 bg-blue-100 rounded-full mb-4">
              <Link2 className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Your Dexcom CGM</h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              Automatically import your glucose readings from Dexcom Clarity. No manual entry required!
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Automatic syncing every hour</p>
                <p className="text-xs text-gray-600">New readings appear without lifting a finger</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Complete data, every 5 minutes</p>
                <p className="text-xs text-gray-600">All your readings with trend arrows</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Discover glucose-migraine patterns</p>
                <p className="text-xs text-gray-600">See correlations you might have missed</p>
              </div>
            </div>
          </div>

          {/* Connect Button */}
          <button
            onClick={connect}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md text-lg"
          >
            <Link2 className="w-6 h-6" />
            {loading ? 'Connecting...' : 'Connect Dexcom Account'}
          </button>

          <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <Info className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-600">
              You'll be redirected to Dexcom to securely authorize access. We only read your glucose data - we can't modify anything in your Dexcom account.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
