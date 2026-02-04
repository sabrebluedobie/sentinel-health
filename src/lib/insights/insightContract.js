// src/lib/insights/insightContract.js

export const PRIORITY_POSTURES = ["ignore", "monitor", "prepare", "act"];
export const RISK_POSTURES = ["monitor", "prepare", "mitigate", "escalate"];

export const CONFIDENCE_LEVELS = ["low", "medium", "high"];

export function isValidInsight(insight) {
  if (
    !insight ||
    typeof insight.mode !== "string" ||
    typeof insight.summary !== "string" ||
    typeof insight.rationale !== "string" ||
    typeof insight.posture !== "string"
  ) {
    return false;
  }

  if (insight.confidence && !CONFIDENCE_LEVELS.includes(insight.confidence)) {
    return false;
  }

  if (insight.mode === "priority") {
    return PRIORITY_POSTURES.includes(insight.posture);
  }

  if (insight.mode === "risk") {
    return RISK_POSTURES.includes(insight.posture);
  }

  return false;
}
