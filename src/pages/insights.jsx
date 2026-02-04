import InsightPanel from "../components/insights/InsightPanel";
import { runInsightModes } from "../lib/insights/runInsightModes";
import { getUser } from "../lib/auth/getUser";
import { getSignals } from "../lib/signals/getSignals";

export async function getServerSideProps(ctx) {
  const user = await getUser(ctx);
  const signals = await getSignals({ user });

  return { props: { user, signals } };
}

export default function InsightsPage({ user, signals }) {
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
      <InsightPanel insights={insights} />
    </main>
  );
}
