import { supabase } from "@/lib/supabase";

// ✅ keep this as a function, don't run it at module scope
export async function getGlucoseTodSummary({ userId, days = 7 }) {
  const { data, error } = await supabase.rpc("glucose_high_episode_starts_by_hour", {
    p_user_id: userId,
    p_days: days,
  });
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

// ✅ optional convenience wrapper if you want the rows name
export async function loadTodRows(userId, days = 7) {
  return getGlucoseTodSummary({ userId, days });
}
