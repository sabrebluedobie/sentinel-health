import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth.js";
import InsightPanel from "@/components/insights/InsightPanel";
import { runInsightModes } from "@/insights/runInsightModes.js";
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

      setSignals(mapDailyMetricsToSignals(data));
    }

    load();
  }, []);

  // 4️⃣ 🔑 RUN INSIGHT MODES HERE (pure computation)
  const insights = runInsightModes({ signals, user });

  // 5️⃣ Render
  return (
    <main>
      <h1>Insights</h1>
      <InsightPanel insights={insights} />
    </main>
  );
}
