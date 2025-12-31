import React, { useState, useEffect } from "react";
import { Settings, Database, Heart, Mic, Edit3, Check, Activity } from "lucide-react";
import NightscoutSettings from "../components/NightscoutSettings";
import ModulesSettings from "../components/ModulesSettings";

const HealthAppSettings = () => {
  const [activeTab, setActiveTab] = useState("general");
  const [loggingMethod, setLoggingMethod] = useState("manual");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedMethod = localStorage.getItem("loggingMethod");
    if (savedMethod) setLoggingMethod(savedMethod);
  }, []);

  const handleToggle = (method) => {
    setLoggingMethod(method);
    localStorage.setItem("loggingMethod", method);

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "cgm", label: "CGM Integration", icon: Activity },
    { id: "health", label: "Health Connect", icon: Heart },
    { id: "modules", label: "Modules", icon: Database },
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
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
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
        {activeTab === "general" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">General Settings</h2>

            {/* Logging Method Section */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-4">Logging Method</h3>
              <p className="text-sm text-gray-600 mb-4">Choose how you want to log your health data</p>

              <div className="space-y-3">
                {/* Voice Logging Option */}
                <button
                  onClick={() => handleToggle("voice")}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    loggingMethod === "voice"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-full ${
                          loggingMethod === "voice"
                            ? "bg-blue-500 text-white"
                            : "bg-gray-300 text-gray-600"
                        }`}
                      >
                        <Mic className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Voice Logging</div>
                        <div className="text-sm text-gray-600">
                          Speak naturally to log symptoms and triggers
                        </div>
                      </div>
                    </div>
                    {loggingMethod === "voice" && <Check className="w-5 h-5 text-blue-500" />}
                  </div>
                </button>

                {/* Manual Logging Option */}
                <button
                  onClick={() => handleToggle("manual")}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    loggingMethod === "manual"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-full ${
                          loggingMethod === "manual"
                            ? "bg-blue-500 text-white"
                            : "bg-gray-300 text-gray-600"
                        }`}
                      >
                        <Edit3 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Manual Entry</div>
                        <div className="text-sm text-gray-600">
                          Use forms and dropdowns to log your data
                        </div>
                      </div>
                    </div>
                    {loggingMethod === "manual" && <Check className="w-5 h-5 text-blue-500" />}
                  </div>
                </button>
              </div>

              {/* Save Confirmation */}
              {saved && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm text-center">
                  ✓ Preference saved successfully
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-4">Notifications</h3>
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                    defaultChecked
                  />
                  <span className="ml-3 text-sm text-gray-700">Remind me to log glucose readings</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                    defaultChecked
                  />
                  <span className="ml-3 text-sm text-gray-700">Remind me to log sleep data</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                  />
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

        {activeTab === "cgm" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">CGM Integration</h2>
            <p className="text-gray-600 mb-6">
              Connect your continuous glucose monitor to automatically sync your glucose data.
            </p>

            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Nightscout Pro</h3>
              <NightscoutSettings />
            </div>
          </div>
        )}

        {activeTab === "health" && (
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
                  <button
                    disabled
                    className="bg-gray-300 text-gray-500 px-4 py-2 rounded-md cursor-not-allowed"
                  >
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
                  <button
                    disabled
                    className="bg-gray-300 text-gray-500 px-4 py-2 rounded-md cursor-not-allowed"
                  >
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

        {activeTab === "modules" && <ModulesSettings />}
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
