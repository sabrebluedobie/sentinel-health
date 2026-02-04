// getGlucoseTodSummary.js
import { supabase } from "@/lib/supabase";

const todRows = await getGlucoseTodSummary({ userId: user.id, days: 7 });

export async function getGlucoseTodSummary({ userId, days = 7 }) {
  const { data, error } = await supabase.rpc("glucose_high_episode_starts_by_hour", {
    p_user_id: userId,
    p_days: days,
  });
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}
