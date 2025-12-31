// src/pages/onboarding/Modules.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useModuleProfile } from "@/hooks/useModuleProfile";
import { MODULE_KEYS } from "@/lib/modules";
import { useAuth } from "@/hooks/useAuth";
import QuickStartGuide from "@/components/QuickStartGuide";

// Module descriptions and recommendations
const MODULE_INFO = {
  glucose: {
    title: "Glucose Tracking",
    description: "Monitor blood sugar levels throughout the day",
    recommended: "Recommended for diabetics and pre-diabetics",
    example: "Track patterns between glucose and migraines",
  },
  migraine: {
    title: "Migraine Logging",
    description: "Record migraine episodes with pain levels and triggers",
    recommended: "Essential for identifying migraine patterns",
    example: "Discover what triggers your migraines",
  },
  sleep: {
    title: "Sleep Tracking",
    description: "Log sleep duration and quality metrics",
    recommended: "Important for understanding recovery and energy",
    example: "See how sleep affects your pain levels",
  },
  pain: {
    title: "Pain Logging",
    description: "Track general pain levels and locations",
    recommended: "Useful for chronic pain management",
    example: "Identify pain patterns and triggers",
  },
  weather: {
    title: "Weather Correlation",
    description: "Automatically track weather conditions",
    recommended: "Helpful if weather affects your symptoms",
    example: "See if barometric pressure triggers migraines",
  },
};

export default function ModuleOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    profile,
    loading,
    setModuleEnabled,
    setModuleOption,
    markOnboardingComplete,
  } = useModuleProfile(user);

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [showQuickStart, setShowQuickStart] = React.useState(false);

  async function handleFinish() {
    setError("");
    setSaving(true);

    try {
      await markOnboardingComplete();
      // Show quick start guide instead of navigating directly
      setShowQuickStart(true);
    } catch (e) {
      setError(e?.message || "Could not save your settings. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleQuickStartDismiss() {
    setShowQuickStart(false);
    navigate("/", { replace: true });
  }

  if (loading || !profile) {
    return <div className="p-6">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Set up what you want to track</h1>
        <p className="text-sm opacity-80">
          Turn on only what you need. You can change this later in Settings.
        </p>
      </header>

      {error && (
        <div className="rounded border border-red-400/40 bg-red-500/10 p-3 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {MODULE_KEYS.map((key) => {
          const info = MODULE_INFO[key];
          return (
            <div 
              key={key} 
              className={`rounded-lg border-2 p-4 transition-all ${
                profile.enabled_modules?.[key] 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!profile.enabled_modules?.[key]}
                  onChange={(e) => setModuleEnabled(key, e.target.checked)}
                  disabled={saving}
                  className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{info.title}</div>
                  <div className="text-sm text-gray-600 mt-1">{info.description}</div>
                  <div className="text-xs text-blue-600 mt-1">{info.recommended}</div>
                  <div className="text-xs text-gray-500 mt-1 italic">💡 {info.example}</div>
                </div>
              </label>

              {key === "glucose" && !!profile.enabled_modules?.glucose && (
                <div className="mt-3 ml-8 p-3 bg-white rounded border">
                  <label className="text-sm flex items-center gap-2">
                    <span className="font-medium">Data Source:</span>
                    <select
                      className="border rounded px-2 py-1 text-sm"
                      value={profile.module_options?.glucose?.source || "manual"}
                      onChange={(e) =>
                        setModuleOption("glucose", { source: e.target.value })
                      }
                      disabled={saving}
                    >
                      <option value="manual">Manual Entry</option>
                      <option value="cgm">CGM (Continuous Monitor)</option>
                    </select>
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-3">
        <button
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
          onClick={handleFinish}
          disabled={saving}
        >
          {saving ? "Saving…" : "Finish setup"}
        </button>

        <button
          className="rounded border px-4 py-2 disabled:opacity-50"
          onClick={() => navigate("/settings", { replace: true })}
          disabled={saving}
        >
          Do this later
        </button>
      </div>
      
      {/* Quick Start Guide Modal */}
      {showQuickStart && (
        <QuickStartGuide 
          moduleProfile={profile} 
          onDismiss={handleQuickStartDismiss} 
        />
      )}
    </div>
  );
}
