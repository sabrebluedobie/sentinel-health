import InsightCard from "./InsightCard";

export default function InsightPanel({ insights }) {
  if (!insights) return null;

  const { priority, risk } = insights;
  if (!priority && !risk) return null;

  const sameSummary =
    priority?.summary &&
    risk?.summary &&
    priority.summary.trim().toLowerCase() === risk.summary.trim().toLowerCase();

  const merged = sameSummary
    ? { ...priority, mergedRisk: risk?.confidence }
    : null;

  return (
    <section className="insight-panel" aria-label="Insights">
      <p className="insight-panel-subtitle">
        A quick read on what stands out today.
      </p>
    {insight.mergedRisk && (
      <div className="insight-meta">
          <span className="insight-meta-item">Risk:  {insight.mergedRisk}</span>
        </div>
      )}


      <div className="insight-panel-grid">
        {merged ? (
          <InsightCard insight={merged} />
        ) : (
          <>
            {priority && <InsightCard insight={priority} />}
            {risk && <InsightCard insight={risk} />}
          </>
        )}
      </div>
    </section>
  );
}
