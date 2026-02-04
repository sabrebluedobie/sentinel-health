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

  // ✅ hooks must be called unconditionally, so useEffect goes here:
  useEffect(() => {
    if (loading || !user?.id || !user?.hasInsightAccess) return;

    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from("daily_metrics")
        .select("*")
        .eq("user_id", user.id)
        .order("day", { ascending: false })
        .limit(14);

      if (cancelled) return;

      if (error) {
        console.error("daily_metrics load failed:", error);
        setSignals([]);
        return;
      }

      const baseSignals = mapDailyMetricsToSignals(Array.isArray(data) ? data : []);

      let todSignals = [];
      try {
        const todRows = await getGlucoseTodSummary({
          userId: user.id,
          tz: user.timezone || "UTC",
        });
        todSignals = mapTodToSignals(Array.isArray(todRows) ? todRows : []);
      } catch (e) {
        console.error("TOD summary failed:", e);
      }

      setSignals([...baseSignals, ...todSignals]);
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, user?.id, user?.hasInsightAccess, user?.timezone]);

  // ✅ now do your early returns
  if (loading) return <main>Loading…</main>;

  if (!user?.hasInsightAccess) {
    return (
      <main>
        <h1>Insights</h1>
        <p>Insight Modes are part of the paid tier.</p>
      </main>
    );
  }

  const insights = runInsightModes({ signals, user });

  return (
    <main>
      <h1>Insights</h1>
      <InsightPanel insights={insights} user={user} />
    </main>
  );
}
