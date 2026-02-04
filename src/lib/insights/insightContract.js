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

  if (insight.mode === "priority") {
    return PRIORITY_POSTURES.includes(insight.posture);
  }

  if (insight.mode === "risk") {
    return RISK_POSTURES.includes(insight.posture);
  }

  return false;
}
