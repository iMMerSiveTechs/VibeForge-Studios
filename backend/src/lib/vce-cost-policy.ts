/**
 * VibeForge Cognitive Engine - Cost Governance Policy
 * Budgets, token caps, and abort thresholds
 */

import type { Mode } from "../types/vce";

export interface CostPolicy {
  mode: Mode;
  maxInputTokens: number;
  maxOutputTokens: number;
  softCapUSD: number; // warning threshold
  hardCapUSD: number; // abort threshold
  keepaliveIntervalMs: number;
  maxTurnDurationMs: number;
}

/**
 * Default cost budgets per mode
 */
export const COST_POLICIES: Record<Mode, CostPolicy> = {
  single: {
    mode: "single",
    maxInputTokens: 4000,
    maxOutputTokens: 2000,
    softCapUSD: 0.02,
    hardCapUSD: 0.05,
    keepaliveIntervalMs: 15000,
    maxTurnDurationMs: 60000,
  },

  duo: {
    mode: "duo",
    maxInputTokens: 6000,
    maxOutputTokens: 3000,
    softCapUSD: 0.05,
    hardCapUSD: 0.10,
    keepaliveIntervalMs: 15000,
    maxTurnDurationMs: 90000,
  },

  fanout: {
    mode: "fanout",
    maxInputTokens: 12000,
    maxOutputTokens: 8000,
    softCapUSD: 0.15,
    hardCapUSD: 0.30,
    keepaliveIntervalMs: 15000,
    maxTurnDurationMs: 120000,
  },
};

/**
 * Cost tracking for a single turn
 */
export class CostTracker {
  private mode: Mode;
  private policy: CostPolicy;
  private inputTokensUsed: number = 0;
  private outputTokensUsed: number = 0;
  private estimatedCostUSD: number = 0;
  private startTime: number = Date.now();
  private aborted: boolean = false;

  constructor(mode: Mode) {
    this.mode = mode;
    this.policy = COST_POLICIES[mode];
  }

  /**
   * Add estimated tokens from a model call
   */
  addTokens(inputTokens: number, outputTokens: number, costUSD: number): boolean {
    // Check if we exceed hard cap
    if (this.estimatedCostUSD + costUSD > this.policy.hardCapUSD) {
      this.aborted = true;
      console.warn(
        `[CostTracker] Hard cap exceeded for ${this.mode} mode. Aborting.`
      );
      return false; // signal abort
    }

    // Warn if soft cap exceeded
    if (this.estimatedCostUSD + costUSD > this.policy.softCapUSD) {
      console.warn(
        `[CostTracker] Soft cap exceeded for ${this.mode} mode. Cost: $${(this.estimatedCostUSD + costUSD).toFixed(4)}`
      );
    }

    this.inputTokensUsed += inputTokens;
    this.outputTokensUsed += outputTokens;
    this.estimatedCostUSD += costUSD;

    return true;
  }

  /**
   * Check if we've exceeded time limit
   */
  isTimeExceeded(): boolean {
    const elapsed = Date.now() - this.startTime;
    return elapsed > this.policy.maxTurnDurationMs;
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      inputTokensUsed: this.inputTokensUsed,
      outputTokensUsed: this.outputTokensUsed,
      estimatedCostUSD: this.estimatedCostUSD,
      timeElapsedMs: Date.now() - this.startTime,
      aborted: this.aborted,
      withinBudget: !this.aborted && !this.isTimeExceeded(),
    };
  }

  /**
   * Mark as aborted
   */
  markAborted(): void {
    this.aborted = true;
  }

  /**
   * Check if aborted
   */
  isAborted(): boolean {
    return this.aborted;
  }
}

export default COST_POLICIES;
