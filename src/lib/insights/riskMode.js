// /lib/insights/riskMode.js
import { RISK_POSTURES } from "./insightContract";

/**
 * Risk Mode
 * Answers: "What could go wrong if ignored?"
 *
 * Returns:
 * - an Insight object (contract shape), OR
 * - null if no material risk is detected.
 *
 * @param {Array<Object>} signals - Free-tier signals (raw, unsynthesized)
 * @param {Object} [opts]
 * @param {number} [opts.materialThreshold=3] - Minimum score to declare a risk
 * @returns {Object|null}
 */
export function runRiskMode(signals, opts = {}) {
  const materialThreshold = Number.isFinite(opts.materialThreshold)
    ? opts.materialThreshold
    : 3;

  if (!Array.isArray(signals) || signals.length === 0) return null;

  const scored = signals
    .map(toRiskCandidate)
    .filter(Boolean);

  if (scored.length === 0) return null;

  // Choose the single highest-risk candidate.
  scored.sort((a, b) => b.score - a.score);
  const top = scored[0];

  // Silence rule: no material risk -> return null.
  if (top.score < materialThreshold) return null;

  const posture = postureFromScore(top.score);

  if (!RISK_POSTURES.includes(posture)) return null;

  return {
    mode: "risk",
    summary: top.summary,
    rationale: top.rationale,
    posture,
    confidence: top.confidence || "medium",
  };
}

/**
 * Adapter: converts a raw signal into a Risk candidate.
 *
 * Risk Mode leans on:
 * - severity (impact if it escalates)
 * - escalation likelihood (if provided)
 * - irreversibility / time sensitivity (if provided)
 * - deviation from baseline (delta)
 *
 * Expected (optional) fields on a signal:
 * - type / label / title
 * - severity: "low" | "medium" | "high" (or numeric)
 * - delta: number
 * - escalation: "low" | "medium" | "high" (or numeric)
 * - timeSensitive: boolean
 * - irreversible: boolean
 * - resolved: boolean
 */
function toRiskCandidate(signal) {
  if (!signal || typeof signal !== "object") return null;
  if (signal.resolved === true) return null; // disqualify resolved items

  const label =
    safeStr(signal.label) ||
    safeStr(signal.title) ||
    safeStr(signal.type);

  if (!label) return null;

  const severityScore = scoreSeverity(signal.severity);
  const escalationScore = scoreEscalation(signal.escalation);
  const deltaScore = scoreDelta(signal.delta);

  const timeSensitiveBoost = signal.timeSensitive === true ? 1 : 0;
  const irreversibleBoost = signal.irreversible === true ? 1 : 0;

  // Conservative, bounded scoring: avoid panic inflation.
  const score =
    severityScore +
    escalationScore +
    deltaScore +
    timeSensitiveBoost +
    irreversibleBoost;

  // Disqualification: if it's explicitly informational and low signal strength, ignore.
  if (signal.informational === true && score < 5) return null;

  const summary = `Risk: ${label}.`;

  const rationaleParts = [];
  if (severityScore > 0) rationaleParts.push("potential impact is meaningful");
  if (escalationScore > 0) rationaleParts.push("signs suggest possible escalation");
  if (deltaScore > 0) rationaleParts.push("deviation from baseline is notable");
  if (timeSensitiveBoost > 0) rationaleParts.push("timing may matter");
  if (irreversibleBoost > 0) rationaleParts.push("recovery may be harder if delayed");

  const rationale =
    rationaleParts.length > 0
      ? `This may carry risk because ${rationaleParts.join(", ")}.`
      : "This may carry risk relative to normal signal behavior.";

  return {
    score,
    summary,
    rationale,
    confidence: confidenceFromScore(score),
  };
}

function postureFromScore(score) {
  // Keep posture mapping simple and stable.
  if (score >= 8) return "escalate";
  if (score >= 6) return "mitigate";
  if (score >= 3) return "prepare";
  return "monitor";
}

function confidenceFromScore(score) {
  if (score >= 8) return "high";
  if (score >= 4) return "medium";
  return "low";
}

function scoreSeverity(severity) {
  if (typeof severity === "number" && Number.isFinite(severity)) {
    return Math.max(0, Math.min(5, Math.round(severity)));
  }
  const s = safeStr(severity).toLowerCase();
  if (s === "high") return 4;
  if (s === "medium") return 2;
  if (s === "low") return 1;
  return 0;
}

function scoreEscalation(escalation) {
  if (typeof escalation === "number" && Number.isFinite(escalation)) {
    return Math.max(0, Math.min(3, Math.round(escalation)));
  }
  const s = safeStr(escalation).toLowerCase();
  if (s === "high") return 3;
  if (s === "medium") return 2;
  if (s === "low") return 1;
  return 0;
}

function scoreDelta(delta) {
  if (typeof delta !== "number" || !Number.isFinite(delta)) return 0;
  const abs = Math.abs(delta);
  if (abs >= 3) return 3;
  if (abs >= 2) return 2;
  if (abs >= 1) return 1;
  return 0;
}

function safeStr(v) {
  return typeof v === "string" ? v.trim() : "";
}
