// src/pages/CGMSettings.jsx
import React, { useState } from 'react';
import { Activity } from 'lucide-react';
import NightscoutSignin from '@/components/NightscoutSignin.jsx';
import DexcomConnection from '@/components/DexcomConnection.jsx';

export default function CGMSettings() {
  const [activeTab, setActiveTab] = useState("nightscout");
 // Start with Nightscout as primary

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Activity className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">CGM Integration</h1>
        </div>
        <p className="text-gray-600">
          Connect your continuous glucose monitor to automatically sync readings and discover patterns with migraines.
        </p>
      </div>

      {/* Provider Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('dexcom')}
              className={`flex-1 px-6 py-4 text-center font-medium border-b-2 transition-colors ${
                activeTab === 'dexcom'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg">📊</span>
                <span>Dexcom</span>
              </div>
              <p className="text-xs mt-1 opacity-75">Recommended</p>
            </button>
            <button
              onClick={() => setActiveTab('nightscout')}
              className={`flex-1 px-6 py-4 text-center font-medium border-b-2 transition-colors ${
                activeTab === 'nightscout'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg">🌙</span>
                <span>Nightscout</span>
              </div>
              <p className="text-xs mt-1 opacity-75">Self-hosted</p>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'dexcom' ? (
            <DexcomConnection />
          ) : (
            <div>
              <NightscoutSignin />
              
              {/* Help text for Nightscout users */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  About Nightscout
                </h4>
                <p className="text-sm text-blue-800">
                  Nightscout is an open-source platform for viewing CGM data. If you're using Dexcom, 
                  we recommend connecting directly through the Dexcom tab above for easier setup and 
                  automatic syncing.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* General Info */}
      <div className="mt-6 space-y-4">
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">📱 About CGM Integration</h3>
          <ul className="text-sm text-gray-700 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span><strong>Automatic syncing:</strong> New readings every hour</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span><strong>Complete data:</strong> Every reading with trends</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span><strong>Better insights:</strong> See glucose-migraine correlations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span><strong>120-day retention:</strong> Historical data for pattern analysis</span>
            </li>
          </ul>
        </div>

        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-medium text-yellow-900 mb-2">🔐 Privacy & Security</h3>
          <p className="text-sm text-yellow-800">
            Your CGM data is encrypted and stored securely. We never share your health data with 
            third parties. You can disconnect and delete your data at any time.
          </p>
        </div>
      </div>
    </div>
  );
}
