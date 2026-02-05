// /components/insights/InsightCard.jsx

const MODE_LABELS = {
  priority: "Priority",
  risk: "Risk",
};

const POSTURE_LABELS = {
  monitor: "Keep an eye on this",
  prepare: "Plan a small adjustment",
  act: "Take action today",
  mitigate: "Reduce risk now",
  escalate: "Increase attention / get support",
};

function splitCombinedLabel(value) {
  // Handles "prioritymedium" / "riskmedium" / "priority_high" / etc.
  if (!value || typeof value !== "string") return { left: "", right: "" };

  const cleaned = value.replace(/[_\-\s]/g, "").toLowerCase();
  const match = cleaned.match(/^(priority|risk)(low|medium|high)$/);
  if (!match) return { left: "", right: "" };

  return { left: match[1], right: match[2] };
}

function formatLevel(level) {
  if (!level) return "";
  return level.charAt(0).toUpperCase() + level.slice(1);
}

export default function InsightCard({ insight }) {
  if (!insight) return null;

  const cleanedSummary = insight.summary
        ?.replace(/^Priority:\s*/i, "")
        ?.replace(/^Risk:\s*/i, "");

  // Mode label (Priority / Risk)
  const modeLabel = MODE_LABELS[insight.mode] || insight.mode;

  // Confidence label (human-friendly)
  // If you ever pass "prioritymedium" into confidence by accident, this will still behave nicely.
  const combined = splitCombinedLabel(insight.confidence);
  const confidenceText = combined.right ? formatLevel(combined.right) : formatLevel(insight.confidence);

  // Posture (human-friendly)
  const nextStep = POSTURE_LABELS[insight.posture] || insight.posture;

  return (
    <article className={`insight-card insight-${insight.mode}`} aria-label={`${modeLabel} insight`}>
      <header className="insight-header">
        <span className={`insight-badge badge-${insight.mode}`}>{modeLabel}</span>

        {confidenceText && (
          <span className="insight-level" aria-label="Confidence level">
            {" "}
            {confidenceText}
          </span>
        )}
      </header>

      {/* Summary becomes a real heading */}
      <h2 className="insight-title">{cleanedSummary}</h2>

      {/* Rationale becomes “Why it matters” */}
      {insight.rationale && (
        <p className="insight-rationale">
          <span className="insight-rationale-label">Why it matters:</span> {insight.rationale}
        </p>
      )}

      <footer className="insight-footer">
        <span className="insight-nextstep-label">Next step:</span>
        <span className={`insight-posture posture-${insight.posture}`}>{nextStep}</span>
      </footer>
    </article>
  );
}
