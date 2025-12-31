// src/lib/modules.js

export const MODULE_KEYS = [
  "glucose",
  "migraine",
  "sleep",
  "pain",
  "weather",
];

export const DEFAULT_MODULE_PROFILE = {
  enabled_modules: {
    glucose: false,
    migraine: true,
    sleep: true,
    pain: true,
    weather: true,
  },
  module_options: {
    glucose: {
      source: "manual",          // or "cgm"
      nightscoutSyncDefault: false,
    },
  },
  onboarding_complete: false,
};
