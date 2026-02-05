// src/pages/InsightsPage.jsx
import React from "react";
import InsightPanel from "@/components/insights/InsightPanel";
import { useAuth } from "@/hooks/useAuth.js";
import { useSignals } from "@/hooks/useSignals";
import { runInsightModes } from "@/lib/insights/runInsightModes.js";

export default function InsightsPage() {
  const { user, loading } = useAuth();
  const { signals, loading: signalsLoading } = useSignals(user);

  if (loading || signalsLoading) return <main>Loading…</main>;

  if (!user?.hasInsightAccess) {
    return (
      <main>
        <h1>Insights</h1>
        <p>Insight Modes are part of the paid tier.</p>
      </main>
    );
  }

  const insights = runInsightModes({
    signals: Array.isArray(signals) ? signals : [],
    user,
  });

  return (
    <main>
      <h1>Insights</h1>
      <InsightPanel insights={insights} />
    </main>
  );
}
