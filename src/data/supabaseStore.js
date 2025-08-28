// src/data/supabaseStore.js
// Centralized, typed-ish helpers for your Supabase tables.
//
// Tables present in your project (per your list):
//   - glucose_readings
//   - sleep_data
//   - migraine_entries
//
// If you rename tables/columns later, update the constants/mappers here.

import supabase from "@/lib/supabase";

// ---- table names (change here if needed) ----
const TABLES = {
  glucose: "glucose_readings",
  sleep: "sleep_data",
  migraine: "migraine_entries",
};

// ---- utility: current user id (throws if not logged in) ----
async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const uid = data?.user?.id;
  if (!uid) throw new Error("Not signed in.");
  return uid;
}

// =============================================
// ===============  G L U C O S E  =============
// =============================================
export const Glucose = {
  /**
   * Create a glucose reading.
   * Expected payload shape from LogGlucose.jsx:
   * { device_time, value_mgdl, trend?, source, note? }
   */
  async create(payload) {
    const user_id = await getCurrentUserId();
    const row = {
      user_id,
      device_time: payload.device_time,         // datetime string
      value_mgdl: Number(payload.value_mgdl),  // numeric
      trend: payload.trend ?? null,            // text | null
      source: payload.source || "manual",      // text
      note: payload.note ?? null,              // text | null
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from(TABLES.glucose)
      .insert([row])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * List readings in the last {days}, capped by {limit}.
   * Used by Dashboard to build a timeseries & last value.
   */
  async listByDayRange(user_id, days = 7, limit = 500) {
    const since = new Date(Date.now() - days * 86400000).toISOString();

    let q = supabase
      .from(TABLES.glucose)
      .select("device_time,value_mgdl")
      .gte("device_time", since)
      .order("device_time", { ascending: true })
      .limit(limit);

    if (user_id) q = q.eq("user_id", user_id);

    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  },
};

// =============================================
// ================  S L E E P  ================
// =============================================
export const SleepData = {
  /**
   * Create a sleep record.
   * Expected payload shape from LogSleep.jsx:
   * {
   *   start_time, end_time, efficiency?, stages: { light, deep, rem, awake },
   *   note?, source
   * }
   */
  async create(payload) {
    const user_id = await getCurrentUserId();
    const row = {
      user_id,
      start_time: payload.start_time,                 // datetime string
      end_time: payload.end_time,                     // datetime string
      efficiency: payload.efficiency ?? null,         // number | null
      stages: payload.stages ?? null,                 // json | null
      note: payload.note ?? null,                     // text | null
      source: payload.source || "manual",             // text
      date: payload.date ?? payload.start_time ?? new Date().toISOString(),
      created_at: payload.created_at ?? new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from(TABLES.sleep)
      .insert([row])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Summary over the last {days}.
   * Returns { totalSleepMinutes, avgEfficiency, count }.
   */
  async summary(user_id, days = 7) {
    const since = new Date(Date.now() - days * 86400000).toISOString();

    let q = supabase
      .from(TABLES.sleep)
      .select("start_time,end_time,efficiency")
      .gte("start_time", since)
      .order("start_time", { ascending: true })
      .limit(5000);

    if (user_id) q = q.eq("user_id", user_id);

    const { data, error } = await q;
    if (error) throw error;

    let totalMin = 0;
    let effSum = 0;
    let effCount = 0;

    for (const r of data ?? []) {
      if (r.start_time && r.end_time) {
        const minutes = (new Date(r.end_time) - new Date(r.start_time)) / 60000;
        if (isFinite(minutes) && minutes > 0) totalMin += minutes;
      }
      if (r.efficiency != null) {
        const e = Number(r.efficiency);
        if (isFinite(e)) {
          effSum += e;
          effCount++;
        }
      }
    }

    return {
      totalSleepMinutes: Math.round(totalMin),
      avgEfficiency: effCount ? effSum / effCount : null,
      count: (data ?? []).length,
    };
  },

  async listByDayRange(user_id, days = 7, limit = 200) {
    const since = new Date(Date.now() - days * 86400000).toISOString();

    let q = supabase
      .from(TABLES.sleep)
      .select("*")
      .gte("start_time", since)
      .order("start_time", { ascending: false })
      .limit(limit);

    if (user_id) q = q.eq("user_id", user_id);

    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  },
};

// =============================================
// ==============  M I G R A I N E  ============
// =============================================
export const Migraine = {
  /**
   * Create a migraine entry.
   * Suggested payload shape (align with your UI):
   * { pain, symptoms: string[] | text, notes? }
   */
  async create(payload) {
    const user_id = await getCurrentUserId();
    const row = {
      user_id,
      pain: Number(payload.pain ?? 0),
      // store as JSON if the column is json/jsonb; if it's text, you can store a CSV.
      symptoms: payload.symptoms ?? [],
      notes: payload.notes ?? null,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from(TABLES.migraine)
      .insert([row])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Summary for last {days}.
   * Returns { count, withAura, withNausea } by scanning 'symptoms'.
   * Symptom parsing is defensive: supports array, JSON string, or CSV string.
   */
  async summary(user_id, days = 7) {
    const since = new Date(Date.now() - days * 86400000).toISOString();

    let q = supabase
      .from(TABLES.migraine)
      .select("symptoms, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: true })
      .limit(5000);

    if (user_id) q = q.eq("user_id", user_id);

    const { data, error } = await q;
    if (error) throw error;

    let count = 0;
    let withAura = 0;
    let withNausea = 0;

    const norm = (sym) => {
      // Accept: array ['aura','nausea'], JSON string '["aura"]', or CSV 'aura,nausea'
      if (Array.isArray(sym)) return sym.map(s => String(s).toLowerCase().trim());
      if (typeof sym === "string") {
        try {
          const arr = JSON.parse(sym);
          if (Array.isArray(arr)) return arr.map(s => String(s).toLowerCase().trim());
        } catch { /* not JSON */ }
        return sym.split(",").map(s => s.toLowerCase().trim()).filter(Boolean);
      }
      return [];
    };

    for (const r of data ?? []) {
      count++;
      const s = norm(r.symptoms);
      if (s.includes("aura")) withAura++;
      if (s.includes("nausea")) withNausea++;
    }

    return { count, withAura, withNausea };
  },
};
