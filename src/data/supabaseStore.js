import { supabase } from "@/lib/supabase";

const TABLES = {
  glucose: "glucose_readings",
  sleep: "sleep_data",
  migraine: "migraine_episodes",
};

// ---- current user id (throws if not logged in) ----
async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const uid = data?.user?.id;
  if (!uid) throw new Error("Not signed in.");
  return uid;
}

// =================== GLUCOSE ===================
export const Glucose = {
  async create(payload) {
    const user_id = await getCurrentUserId();
    const row = {
      user_id,
      device_time: payload.device_time,
      value_mgdl: Number(payload.value_mgdl),
      trend: payload.trend ?? null,
      source: payload.source || "manual",
      note: payload.note ?? null,
      created_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from(TABLES.glucose).insert([row]).select().single();
    if (error) throw error;
    return data;
  },

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

  // NEW: fetch the newest reading’s timestamp (for “Latest pull”)
  async latest(user_id) {
    let q = supabase
      .from(TABLES.glucose)
      .select("device_time")
      .order("device_time", { ascending: false })
      .limit(1);
    if (user_id) q = q.eq("user_id", user_id);
    const { data, error } = await q;
    if (error) throw error;
    return data?.[0]?.device_time || null;
  },
};

// ==================== SLEEP ====================
export const SleepData = {
  async create(payload) {
    const user_id = await getCurrentUserId();
    const row = {
      user_id,
      start_time: payload.start_time ?? null,
      end_time: payload.end_time ?? null,
      efficiency: payload.efficiency ?? null,
      stages: payload.stages ?? null,
      note: payload.note ?? null,
      source: payload.source || "manual",
      date: payload.date ?? payload.start_time ?? new Date().toISOString(),
      created_at: payload.created_at ?? new Date().toISOString(),
      // if your table has duration_min, include it when writing:
      duration_min: payload.duration_min ?? null,
    };
    const { data, error } = await supabase.from(TABLES.sleep).insert([row]).select().single();
    if (error) throw error;
    return data;
  },

  /**
   * Summary over the last {days}.
   * It reads "*" (all columns) to be robust whether you have end_time or duration_min.
   * Returns { totalSleepMinutes, avgEfficiency, count }.
   */
  async summary(user_id, days = 7) {
    const since = new Date(Date.now() - days * 86400000).toISOString();

    // Use created_at (usually exists) to date-filter; fallback if needed.
    let q = supabase
      .from(TABLES.sleep)
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: true })
      .limit(5000);
    if (user_id) q = q.eq("user_id", user_id);

    const { data, error } = await q;
    if (error) throw error;

    let totalMin = 0;
    let effSum = 0;
    let effCount = 0;

    for (const r of data ?? []) {
      // Prefer duration_min if present; otherwise compute from start/end.
      if (typeof r.duration_min === "number") {
        totalMin += Math.max(0, r.duration_min);
      } else if (r.start_time && r.end_time) {
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
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (user_id) q = q.eq("user_id", user_id);
    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  },
};

// ================== MIGRAINE ==================
export const Migraine = {
  async create(payload) {
    const user_id = await getCurrentUserId();
    const row = {
      user_id,
      pain: Number(payload.pain ?? 0),
      symptoms: payload.symptoms ?? [],
      notes: payload.notes ?? null,
      created_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from(TABLES.migraine).insert([row]).select().single();
    if (error) throw error;
    return data;
  },

  async summary(user_id, days = 7) {
    const since = new Date(Date.now() - days * 86400000).toISOString();
    let q = supabase
      .from(TABLES.migraine)
      .select("symptoms,created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: true })
      .limit(5000);
    if (user_id) q = q.eq("user_id", user_id);

    const { data, error } = await q;
    if (error) throw error;

    let count = 0, withAura = 0, withNausea = 0;
    const norm = (sym) => {
      if (Array.isArray(sym)) return sym.map(s => String(s).toLowerCase().trim());
      if (typeof sym === "string") {
        try {
          const arr = JSON.parse(sym);
          if (Array.isArray(arr)) return arr.map(s => String(s).toLowerCase().trim());
        } catch {}
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

  // NEW: build the {name,value} array for the pie chart
  async symptomCounts(user_id, days = 30) {
    const since = new Date(Date.now() - days * 86400000).toISOString();
    let q = supabase
      .from(TABLES.migraine)
      .select("symptoms,created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: true })
      .limit(5000);
    if (user_id) q = q.eq("user_id", user_id);

    const { data, error } = await q;
    if (error) throw error;

    const counts = new Map();
    const norm = (sym) => {
      if (Array.isArray(sym)) return sym.map(s => String(s).toLowerCase().trim());
      if (typeof sym === "string") {
        try {
          const arr = JSON.parse(sym);
          if (Array.isArray(arr)) return arr.map(s => String(s).toLowerCase().trim());
        } catch {}
        return sym.split(",").map(s => s.toLowerCase().trim()).filter(Boolean);
      }
      return [];
    };

    for (const r of data ?? []) {
      for (const k of norm(r.symptoms)) {
        counts.set(k, (counts.get(k) || 0) + 1);
      }
    }
    return [...counts.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  },
};
