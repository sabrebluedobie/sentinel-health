import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth.js";
import InsightPanel from "@/components/insights/InsightPanel";
import { runInsightModes } from "@/lib/insights/runInsightModes.js";
import { mapDailyMetricsToSignals } from "@/lib/insights/mapDailyMetricsToSignals";
import { getGlucoseTodSummary } from "@/lib/insights/getGlucoseTodSummary.js";
import { mapTodToSignals } from "@/lib/insights/mapTodToSignals.js";

export default function InsightsPage() {
  const { user, loading } = useAuth();
  const [signals, setSignals] = useState([]);

  if (loading) return <main>Loading…</main>;

  if (!user?.hasInsightAccess) {
    return (
      <main>
        <h1>Insights</h1>
        <p>Insight Modes are part of the paid tier.</p>
      </main>
    );
  }

  useEffect(() => {
    if (!user?.id) return;

    async function load() {
      const { data, error } = await supabase
        .from("daily_metrics")
        .select("*")
        .order("day", { ascending: false })
        .limit(14);

      if (error) {
        console.error("daily_metrics load failed:", error);
        setSignals([]);
        return;
      }

      const baseSignals = mapDailyMetricsToSignals(data);

      // TOD episodes (glucose)
      let todSignals = [];
      try {
        const todRows = await getGlucoseTodSummary({
          userId: user.id,
          tz: user.timezone, // make sure this is a real tz string
        });
        todSignals = mapTodToSignals(todRows);
      } catch (e) {
        console.error("TOD summary failed:", e);
      }

      setSignals([...baseSignals, ...todSignals]);
    }

    load();
  }, [user?.id, user?.timezone]);

  // ✅ interpret AFTER gating + after signals exist
  const insights = useMemo(() => {
    return runInsightModes({ signals, user });
  }, [signals, user]);

  return (
    <main>
      <h1>Insights</h1>
      <InsightPanel insights={insights} />
    </main>
  );
}
