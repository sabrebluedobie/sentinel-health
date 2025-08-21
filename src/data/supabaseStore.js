// src/data/supabaseStore.js
import { supabase } from "@/lib/supabase";

/** Get current auth user id (throws if not signed in) */
async function getUid() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const uid = data?.user?.id;
  if (!uid) throw new Error("Not signed in");
  return uid;
}

/** Helper: local timezone offset in minutes (east of UTC = +, west = -)
 * JS getTimezoneOffset() returns minutes *behind* UTC (e.g., Chicago = 300).
 * We flip the sign so + offset = east of UTC, - offset = west of UTC.
 */
function localTzOffsetMinutes() {
  return -new Date().getTimezoneOffset();
}

/* -------------------- MIGRAINES (public.migraine_episodes) -------------------- */
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
    return data || [];
  },

  async create(ep) {
    const uid = await getUid();
    const payload = {
      user_id: uid,
      // store event time in UTC as ISO
      date: new Date(ep.date).toISOString(),
      pain: Number(ep.pain),
      symptoms: ep.symptoms || [],
      triggers: ep.triggers || [],
      glucose_at_start: ep.glucose_at_start ?? null,
      note: ep.note || null,
      // store local offset so you can render *exact* local time later
      timezone_offset_min: localTzOffsetMinutes(), // <-- new column (see SQL below)
      // created_at comes from DB default (UTC)
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

/* -------------------- GLUCOSE (public.glucose_readings) -------------------- */
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
    return data || [];
  },

  async create(row) {
    const uid = await getUid();
    const payload = {
      user_id: uid,
      device_time: new Date(row.device_time).toISOString(), // UTC ISO from client input
      value_mgdl: row.value_mgdl != null ? Number(row.value_mgdl) : null,
      trend: row.trend || null,
      source: row.source || "manual",
      note: row.note || null,
      reading_type: row.reading_type || null,
      timezone_offset_min: localTzOffsetMinutes(), // <-- new column (see SQL below)
      // created_at from DB default (UTC)
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

/* -------------------- SLEEP (public.sleep_data) -------------------- */
export const Sleep = {
  async list(limit = 365) {
    const uid = await getUid();
    const { data, error } = await supabase
      .from("sleep_data")
      .select("*")
      .eq("user_id", uid)
      .order("start_time", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },

  async create(row) {
    const uid = await getUid();
    const payload = {
      user_id: uid,
      start_time: new Date(row.start_time).toISOString(), // UTC ISO
      end_time: new Date(row.end_time).toISOString(),     // UTC ISO
      efficiency: row.efficiency != null ? Number(row.efficiency) : null,
      stages: row.stages || null,   // { light, deep, rem, awake } or null
      source: row.source || "manual",
      note: row.note || null,
      timezone_offset_min: localTzOffsetMinutes(), // <-- new column (see SQL below)
      // created_at from DB default (UTC)
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