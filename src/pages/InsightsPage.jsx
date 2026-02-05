// src/pages/InsightsPage.jsx
import React, { useMemo } from "react";
import InsightPanel from "@/components/insights/InsightPanel";
import { useAuth } from "@/hooks/useAuth.js";
import { useSignals } from "@/hooks/useSignals";
import { runInsightModes } from "@/lib/insights/runInsightModes.js";

export default function InsightsPage() {
  const { user, loading } = useAuth();
  const { signals, loading: signalsLoading } = useSignals(user);

  // ✅ Hook must be called every render, so put it before any return
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

  return (
    <main>
      <h1>Insights</h1>
      <InsightPanel insights={insights} />
    </main>
  );
}
