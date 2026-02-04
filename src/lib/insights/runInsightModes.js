// /lib/insights/runInsightModes.js
import { runPriorityMode } from "./priorityMode";
import { runRiskMode } from "./riskMode";

/**
 * Central runner for Insight Modes.
 * - Enforces gating BEFORE interpretation.
 * - Returns a consistent shape for the UI.
 *
 * @param {Object} params
 * @param {Array<Object>} params.signals - free-tier signals
 * @param {Object} params.user - user context (or feature flags)
 * @param {boolean} params.user.hasInsightAccess - paid access flag
 * @param {Object} [params.opts] - per-mode thresholds, etc.
 * @returns {{ priority: Object|null, risk: Object|null }|null}
 */
export function runInsightModes({ signals, user, opts = {} }) {
  // Gate BEFORE doing any analysis (no bleed-through, no accidental caching).
  if (!user || user.hasInsightAccess !== true) {
    return null;
  }

  // Run modes (each returns an Insight object or null).
  const priority = runPriorityMode(signals, opts.priority);
  const risk = runRiskMode(signals, opts.risk);

  // If both are null, return null (keeps UI logic simpler).
  if (!priority && !risk) return null;

  return { priority, risk };
}
