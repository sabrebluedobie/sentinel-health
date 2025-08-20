// src/data/supabaseStore.js
import { supabase } from "@/lib/supabase";

/** Get current user id (throws if not signed in) */
async function getUid() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data?.user?.id) throw new Error("Not signed in");
  return data.user.id;
}

/** MIGRAINE EPISODES -> public.migraine_episodes */
export const Migraines = {
  async list(limit = 500) {
    const uid = await getUid();
    const { data, error } = await supabase
      .from("migraine_episodes")
      .select("*")
      .eq("user_id", uid)
      .order("date", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []).map(r => ({
      ...r,
      // normalize for your Dashboard helpers:
      date: r.date,                          // ISO string
      pain: r.pain,
      symptoms: r.symptoms || [],
      triggers: r.triggers || [],
      glucose_at_start: r.glucose_at_start ?? null,
    }));
  },

  async create(ep) {
    const uid = await getUid();
    const payload = {
      user_id: uid,
      date: new Date(ep.date).toISOString(),
      pain: Number(ep.pain),
      symptoms: ep.symptoms || [],
      triggers: ep.triggers || [],
      glucose_at_start: ep.glucose_at_start ?? null,
      note: ep.note || null,
    };
    const { data, error } = await supabase
      .from("migraine_episodes")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

/** GLUCOSE READINGS -> public.glucose_readings */
export const Glucose = {
  async list(limit = 1000) {
    const uid = await getUid();
    const { data, error } = await supabase
      .from("glucose_readings")
      .select("*")
      .eq("user_id", uid)
      .order("device_time", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []).map(r => ({
      ...r,
      device_time: r.device_time,            // ISO
      value_mgdl: Number(r.value_mgdl),
      trend: r.trend || null,
      source: r.source || "manual",
    }));
  },

  async create(row) {
    const uid = await getUid();
    const payload = {
      user_id: uid,
      device_time: new Date(row.device_time).toISOString(),
      value_mgdl: Number(row.value_mgdl),
      trend: row.trend || null,
      source: row.source || "manual",
      note: row.note || null,
    };
    const { data, error } = await supabase
      .from("glucose_readings")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

/** SLEEP -> public.sleep_data  (your table name) */
export const Sleep = {
  async list(limit = 365) {
    const uid = await getUid();
    const { data, error } = await supabase
      .from("sleep_data") // <— exact table name you said you have
      .select("*")
      .eq("user_id", uid)
      .order("start_time", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []).map(r => ({
      ...r,
      start_time: r.start_time,
      end_time: r.end_time,
      efficiency: r.efficiency ?? null,
      stages: r.stages || null,             // jsonb
    }));
  },

  async create(row) {
    const uid = await getUid();
    const payload = {
      user_id: uid,
      start_time: new Date(row.start_time).toISOString(),
      end_time: new Date(row.end_time).toISOString(),
      efficiency: row.efficiency != null ? Number(row.efficiency) : null,
      stages: row.stages || null,           // { light, deep, rem, awake }
      source: row.source || "manual",
      note: row.note || null,
    };
    const { data, error } = await supabase
      .from("sleep_data")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};