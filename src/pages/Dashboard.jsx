// src/pages/Dashboard.jsx (UPDATE your existing Dashboard)
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import NightscoutSignin from '@/components/NightscoutSignin.jsx';

export default function Dashboard() {
  const [showNightscoutSettings, setShowNightscoutSettings] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            
            {/* Settings Button */}
            <button
              onClick={() => setShowNightscoutSettings(!showNightscoutSettings)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Nightscout Settings
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Nightscout Settings Panel */}
        {showNightscoutSettings && (
          <div className="mb-8 bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Nightscout Configuration</h2>
              <button
                onClick={() => setShowNightscoutSettings(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <NightscoutSignin />
          </div>
        )}

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                to="/log-glucose"
                className="block w-full text-left px-4 py-2 text-blue-600 hover:bg-blue-50 rounded"
              >
                📊 Log Glucose
              </Link>
              <Link
                to="/log-migraine"
                className="block w-full text-left px-4 py-2 text-blue-600 hover:bg-blue-50 rounded"
              >
                🤕 Log Migraine
              </Link>
              <Link
                to="/log-sleep"
                className="block w-full text-left px-4 py-2 text-blue-600 hover:bg-blue-50 rounded"
              >
                💤 Log Sleep
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <p className="text-gray-600">No recent activity</p>
          </div>

          {/* Nightscout Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Nightscout Status</h3>
            <div className="text-sm text-gray-600">
              <p>Click "Nightscout Settings" to configure your connection</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}