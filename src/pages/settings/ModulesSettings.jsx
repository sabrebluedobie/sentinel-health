import React, { useState } from "react";
import { useAuth } from "@/components/AuthContext";
import { useModuleProfile } from "@/hooks/useModuleProfile";
import { MODULE_KEYS } from "@/lib/modules";

export default function ModulesSettings() {
  console.log('[ModulesSettings] Component mounting...');
  
  const { user } = useAuth();
  console.log('[ModulesSettings] user:', user);
  
  const {
    profile,
    loading,
    setModuleEnabled,
    setModuleOption,
    setOnboardingComplete, // we'll add this to the hook below
  } = useModuleProfile(user);
  
  console.log('[ModulesSettings] profile:', profile, 'loading:', loading);

  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [error, setError] = useState(false);

  function flash(msg, isError = false) {
    setSavedMsg(msg);
    setError(isError);
    setTimeout(() => {
      setSavedMsg("");
      setError(false);
    }, 1800);
  }

  async function toggleModule(key, enabled) {
    console.log('[ModulesSettings] toggleModule called:', { key, enabled, currentProfile: profile });
    setSaving(true);
    try {
      console.log('[ModulesSettings] calling setModuleEnabled...');
      await setModuleEnabled(key, enabled);
      console.log('[ModulesSettings] setModuleEnabled complete, calling setOnboardingComplete...');
      // if they change modules here, we consider onboarding done
      await setOnboardingComplete(true);
      console.log('[ModulesSettings] all saves complete!');
      flash("Module settings saved");
    } catch (err) {
      console.error('[ModulesSettings] toggleModule error:', err);
      flash("Error saving: " + (err.message || 'Unknown error'), true);
    } finally {
      setSaving(false);
      console.log('[ModulesSettings] toggleModule finished');
    }
  }

  async function updateGlucoseSource(source) {
    setSaving(true);
    try {
      await setModuleOption("glucose", { source });
      await setOnboardingComplete(true);
      flash("Glucose settings saved");
    } catch (err) {
      console.error('[ModulesSettings] updateGlucoseSource error:', err);
      flash("Error saving: " + (err.message || 'Unknown error'), true);
    } finally {
      setSaving(false);
    }
  }

  async function rerunOnboarding() {
    setSaving(true);
    try {
      await setOnboardingComplete(false);
      flash("Onboarding will run next time you open the app");
    } catch (err) {
      console.error('[ModulesSettings] rerunOnboarding error:', err);
      flash("Error saving: " + (err.message || 'Unknown error'), true);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !profile) return <div className="p-4">Loading…</div>;

  // Show warning if not authenticated
  if (!user) {
    return (
      <div className="space-y-6">
        <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-900 mb-2">Authentication Required</h3>
          <p className="text-yellow-800 text-sm mb-4">
            You need to be signed in to save module settings. Settings will only be saved locally until you sign in.
          </p>
          <a 
            href="/sign-in" 
            className="inline-block px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm font-medium"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Modules</h2>
        <p className="text-gray-600 text-sm">
          Turn on only what you want to track. Disabled modules disappear from navigation and dashboard.
        </p>
      </div>

      {savedMsg && (
        <div className={`p-3 border rounded-lg text-sm text-center ${
          error 
            ? 'bg-red-50 border-red-200 text-red-800' 
            : 'bg-green-50 border-green-200 text-green-800'
        }`}>
          {error ? '✗' : '✓'} {savedMsg}
        </div>
      )}

      <div className="space-y-3">
        {MODULE_KEYS.map((key) => (
          <div key={key} className="bg-gray-50 p-6 rounded-lg">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                checked={!!profile.enabled_modules?.[key]}
                onChange={(e) => toggleModule(key, e.target.checked)}
                disabled={saving}
              />
              <span className="font-medium text-gray-900 capitalize">{key}</span>
            </label>

            {key === "glucose" && !!profile.enabled_modules?.glucose && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Glucose source
                </label>
                <select
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={profile.module_options?.glucose?.source || "manual"}
                  onChange={(e) => updateGlucoseSource(e.target.value)}
                  disabled={saving}
                >
                  <option value="manual">Manual</option>
                  <option value="cgm">CGM</option>
                </select>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="pt-2">
        <button
          onClick={rerunOnboarding}
          disabled={saving}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Re-run onboarding on next launch
        </button>
      </div>
    </div>
  );
}
