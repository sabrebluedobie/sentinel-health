// src/pages/Settings.jsx (wired to /api)
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import supabase from "@/lib/supabase";

export default function Settings() {
  const [url, setUrl] = useState("");
  const [token, setToken] = useState(""); // optional Nightscout token
  const [apiSecret, setApiSecret] = useState(""); // optional API secret
  const [msg, setMsg] = useState("");
  const [kind, setKind] = useState("info"); // 'ok' | 'err' | 'info'
  const [busy, setBusy] = useState(false);

import React, { useState } from 'react';
import { Settings, Database, Heart, Moon, Droplets, User } from 'lucide-react';

const HealthAppSettings = () => {
  const [activeTab, setActiveTab] = useState('general');

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
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nightscout URL</label>
                  <input 
                    type="url" 
                    placeholder="https://your-site.herokuapp.com"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">API Secret</label>
                  <input 
                    type="password" 
                    placeholder="Your API secret"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex space-x-4">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                    Test Connection
                  </button>
                  <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
                    Save & Connect
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-4">Sync Settings</h3>
              <div className="space-y-4">
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200" defaultChecked />
                  <span className="ml-3 text-sm text-gray-700">Auto-sync glucose readings</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200" />
                  <span className="ml-3 text-sm text-gray-700">Sync historical data</span>
                </label>
              </div>
            </div>
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
                  <span className="text-sm text-gray-500 mr-3">Disconnected</span>
                  <button className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors">
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
                  <span className="text-sm text-green-600 mr-3">Connected</span>
                  <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors">
                    Disconnect
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <p>Currently syncing: Steps, Sleep, Heart Rate</p>
              </div>
            </div>

            