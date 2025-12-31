// src/pages/onboarding/Modules.jsx
import { useModuleProfile } from "@/hooks/useModuleProfile";
import { MODULE_KEYS } from "@/lib/modules";
import { useAuth } from "@/hooks/useAuth"; // whatever you’re using

export default function ModuleOnboarding() {
  const { user } = useAuth();
  const {
    profile,
    setModuleEnabled,
    setModuleOption,
    markOnboardingComplete,
  } = useModuleProfile(user);

  function handleFinish() {
    markOnboardingComplete();
    // redirect to dashboard
  }

  return (
    <div>
      <h1>Set up what you want to track</h1>

      {MODULE_KEYS.map((key) => (
        <div key={key}>
          <label>
            <input
              type="checkbox"
              checked={profile.enabled_modules[key]}
              onChange={(e) => setModuleEnabled(key, e.target.checked)}
            />
            {key}
          </label>

          {key === "glucose" && profile.enabled_modules.glucose && (
            <div>
              <label>
                Source:
                <select
                  value={profile.module_options.glucose?.source || "manual"}
                  onChange={(e) =>
                    setModuleOption("glucose", { source: e.target.value })
                  }
                >
                  <option value="manual">Manual</option>
                  <option value="cgm">CGM</option>
                </select>
              </label>
            </div>
          )}
        </div>
      ))}

      <button onClick={handleFinish}>Finish setup</button>
    </div>
  );
}
