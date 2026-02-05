// src/lib/insights/priorityMode.js
import { PRIORITY_POSTURES } from "./insightContract";

/**
 * Priority Mode
 * Answers: "What matters most right now?"
 *
 * @param {Array<Object>} signals
 * @param {Object} [opts]
 * @param {string} [opts.activeModule] - optional module/category filter
 * @param {number} [opts.materialThreshold=3]
 * @returns {Object|null}
 */
export function runPriorityMode(signals, opts = {}) {
  const materialThreshold = Number.isFinite(opts.materialThreshold)
    ? opts.materialThreshold
    : 3;

  const activeModule =
    typeof opts.activeModule === "string" ? opts.activeModule : null;

  if (!Array.isArray(signals) || signals.length === 0) return null;

  // Start with all signals; optionally narrow to active module/category
  let candidates = signals;

  if (activeModule) {
    const moduleSignals = signals.filter((s) => s?.category === activeModule);
    if (moduleSignals.length > 0) candidates = moduleSignals;
  }

  const scored = candidates.map(toPriorityCandidate).filter(Boolean);

  // Choose the single highest-scoring candidate.
  scored.sort((a, b) => b.score - a.score);
  const top = scored[0];

  if (!top) return null;
  if (top.score < materialThreshold) return null;

  const posture = postureFromScore(top.score);
  if (!PRIORITY_POSTURES.includes(posture)) return null;

  return {
    mode: "priority",
    summary: top.summary,
    rationale: top.rationale,
    posture,
    confidence: top.confidence || "medium",
  };
}

function toPriorityCandidate(signal) {
  if (!signal || typeof signal !== "object") return null;

  const label =
    safeStr(signal.label) || safeStr(signal.title) || safeStr(signal.type);

  if (!label) return null;

  const severityScore = scoreSeverity(signal.severity);
  const deltaScore = scoreDelta(signal.delta);
  const actionableBoost = signal.actionable === true ? 1 : 0;

  const score = severityScore + deltaScore + actionableBoost;

  if (signal.informational === true && score < 5) return null;

  const summary = `Priority: ${label}.`;

  const rationaleParts = [];
  if (severityScore > 0) rationaleParts.push("elevated severity");
  if (deltaScore > 0) rationaleParts.push("meaningful deviation from baseline");
  if (actionableBoost > 0) rationaleParts.push("actionable signal");

  const rationale =
    rationaleParts.length > 0
      ? `This stands out due to ${rationaleParts.join(", ")}.`
      : "This stands out relative to other recent signals.";

  return { score, summary, rationale, confidence: confidenceFromScore(score) };
}

function postureFromScore(score) {
  if (score >= 7) return "act";
  if (score >= 5) return "prepare";
  if (score >= 3) return "monitor";
  return "ignore";
}

function confidenceFromScore(score) {
  if (score >= 7) return "high";
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
