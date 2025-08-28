// ---- SleepData (uses table: sleep_data) ----
import supabase from "@/lib/supabase";

export const SleepData = {
  // Create a new sleep record (your LogSleep form already calls this)
  async create(payload) {
    const { data, error } = await supabase
      .from("sleep_data")
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Summary for last N days (used by Dashboard)
  async summary(user_id, days = 7) {
    const since = new Date(Date.now() - days * 86400000).toISOString();
    let q = supabase
      .from("sleep_data")
      .select("start_time,end_time,efficiency")
      .gte("start_time", since)
      .order("start_time", { ascending: true })
      .limit(5000);

    // If your table has a user_id column (recommended), keep this filter:
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

  // Optional: list recent rows (handy for a Sleep page later)
  async listByDayRange(user_id, days = 7, limit = 200) {
    const since = new Date(Date.now() - days * 86400000).toISOString();
    let q = supabase
      .from("sleep_data")
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
