// /lib/insights/priorityMode.js
import { PRIORITY_POSTURES } from "./insightContract";

/**
 * Priority Mode
 * Answers: "What matters most right now?"
 *
 * Returns:
 * - an Insight object (contract shape), OR
 * - null if there is no material priority.
 *
 * @param {Array<Object>} signals - Free-tier signals (raw, unsynthesized)
 * @param {Object} [opts]
 * @param {number} [opts.materialThreshold=3] - Minimum score to declare a priority
 * @returns {Object|null}
 */
export function runPriorityMode(signals, opts = {}) {
  const materialThreshold = Number.isFinite(opts.materialThreshold)
    ? opts.materialThreshold
    : 3;

  if (!Array.isArray(signals) || signals.length === 0) return null;

  // Convert raw signals to a comparable scored form.
  const scored = signals
    .map(toPriorityCandidate)
    .filter(Boolean);

  if (scored.length === 0) return null;

  // Choose the single highest-scoring candidate.
  scored.sort((a, b) => b.score - a.score);
  const top = scored[0];

  // Silence rule: if nothing is materially significant, return null.
  if (top.score < materialThreshold) return null;

  const posture = postureFromScore(top.score);

  // Guardrail: posture must be one of the allowed enums
  if (!PRIORITY_POSTURES.includes(posture)) return null;

  return {
    mode: "priority",
    summary: top.summary,
    rationale: top.rationale,
    posture,
    // optional: keep this bounded + non-numeric
    confidence: top.confidence || "medium",
  };
}

/**
 * Adapter: turns a raw signal into a Priority candidate.
 * This is intentionally conservative until your signal taxonomy is finalized.
 *
 * Expected (optional) fields on a signal:
 * - type: string
 * - label/title: string
 * - severity: "low" | "medium" | "high" (or numeric)
 * - delta: number (deviation from baseline, if available)
 * - actionable: boolean (if you already tag this)
 * - source: string
 */
function toPriorityCandidate(signal) {
  if (!signal || typeof signal !== "object") return null;

  // Basic sanity: if there's no description, we can't turn it into a priority.
  const label =
    safeStr(signal.label) ||
    safeStr(signal.title) ||
    safeStr(signal.type);

  if (!label) return null;

  // Compute a conservative score from whatever metadata is available.
  const severityScore = scoreSeverity(signal.severity);
  const deltaScore = scoreDelta(signal.delta);

  // If you have an explicit actionable flag, reward it slightly.
  const actionableBoost = signal.actionable === true ? 1 : 0;

  const score = severityScore + deltaScore + actionableBoost;

  // Disqualification rule: purely informational signals should not win.
  // If your data has a "kind" or "category", you can strengthen this later.
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

  return {
    score,
    summary,
    rationale,
    confidence: confidenceFromScore(score),
  };
}

function postureFromScore(score) {
  // Keep simple and bounded.
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
  // Accept either normalized strings or numeric input.
  if (typeof severity === "number" && Number.isFinite(severity)) {
    // Clamp loosely to 0..5
    return Math.max(0, Math.min(5, Math.round(severity)));
  }
  const s = safeStr(severity).toLowerCase();
  if (s === "high") return 4;
  if (s === "medium") return 2;
  if (s === "low") return 1;
  return 0;
}

function scoreDelta(delta) {
  // Delta is optional; treat modest deviations gently.
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
