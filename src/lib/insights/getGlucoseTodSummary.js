import { supabase } from "@/lib/supabase";

export async function getGlucoseTodSummary({ userId, tz = "America/New_York", days = 14 }) {
  const { data, error } = await supabase.rpc("glucose_high_episode_starts_by_tod", {
    p_user_id: userId,
    p_tz: tz,
    p_days: days,
  });

  if (error) throw error;
  return data ?? [];
}
