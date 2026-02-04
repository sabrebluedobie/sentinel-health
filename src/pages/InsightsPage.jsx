import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import InsightPanel from "@/components/insights/InsightPanel";
import { runInsightModes } from "@/lib/insights/runInsightModes";
import { mapDailyMetricsToSignals } from "@/lib/insights/mapDailyMetricsToSignals";
import { getGlucoseTodSummary } from "@/lib/insights/getGlucoseTodSummary";
import { mapTodToSignals } from "@/lib/insights/mapTodToSignals";

export default function InsightsPage() {
  const { user, loading } = useAuth();
  const [signals, setSignals] = useState([]);

  useEffect(() => {
    // Don’t fetch until auth is resolved + we have a user id
    if (loading || !user?.id) return;

    let cancelled = false;

    async function load() {
      // base: daily metrics → signals
      const { data, error } = await supabase
        .from("daily_metrics")
        .select("*")
        .eq("user_id", user.id)
        .order("day", { ascending: false })
        .limit(14);

      if (cancelled) return;

      if (error) {
        console.error("daily_metrics load error:", error);
        setSignals([]);
        return;
      }

      const baseSignals = mapDailyMetricsToSignals(Array.isArray(data) ? data : []);

      // TOD: pull summary rows → signals
      let todSignals = [];
      try {
        const tz = user.timezone || "UTC";
        const todRows = await getGlucoseTodSummary({ userId: user.id, tz });
        todSignals = mapTodToSignals(Array.isArray(todRows) ? todRows : []);
      } catch (e) {
        console.error("TOD summary failed:", e);
      }

      setSignals([...baseSignals, ...todSignals]);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [loading, user?.id, user?.timezone]);

  // Render gates AFTER hooks
  if (loading) return <main>Loading…</main>;

  // Gate BEFORE computing insights (same intent as your existing gating) :contentReference[oaicite:2]{index=2}
  if (!user?.hasInsightAccess) {
    return (
      <main>
        <h1>Insights</h1>
        <p>Insight Modes are part of the paid tier.</p>
      </main>
    );
  }

  // If your InsightPanel expects “insights” (repo trend), compute it here :contentReference[oaicite:3]{index=3}
  const insights = runInsightModes({ signals, user });

  return (
    <main>
      <h1>Insights</h1>
      <InsightPanel insights={insights} user={user} />
    </main>
  );
}
