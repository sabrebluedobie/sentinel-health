// src/pages/InsightsPage.jsx
import React, { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth.js";
import { useSignals } from "@/hooks/useSignals";
import { runInsightModes } from "@/lib/insights/runInsightModes.js";
import InsightsTabs from "@/components/insights/InsightsTabs";

export default function InsightsPage() {
  const { user, loading } = useAuth();
  const { signals, loading: signalsLoading } = useSignals(user);

  // ✅ Hook must be called every render, so keep this before conditional returns
  const insights = useMemo(() => {
    if (!user?.hasInsightAccess) return null;

    return runInsightModes({
      signals: Array.isArray(signals) ? signals : [],
      user,
    });
  }, [signals, user]);

  if (loading || signalsLoading) return <main>Loading…</main>;

  if (!user?.hasInsightAccess) {
    return (
      <main>
        <h1>Insight Mode</h1>
        <p>Insight Modes are part of the paid tier.</p>
      </main>
    );
  }

  // ✅ TEMP: stub element insights so tabs render
  const elementInsights = {
    migraines: null,
    glucose: null,
    sleep: null,
    pain: null,
  };

  return (
    <main>
      <h1>Insights</h1>
      <InsightsTabs elementInsights={elementInsights} />

      {/* Optional while transitioning: keep the old panel visible for comparison */}
      {/* <div className="mt-8">
        <InsightPanel insights={insights} />
      </div> */}
    </main>
  );
}
