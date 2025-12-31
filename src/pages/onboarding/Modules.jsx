// src/pages/onboarding/Modules.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useModuleProfile } from "@/hooks/useModuleProfile";
import { MODULE_KEYS } from "@/lib/modules";
import { useAuth } from "@/hooks/useAuth";

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

  async function handleFinish() {
    setError("");
    setSaving(true);

    try {
      await markOnboardingComplete();
      navigate("/", { replace: true });
    } catch (e) {
      setError(e?.message || "Could not save your settings. Please try again.");
    } finally {
      setSaving(false);
    }
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
        {MODULE_KEYS.map((key) => (
          <div key={key} className="rounded border p-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={!!profile.enabled_modules?.[key]}
                onChange={(e) => setModuleEnabled(key, e.target.checked)}
                disabled={saving}
              />
              <span className="capitalize">{key}</span>
            </label>

            {key === "glucose" && !!profile.enabled_modules?.glucose && (
              <div className="mt-3">
                <label className="text-sm">
                  Source{" "}
                  <select
                    className="ml-2 border rounded px-2 py-1"
                    value={profile.module_options?.glucose?.source || "manual"}
                    onChange={(e) =>
                      setModuleOption("glucose", { source: e.target.value })
                    }
                    disabled={saving}
                  >
                    <option value="manual">Manual</option>
                    <option value="cgm">CGM</option>
                  </select>
                </label>
              </div>
            )}
          </div>
        ))}
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
    </div>
  );
}
