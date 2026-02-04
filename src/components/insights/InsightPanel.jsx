// /components/insights/InsightPanel.jsx
import InsightCard from "./InsightCard";

export default function InsightPanel({ insights }) {
  // insights is expected to be either:
  // - null (free user OR nothing material), or
  // - { priority: Insight|null, risk: Insight|null }
  if (!insights) return null;

  const { priority, risk } = insights;

  // If both are empty, render nothing.
  if (!priority && !risk) return null;

  return (
    <section className="insight-panel" aria-label="Insights">
      <div className="insight-panel-header">
        <h3 className="insight-panel-title">Insights</h3>
        <p className="insight-panel-subtitle">
          Interpreted signals (paid).
        </p>
      </div>

      <div className="insight-panel-grid">
        {priority && <InsightCard insight={priority} />}
        {risk && <InsightCard insight={risk} />}
      </div>
    </section>
  );
}
