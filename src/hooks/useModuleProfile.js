import React from "react";
import { useNavigate } from "react-router-dom";
import { useModuleProfile } from "@/hooks/useModuleProfile";
import { MODULE_KEYS } from "@/lib/modules";
import useAuth from "@/hooks/useAuth";

export default function ModuleOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { profile, loading, setModuleEnabled, setModuleOption, markOnboardingComplete } =
    useModuleProfile(user);

  const [saving, setSaving] = React.useState(false);

  async function handleFinish() {
    setSaving(true);
    try {
      await markOnboardingComplete();
      navigate("/", { replace: true });
    } finally {
      setSaving(false);
    }
  }

  if (loading || !profile) return <div className="p-6">Loading…</div>;

  return (
    <div>
      <h1>Set up what you want to track</h1>

      {MODULE_KEYS.map((key) => (
        <div key={key}>
          <label>
            <input
              type="checkbox"
              checked={!!profile.enabled_modules?.[key]}
              onChange={(e) => setModuleEnabled(key, e.target.checked)}
              disabled={saving}
            />
            {key}
          </label>

          {key === "glucose" && !!profile.enabled_modules?.glucose && (
            <div>
              <label>
                Source:
                <select
                  value={profile.module_options?.glucose?.source || "manual"}
                  onChange={(e) => setModuleOption("glucose", { source: e.target.value })}
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

      <button onClick={handleFinish} disabled={saving}>
        {saving ? "Saving…" : "Finish setup"}
      </button>
    </div>
  );
}
