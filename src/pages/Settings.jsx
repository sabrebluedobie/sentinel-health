import React, { useState, useEffect } from 'react';
import { Settings, Database, Heart, CheckCircle, XCircle, Loader } from 'lucide-react';
import { useNightscout } from '../hooks/useNightscout';
import supabase from '../lib/supabase';

const HealthAppSettings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const { loading, error, testConnection, syncEntries } = useNightscout();
  
  // Nightscout state
  const [connectionStatus, setConnectionStatus] = useState(null); // 'success', 'error', null
  const [testMessage, setTestMessage] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [syncLoading, setSyncLoading] = useState(false);

  // Check if Nightscout is configured
  useEffect(() => {
    checkNightscoutConfig();
  }, []);

  async function checkNightscoutConfig() {
    // We can't see the env vars from frontend, but we can test the connection
    // to see if it's configured
    setTestMessage('Checking configuration...');
    const result = await testConnection();
    
    if (result.ok) {
      setIsConfigured(true);
      setConnectionStatus('success');
      setTestMessage('Nightscout is configured and connected');
    } else {
      setIsConfigured(false);
      setConnectionStatus('error');
      setTestMessage('Nightscout not configured. Add environment variables in Vercel.');
    }
  }

  async function handleTestConnection() {
    setConnectionStatus(null);
    setTestMessage('Testing connection...');
    
    const result = await testConnection();
    
    if (result.ok) {
      setConnectionStatus('success');
      setTestMessage(`✓ Connected successfully! Server: ${result.data?.name || 'Nightscout'}`);
      setIsConfigured(true);
    } else {
      setConnectionStatus('error');
      setTestMessage(`✗ Connection failed: ${result.error}`);
      setIsConfigured(false);
    }
  }

  async function handleSyncNow() {
    setSyncLoading(true);
    setTestMessage('Syncing from Nightscout...');
    
    try {
      const entries = await syncEntries(100);
      setLastSync(new Date());
      setTestMessage(`✓ Synced ${entries.length} entries from Nightscout`);
      setConnectionStatus('success');
    } catch (err) {
      setTestMessage(`✗ Sync failed: ${err.message}`);
      setConnectionStatus('error');
    } finally {
      setSyncLoading(false);
    }
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'nightscout', label: 'Nightscout Pro', icon: Database },
    { id: 'health', label: 'Health Connect', icon: Heart }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your health tracking preferences</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <IconComponent size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'general' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">General Settings</h2>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-4">Notifications</h3>
              <div className="space-y-4">
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200" defaultChecked />
                  <span className="ml-3 text-sm text-gray-700">Remind me to log glucose readings</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200" defaultChecked />
                  <span className="ml-3 text-sm text-gray-700">Remind me to log sleep data</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200" />
                  <span className="ml-3 text-sm text-gray-700">Migraine episode alerts</span>
                </label>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-4">Units</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Glucose Units</label>
                  <select className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                    <option>mg/dL</option>
                    <option>mmol/L</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time Format</label>
                  <select className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                    <option>12-hour</option>
                    <option>24-hour</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'nightscout' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Nightscout Pro Integration</h2>
            
            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="flex items-center mb-4">
                <Database className="text-blue-600 mr-3" size={24} />
                <h3 className="font-medium text-gray-900">Connect to Nightscout</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Sync your glucose data with your Nightscout instance for comprehensive tracking.
              </p>
              
              {/* Configuration Instructions */}
              <div className="bg-white p-4 rounded-md mb-4 text-sm text-gray-700">
                <p className="font-medium mb-2">Configuration Required:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Go to your Vercel project dashboard</li>
                  <li>Navigate to Settings → Environment Variables</li>
                  <li>Add <code className="bg-gray-100 px-1 py-0.5 rounded">NIGHTSCOUT_URL</code> (e.g., https://your-site.herokuapp.com)</li>
                  <li>Add <code className="bg-gray-100 px-1 py-0.5 rounded">NIGHTSCOUT_API_SECRET</code> (your API secret)</li>
                  <li>Redeploy your app or test the connection below</li>
                </ol>
              </div>

              {/* Connection Status */}
              {testMessage && (
                <div className={`p-4 rounded-md mb-4 flex items-center ${
                  connectionStatus === 'success' ? 'bg-green-50 text-green-800' :
                  connectionStatus === 'error' ? 'bg-red-50 text-red-800' :
                  'bg-gray-50 text-gray-800'
                }`}>
                  {loading ? (
                    <Loader className="animate-spin mr-2" size={20} />
                  ) : connectionStatus === 'success' ? (
                    <CheckCircle className="mr-2" size={20} />
                  ) : connectionStatus === 'error' ? (
                    <XCircle className="mr-2" size={20} />
                  ) : null}
                  <span className="text-sm">{testMessage}</span>
                </div>
              )}
              
              <div className="flex space-x-4">
                <button 
                  onClick={handleTestConnection}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <>
                      <Loader className="animate-spin mr-2" size={16} />
                      Testing...
                    </>
                  ) : (
                    'Test Connection'
                  )}
                </button>
                
                {isConfigured && (
                  <button 
                    onClick={handleSyncNow}
                    disabled={syncLoading}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                  >
                    {syncLoading ? (
                      <>
                        <Loader className="animate-spin mr-2" size={16} />
                        Syncing...
                      </>
                    ) : (
                      'Sync Now'
                    )}
                  </button>
                )}
              </div>

              {lastSync && (
                <p className="text-xs text-gray-600 mt-2">
                  Last sync: {lastSync.toLocaleString()}
                </p>
              )}
            </div>

            {isConfigured && (
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-4">Sync Settings</h3>
                <div className="space-y-4">
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200" defaultChecked />
                    <span className="ml-3 text-sm text-gray-700">Auto-sync glucose readings to Nightscout</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200" />
                    <span className="ml-3 text-sm text-gray-700">Send migraine episodes to Nightscout as treatments</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200" />
                    <span className="ml-3 text-sm text-gray-700">Import historical data from Nightscout</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'health' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Health Platform Integration</h2>
            
            {/* Apple Health */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center mr-3">
                    <Heart className="text-white" size={16} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Apple Health</h3>
                    <p className="text-sm text-gray-500">Sync with HealthKit</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-3">Coming Soon</span>
                  <button disabled className="bg-gray-300 text-gray-500 px-4 py-2 rounded-md cursor-not-allowed">
                    Connect
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <p>Connect to sync sleep data, heart rate, and other health metrics.</p>
              </div>
            </div>

            {/* Google Health */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                    <Heart className="text-white" size={16} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Google Health Connect</h3>
                    <p className="text-sm text-gray-500">Sync with Google Fit</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-3">Coming Soon</span>
                  <button disabled className="bg-gray-300 text-gray-500 px-4 py-2 rounded-md cursor-not-allowed">
                    Connect
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <p>Future integration: Steps, Sleep, Heart Rate</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Data Management Section */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Management</h2>
        <div className="space-y-4">
          <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
            Export All Data
          </button>
          <button className="text-red-600 hover:text-red-700 font-medium text-sm block">
            Delete All Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default HealthAppSettings;
