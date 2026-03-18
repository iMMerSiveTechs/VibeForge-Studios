import { describe, test, expect } from "bun:test";
import { CostTracker, COST_POLICIES, getTierCostPolicy } from "../vce-cost-policy";

describe("CostTracker", () => {
  describe("Initialization", () => {
    test("initializes with single mode", () => {
      const tracker = new CostTracker("single");
      const metrics = tracker.getMetrics();
      expect(metrics.inputTokensUsed).toBe(0);
      expect(metrics.outputTokensUsed).toBe(0);
      expect(metrics.estimatedCostUSD).toBe(0);
      expect(metrics.aborted).toBe(false);
      expect(metrics.withinBudget).toBe(true);
    });

    test("initializes with duo mode", () => {
      const tracker = new CostTracker("duo");
      const metrics = tracker.getMetrics();
      expect(metrics.withinBudget).toBe(true);
      expect(metrics.aborted).toBe(false);
    });

    test("initializes with fanout mode", () => {
      const tracker = new CostTracker("fanout");
      const metrics = tracker.getMetrics();
      expect(metrics.withinBudget).toBe(true);
      expect(metrics.aborted).toBe(false);
    });
  });

  describe("addTokens", () => {
    test("accumulates tokens correctly", () => {
      const tracker = new CostTracker("single");
      tracker.addTokens(100, 50, 0.001);
      tracker.addTokens(200, 100, 0.002);

      const metrics = tracker.getMetrics();
      expect(metrics.inputTokensUsed).toBe(300);
      expect(metrics.outputTokensUsed).toBe(150);
      expect(metrics.estimatedCostUSD).toBeCloseTo(0.003, 6);
    });

    test("returns true when within budget", () => {
      const tracker = new CostTracker("single");
      const result = tracker.addTokens(100, 50, 0.001);
      expect(result).toBe(true);
    });

    test("returns false and aborts when hard cap exceeded", () => {
      const tracker = new CostTracker("single");
      // single hard cap is $0.05
      const result = tracker.addTokens(1000, 1000, 0.06);
      expect(result).toBe(false);
      expect(tracker.isAborted()).toBe(true);
    });

    test("does not accumulate tokens when hard cap exceeded", () => {
      const tracker = new CostTracker("single");
      tracker.addTokens(100, 50, 0.01);
      // This should fail - would push past $0.05
      tracker.addTokens(500, 500, 0.05);
      const metrics = tracker.getMetrics();
      // The second addTokens returned false, tokens should NOT be added
      expect(metrics.inputTokensUsed).toBe(100);
      expect(metrics.outputTokensUsed).toBe(50);
    });

    test("warns but continues when soft cap exceeded", () => {
      const tracker = new CostTracker("single");
      // single soft cap is $0.02, hard cap is $0.05
      const result = tracker.addTokens(500, 200, 0.03);
      expect(result).toBe(true);
      expect(tracker.isAborted()).toBe(false);
    });
  });

  describe("getMetrics", () => {
    test("returns correct metric values", () => {
      const tracker = new CostTracker("duo");
      tracker.addTokens(500, 250, 0.01);

      const metrics = tracker.getMetrics();
      expect(metrics.inputTokensUsed).toBe(500);
      expect(metrics.outputTokensUsed).toBe(250);
      expect(metrics.estimatedCostUSD).toBe(0.01);
      expect(typeof metrics.timeElapsedMs).toBe("number");
      expect(metrics.timeElapsedMs).toBeGreaterThanOrEqual(0);
      expect(metrics.aborted).toBe(false);
      expect(metrics.withinBudget).toBe(true);
    });

    test("withinBudget is false when aborted", () => {
      const tracker = new CostTracker("single");
      tracker.markAborted();
      const metrics = tracker.getMetrics();
      expect(metrics.withinBudget).toBe(false);
    });
  });

  describe("Budget Enforcement", () => {
    test("single mode hard cap is $0.05", () => {
      expect(COST_POLICIES.single.hardCapUSD).toBe(0.05);
    });

    test("duo mode hard cap is $0.10", () => {
      expect(COST_POLICIES.duo.hardCapUSD).toBe(0.10);
    });

    test("fanout mode hard cap is $0.30", () => {
      expect(COST_POLICIES.fanout.hardCapUSD).toBe(0.30);
    });

    test("single mode soft cap is $0.02", () => {
      expect(COST_POLICIES.single.softCapUSD).toBe(0.02);
    });

    test("markAborted sets aborted state", () => {
      const tracker = new CostTracker("single");
      expect(tracker.isAborted()).toBe(false);
      tracker.markAborted();
      expect(tracker.isAborted()).toBe(true);
    });

    test("isTimeExceeded returns false immediately after creation", () => {
      const tracker = new CostTracker("single");
      expect(tracker.isTimeExceeded()).toBe(false);
    });
  });

  describe("Tier Cost Policies", () => {
    test("FREE tier returns base policy values", () => {
      const policy = getTierCostPolicy("FREE", "single");
      expect(policy.maxInputTokens).toBe(COST_POLICIES.single.maxInputTokens);
      expect(policy.hardCapUSD).toBe(COST_POLICIES.single.hardCapUSD);
    });

    test("PRO tier multiplies tokens by 3", () => {
      const policy = getTierCostPolicy("PRO", "single");
      expect(policy.maxInputTokens).toBe(COST_POLICIES.single.maxInputTokens * 3);
      expect(policy.maxOutputTokens).toBe(COST_POLICIES.single.maxOutputTokens * 3);
    });

    test("PRO tier multiplies USD by 5", () => {
      const policy = getTierCostPolicy("PRO", "single");
      expect(policy.softCapUSD).toBe(COST_POLICIES.single.softCapUSD * 5);
      expect(policy.hardCapUSD).toBe(COST_POLICIES.single.hardCapUSD * 5);
    });

    test("ENTERPRISE tier has hardCap of 999", () => {
      const policy = getTierCostPolicy("ENTERPRISE", "single");
      expect(policy.hardCapUSD).toBe(999);
    });

    test("ENTERPRISE tier multiplies tokens by 10", () => {
      const policy = getTierCostPolicy("ENTERPRISE", "fanout");
      expect(policy.maxInputTokens).toBe(COST_POLICIES.fanout.maxInputTokens * 10);
    });
  });
});
