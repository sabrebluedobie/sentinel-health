import React, { useState, useEffect } from 'react';
import { Settings, Database, Heart } from 'lucide-react';
import NightscoutSettings from '../components/NightscoutSettings';
import { supabase } from '@/lib/supabase';

const HealthAppSettings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [migraneLoggingMethod, setMigraineLoggingMethod] = useState('manual');
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user preferences on mount
  useEffect(() => {
    loadUserPreferences();
  }, []);

  const loadUserPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setUserId(user.id);
      
      // Check if user_preferences table exists and load preference
      const { data, error } = await supabase
        .from('user_preferences')
        .select('migraine_logging_method')
        .eq('user_id', user.id)
        .single();
      
      if (data && data.migraine_logging_method) {
        setMigraineLoggingMethod(data.migraine_logging_method);
      }
    } catch (err) {
      console.log('Error loading preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateMigraineLoggingMethod = async (method) => {
    setMigraineLoggingMethod(method);
    
    if (!userId) return;
    
    try {
      // Upsert the preference
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          migraine_logging_method: method,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
      
      if (error) {
        console.error('Error saving preference:', error);
      }
    } catch (err) {
      console.error('Error updating preference:', err);
    }
  };

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
            
            {/* Migraine Logging Method */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Migraine Logging Method</h3>
              <p className="text-sm text-gray-600 mb-4">
                Choose how you prefer to log your migraines. Voice mode dims the screen and uses a gentle conversation to collect information.
              </p>
              <div className="space-y-3">
                <label className="flex items-start p-3 bg-white rounded-lg border-2 transition-all cursor-pointer hover:border-purple-300 ${migraneLoggingMethod === 'manual' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}">
                  <input
                    type="radio"
                    name="migraneLoggingMethod"
                    value="manual"
                    checked={migraneLoggingMethod === 'manual'}
                    onChange={(e) => updateMigraineLoggingMethod(e.target.value)}
                    className="mt-1 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="ml-3">
                    <div className="font-medium text-gray-900">Manual Entry</div>
                    <div className="text-sm text-gray-600">Fill out a traditional form with all migraine details</div>
                  </div>
                </label>
                
                <label className="flex items-start p-3 bg-white rounded-lg border-2 transition-all cursor-pointer hover:border-purple-300 ${migraneLoggingMethod === 'voice' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}">
                  <input
                    type="radio"
                    name="migraneLoggingMethod"
                    value="voice"
                    checked={migraneLoggingMethod === 'voice'}
                    onChange={(e) => updateMigraineLoggingMethod(e.target.value)}
                    className="mt-1 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="ml-3">
                    <div className="font-medium text-gray-900">Voice Conversation</div>
                    <div className="text-sm text-gray-600">Screen dims and a gentle voice guides you through logging</div>
                    <div className="text-xs text-purple-600 mt-1 font-medium">Migraine-friendly option</div>
                  </div>
                </label>
              </div>
            </div>
            
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
            <NightscoutSettings />
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