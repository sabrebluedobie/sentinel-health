// /pages/InsightsPage.jsx
import InsightPanel from "../components/insights/InsightPanel";
import { runInsightModes } from "../lib/insights/runInsightModes";
import { useAuth } from "../hooks/useAuth";
import { useSignals } from "../hooks/useSignals";


export default function insights() {
  const { user, loading } = useAuth();
  const signals = useSignals(user);

  // Don’t render anything until auth state is known
  if (loading) {
    return <main>Loading…</main>;
  }

  // Gate BEFORE computing insights
  if (!user?.hasInsightAccess) {
    return (
      <main>
        <h1>Insights</h1>
        <p>Insight Modes are part of the paid tier.</p>
      </main>
    );
  }

  const insights = runInsightModes({ signals: signals || [], user });

  return (
    <main>
      <h1>Insights</h1>
      <InsightPanel insights={insights} />
    </main>
  );
}
