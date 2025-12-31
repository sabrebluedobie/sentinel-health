// src/hooks/useModuleProfile.js
import { useEffect, useMemo, useState } from "react";
import { DEFAULT_MODULE_PROFILE, MODULE_KEYS } from "@/lib/modules";
import { supabase } from "@/lib/supabase";
 // adjust if needed

const LS_KEY = "sentrya:moduleProfile:v1";

function isProfileValid(profile) {
  if (!profile || !profile.enabled_modules) return false;

  return MODULE_KEYS.every((key) =>
    Object.prototype.hasOwnProperty.call(profile.enabled_modules, key)
  );
}

export function useModuleProfile(user) {
  const [profile, setProfile] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_MODULE_PROFILE;
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_MODULE_PROFILE;
  });

  const [loading, setLoading] = useState(true);

  const onboardingRequired = useMemo(() => {
    return !profile?.onboarding_complete;
  }, [profile]);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadProfile() {
      setLoading(true);

      const { data, error } = await supabase
        .from("user_module_profile")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (error || !data || !isProfileValid(data)) {
        // missing or corrupted → force onboarding
        await supabase.from("user_module_profile").upsert({
          user_id: user.id,
          ...DEFAULT_MODULE_PROFILE,
        });

        setProfile(DEFAULT_MODULE_PROFILE);
        localStorage.setItem(LS_KEY, JSON.stringify(DEFAULT_MODULE_PROFILE));
      } else {
        setProfile(data);
        localStorage.setItem(LS_KEY, JSON.stringify(data));
      }

      setLoading(false);
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  async function persist(next) {
    setProfile(next);
    localStorage.setItem(LS_KEY, JSON.stringify(next));

    if (!user?.id) return;

    await supabase.from("user_module_profile").upsert({
      user_id: user.id,
      ...next,
      updated_at: new Date().toISOString(),
    });
  }

  async function setModuleEnabled(key, enabled) {
    const next = {
      ...profile,
      enabled_modules: {
        ...profile.enabled_modules,
        [key]: enabled,
      },
    };
    await persist(next);
  }

  async function setModuleOption(key, options) {
    const next = {
      ...profile,
      module_options: {
        ...profile.module_options,
        [key]: {
          ...(profile.module_options?.[key] || {}),
          ...options,
        },
      },
    };
    await persist(next);
  }

  async function markOnboardingComplete() {
    const next = {
      ...profile,
      onboarding_complete: true,
    };
    await persist(next);
  }

  return {
    profile,
    loading,
    onboardingRequired,
    setModuleEnabled,
    setModuleOption,
    markOnboardingComplete,
  };
}
