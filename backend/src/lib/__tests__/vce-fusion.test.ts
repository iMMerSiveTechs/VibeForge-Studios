import { describe, test, expect } from "bun:test";
import { Fusion } from "../vce-fusion";
import type { RouterDecision, FusionInput } from "../../types/vce";

const fusion = new Fusion();

function makeRouterDecision(overrides: Partial<RouterDecision> = {}): RouterDecision {
  return {
    intent: "build",
    complexity: 20,
    risk: 10,
    uncertainty: 5,
    mode: "single",
    roles: ["BUILDER", "CRITIC"],
    costControl: "baseline single-shot",
    scores: { complexity: 20, risk: 10, uncertainty: 5 },
    ...overrides,
  };
}

function makeFusionInput(overrides: Partial<FusionInput> = {}): FusionInput {
  return {
    turnId: "test-turn-1",
    routeDecision: makeRouterDecision(),
    taskResults: new Map([["BUILDER", "function hello() { return 'world'; }"]]),
    criticFindings: [],
    contradictionScore: 0,
    ...overrides,
  };
}

describe("Fusion", () => {
  describe("Single-role input", () => {
    test("single BUILDER output passes through", async () => {
      const input = makeFusionInput();
      const result = await fusion.fuse(input);

      // In single mode, mergeOutputs returns the BUILDER output directly
      expect(result.finalText).toContain("function hello()");
    });

    test("returns artifacts array", async () => {
      const input = makeFusionInput();
      const result = await fusion.fuse(input);
      expect(Array.isArray(result.artifacts)).toBe(true);
    });

    test("debateRoundPerformed is false for single mode", async () => {
      const input = makeFusionInput();
      const result = await fusion.fuse(input);
      expect(result.debateRoundPerformed).toBe(false);
    });
  });

  describe("Multi-role input", () => {
    test("multi-role outputs get merged with section headers", async () => {
      const taskResults = new Map<string, string>([
        ["BUILDER", "const app = new App();"],
        ["ARCHITECT", "Use microservices pattern"],
        ["CRITIC", "Consider error handling"],
      ]);
      const input = makeFusionInput({
        routeDecision: makeRouterDecision({ mode: "duo" }),
        taskResults,
      });
      const result = await fusion.fuse(input);

      expect(result.finalText).toContain("## Implementation");
      expect(result.finalText).toContain("const app = new App();");
      expect(result.finalText).toContain("## Architecture");
      expect(result.finalText).toContain("Use microservices pattern");
      expect(result.finalText).toContain("## Review");
      expect(result.finalText).toContain("Consider error handling");
    });

    test("non-standard roles get their own section", async () => {
      const taskResults = new Map<string, string>([
        ["BUILDER", "code here"],
        ["VISIONARY", "future vision content"],
      ]);
      const input = makeFusionInput({
        routeDecision: makeRouterDecision({ mode: "duo" }),
        taskResults,
      });
      const result = await fusion.fuse(input);

      expect(result.finalText).toContain("## VISIONARY");
      expect(result.finalText).toContain("future vision content");
    });
  });

  describe("Artifact extraction", () => {
    test("extracts code blocks as artifacts", async () => {
      const taskResults = new Map<string, string>([
        ["BUILDER", "Here is the code:\n```typescript\nconst x = 1;\n```\n"],
      ]);
      const input = makeFusionInput({
        routeDecision: makeRouterDecision({ mode: "single" }),
        taskResults,
      });
      const result = await fusion.fuse(input);

      expect(result.artifacts.length).toBeGreaterThanOrEqual(1);
      const codeArtifact = result.artifacts.find((a) => a.kind === "code");
      expect(codeArtifact).toBeDefined();
      expect(codeArtifact!.content).toContain("const x = 1;");
      expect(codeArtifact!.language).toBe("typescript");
    });

    test("extracts multiple code blocks", async () => {
      const taskResults = new Map<string, string>([
        [
          "BUILDER",
          "```ts\nconst a = 1;\n```\nsome text\n```js\nconst b = 2;\n```\n",
        ],
      ]);
      const input = makeFusionInput({
        routeDecision: makeRouterDecision({ mode: "single" }),
        taskResults,
      });
      const result = await fusion.fuse(input);
      expect(result.artifacts.filter((a) => a.kind === "code").length).toBe(2);
    });
  });

  describe("Empty input", () => {
    test("empty taskResults returns empty finalText", async () => {
      const input = makeFusionInput({
        taskResults: new Map(),
      });
      const result = await fusion.fuse(input);
      expect(result.finalText).toBe("");
    });

    test("empty taskResults returns empty artifacts", async () => {
      const input = makeFusionInput({
        taskResults: new Map(),
      });
      const result = await fusion.fuse(input);
      expect(result.artifacts).toEqual([]);
    });
  });

  describe("Debate round", () => {
    test("debate round triggered with fanout mode, 3+ results, contradiction > 0.7", async () => {
      const taskResults = new Map<string, string>([
        ["BUILDER", "approach A"],
        ["ARCHITECT", "approach B"],
        ["REASONER", "approach C"],
      ]);
      const input = makeFusionInput({
        routeDecision: makeRouterDecision({ mode: "fanout" }),
        taskResults,
        contradictionScore: 0.8,
      });
      const result = await fusion.fuse(input);
      expect(result.debateRoundPerformed).toBe(true);
    });

    test("no debate round when contradiction <= 0.7", async () => {
      const taskResults = new Map<string, string>([
        ["BUILDER", "approach A"],
        ["ARCHITECT", "approach B"],
        ["REASONER", "approach C"],
      ]);
      const input = makeFusionInput({
        routeDecision: makeRouterDecision({ mode: "fanout" }),
        taskResults,
        contradictionScore: 0.5,
      });
      const result = await fusion.fuse(input);
      expect(result.debateRoundPerformed).toBe(false);
    });

    test("no debate round when fewer than 3 results", async () => {
      const taskResults = new Map<string, string>([
        ["BUILDER", "approach A"],
        ["CRITIC", "approach B"],
      ]);
      const input = makeFusionInput({
        routeDecision: makeRouterDecision({ mode: "fanout" }),
        taskResults,
        contradictionScore: 0.9,
      });
      const result = await fusion.fuse(input);
      expect(result.debateRoundPerformed).toBe(false);
    });
  });

  describe("Compressed snapshot", () => {
    test("snapshot contains turnId", async () => {
      const input = makeFusionInput({ turnId: "snapshot-test-turn" });
      const result = await fusion.fuse(input);
      expect(result.compressedSnapshot.turnId).toBe("snapshot-test-turn");
    });

    test("snapshot summary truncates long output", async () => {
      const longText = "x".repeat(1000);
      const taskResults = new Map<string, string>([["BUILDER", longText]]);
      const input = makeFusionInput({
        routeDecision: makeRouterDecision({ mode: "single" }),
        taskResults,
      });
      const result = await fusion.fuse(input);
      expect(result.compressedSnapshot.summary.length).toBeLessThan(longText.length);
      expect(result.compressedSnapshot.summary).toContain("[truncated]");
    });
  });
});
