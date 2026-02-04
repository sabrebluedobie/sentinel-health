import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth.js";
import InsightPanel from "@/components/insights/InsightPanel";
import { runInsightModes } from "@/lib/insights/runInsightModes.js";
import { mapDailyMetricsToSignals } from "@/lib/insights/mapDailyMetricsToSignals";
export default function InsightsPage() {
  const { user, loading } = useAuth();

  const [signals, setSignals] = useState([]);

  // 1️⃣ Wait for auth
  if (loading) {
    return <main>Loading…</main>;
  }

  // 2️⃣ Gate access BEFORE any interpretation
  if (!user?.hasInsightAccess) {
    return (
      <main>
        <h1>Insights</h1>
        <p>Insight Modes are part of the paid tier.</p>
      </main>
    );
  }

  // 3️⃣ Load raw data → signals (side effect)
  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("daily_metrics")
        .select("*")
        .order("day", { ascending: false })
        .limit(14);

      if (error) {
        console.error(error);
        setSignals([]);
        return;
      }

      const baseSignals = mapDailyMetricsToSignals(data);

      // New: TOD episodes
      let todSignals = [];
      try {
        const todRows = await getGlucoseTodSummary({
          userId: user.id,
          tz: user.timezone,
        });
        todSignals = mapTodToSignals(todRows);
      } catch (e) {
        console.error("TOD summary failed:", e);
      }

      setSignals([...baseSignals, ...todSignals]);
    }

    load();
  }, []);

  return (
    <main>
      <h1>Insights</h1>
      <InsightPanel signals={signals} user={user} runInsightModes={runInsightModes} />
    </main>
  );
}