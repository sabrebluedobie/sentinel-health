// /components/insights/InsightPanel.jsx
import InsightCard from "./InsightCard";

export default function InsightPanel({ insights, isPro = true }) {
  if (!insights) return null;

  const { priority, risk } = insights;
  if (!priority && !risk) return null;

  return (
    <section className="insight-panel" aria-label="Insights">
      <header className="insight-panel-header">
        <div className="insight-panel-heading-row">
          <h2 className="insight-panel-title">Insights</h2>


          {isPro && (
            <span className="insight-access-pill" aria-label="Pro feature">
              Pro
            </span>
          )}
        </div>

        <p className="insight-panel-subtitle">
          A quick read on what stands out today.
        </p>
      </header>

      <div className="insight-panel-grid">
        {priority && <InsightCard insight={priority} />}
        {risk && <InsightCard insight={risk} />}
      </div>
    </section>
  );
}
