// src/hooks/useModuleProfile.js
import { useEffect, useMemo, useState, useRef } from "react";
import { DEFAULT_MODULE_PROFILE, MODULE_KEYS } from "@/lib/modules";
import { supabase } from "@/lib/supabase";

const LS_KEY = "sentrya:moduleProfile:v1";
const PROFILE_UPDATED_EVENT = "sentrya:moduleProfileUpdated";


function isProfileValid(profile) {
  if (!profile || !profile.enabled_modules) return false;
  return MODULE_KEYS.every((key) =>
    profile.enabled_modules && key in profile.enabled_modules
    );

}

export function useModuleProfile(user) {
  const [profile, setProfile] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_MODULE_PROFILE;
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_MODULE_PROFILE;
  });

  const [loading, setLoading] = useState(true);
  const isSavingRef = useRef(false); // Track if we're currently saving to prevent reload

  const onboardingRequired = useMemo(() => {
    return !profile?.onboarding_complete;
  }, [profile]);

  // Keep multiple hook instances in sync (App.jsx + onboarding page, etc.)
  useEffect(() => {
    function handleProfileUpdated() {
      try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return;
        setProfile(JSON.parse(raw));
      } catch {
        // ignore
      }
    }

    window.addEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
    return () =>
      window.removeEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
  }, []);

  // Load from Supabase on login
  useEffect(() => {
    console.log('[useModuleProfile] loadProfile effect triggered, user?.id:', user?.id, 'isSaving:', isSavingRef.current);
    
    if (!user?.id) {
      console.log('[useModuleProfile] No user, setting loading=false');
      setLoading(false);
      return;
    }

    // Skip reload if we're currently saving
    if (isSavingRef.current) {
      console.log('[useModuleProfile] Skipping loadProfile because we are currently saving');
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadProfile() {
      console.log('[useModuleProfile] Starting loadProfile...');
      setLoading(true);

      const { data, error } = await supabase
        .from("user_module_profile")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      console.log('[useModuleProfile] Supabase response:', { data, error, cancelled });

      if (cancelled) return;

      if (error || !data || !isProfileValid(data)) {
        console.log('[useModuleProfile] Invalid/missing data, upserting default profile');
        // missing or corrupted → force onboarding
        await supabase.from("user_module_profile").upsert({
          user_id: user.id,
          ...DEFAULT_MODULE_PROFILE,
        });

        setProfile(DEFAULT_MODULE_PROFILE);
        localStorage.setItem(LS_KEY, JSON.stringify(DEFAULT_MODULE_PROFILE));
        window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
      } else {
        console.log('[useModuleProfile] Valid data found, setting profile:', data);
        setProfile(data);
        localStorage.setItem(LS_KEY, JSON.stringify(data));
        window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
      }

      setLoading(false);
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  async function persist(next) {
    console.log('[useModuleProfile] persist called:', { hasUser: !!user?.id, next });
    
    isSavingRef.current = true; // Mark that we're saving
    
    setProfile(next);
    localStorage.setItem(LS_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));

    if (!user?.id) {
      console.log('[useModuleProfile] No user.id, saved to localStorage only');
      isSavingRef.current = false;
      return; // Settings saved locally, just not to Supabase
    }

    console.log('[useModuleProfile] Saving to Supabase:', { user_id: user.id, next });
    
    try {
      const { data, error } = await supabase.from("user_module_profile").upsert({
        user_id: user.id,
        ...next,
        updated_at: new Date().toISOString(),
      }).select();

      if (error) {
        console.error('[useModuleProfile] Supabase upsert error:', error);
        isSavingRef.current = false;
        throw error;
      }
      console.log('[useModuleProfile] Supabase save successful, returned data:', data);
      
      // Verify the save by checking what was actually written
      if (data && data[0]) {
        console.log('[useModuleProfile] Verified saved enabled_modules:', data[0].enabled_modules);
      }
    } finally {
      isSavingRef.current = false; // Always clear the saving flag
    }
  }

  async function setOnboardingComplete(value) {
    const next = { ...profile, onboarding_complete: !!value };
    await persist(next);
    }

  async function setModuleEnabled(key, enabled) {
    const next = {
      ...profile,
      enabled_modules: {
        ...profile.enabled_modules,
        [key]: enabled,
      },
      onboarding_complete: true, // Mark onboarding as complete when modules are changed
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
      onboarding_complete: true, // Mark onboarding as complete when options are changed
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
    setOnboardingComplete,
  };
}

export default useModuleProfile;
