// /components/insights/InsightCard.jsx
const MODE_LABELS = {
  priority: "Priority",
  risk: "Risk",
};

export default function InsightCard({ insight }) {
  if (!insight) return null;

  const modeLabel = MODE_LABELS[insight.mode] || insight.mode;

  return (
    <article className={`insight-card insight-${insight.mode}`} aria-label={`${modeLabel} insight`}>
      <header className="insight-header">
        <span className={`insight-badge badge-${insight.mode}`}>
          {modeLabel}
        </span>

        {insight.confidence && (
          <span className="insight-confidence">
            {insight.confidence}
          </span>
        )}
      </header>

      <div className="insight-summary">{insight.summary}</div>

      <div className="insight-rationale">{insight.rationale}</div>

      <footer className="insight-footer">
        <span className={`insight-posture posture-${insight.posture}`}>
          {insight.posture}
        </span>
      </footer>
    </article>
  );
}
