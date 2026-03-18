import { describe, test, expect } from "bun:test";
import { VCERouter } from "../vce-router";

const router = new VCERouter();

describe("VCERouter", () => {
  describe("Intent Detection", () => {
    test('"build me a todo app" → build intent', () => {
      const result = router.route("build me a todo app");
      expect(result.intent).toBe("build");
    });

    test('"debug this error" → debug intent', () => {
      const result = router.route("debug this error");
      expect(result.intent).toBe("debug");
    });

    test('"brainstorm ideas" → brainstorm intent', () => {
      const result = router.route("brainstorm ideas");
      expect(result.intent).toBe("brainstorm");
    });

    test('"architect a system" → architect intent', () => {
      const result = router.route("architect a system");
      expect(result.intent).toBe("architect");
    });

    test('"optimize performance" → optimize intent', () => {
      const result = router.route("optimize performance");
      expect(result.intent).toBe("optimize");
    });

    test('"plan the roadmap" → plan intent', () => {
      const result = router.route("plan the roadmap");
      expect(result.intent).toBe("plan");
    });

    test("unrecognized input → unknown intent", () => {
      const result = router.route("hello there");
      expect(result.intent).toBe("unknown");
    });

    test("intent detection is case-insensitive", () => {
      const result = router.route("BUILD me a feature");
      expect(result.intent).toBe("build");
    });
  });

  describe("Mode Selection", () => {
    test("simple request → single mode", () => {
      const result = router.route("create a hello world function");
      expect(result.mode).toBe("single");
    });

    test("complex request with high-complexity keywords → duo or fanout", () => {
      const result = router.route(
        "build a complex distributed database schema with migration and cache layer for a multi-agent system"
      );
      expect(["duo", "fanout"]).toContain(result.mode);
    });

    test("high-risk request → duo or fanout", () => {
      const result = router.route(
        "delete the production database and migrate security tokens for payment processing with critical auth changes"
      );
      expect(["duo", "fanout"]).toContain(result.mode);
    });

    test("uncertain request → duo or fanout", () => {
      const result = router.route(
        "maybe we should possibly consider what if we somehow explore alternatives? not sure which approach or vs the other?"
      );
      expect(["duo", "fanout"]).toContain(result.mode);
    });
  });

  describe("Role Selection", () => {
    test("build intent includes BUILDER", () => {
      const result = router.route("build a feature");
      expect(result.roles).toContain("BUILDER");
    });

    test("build intent includes CRITIC", () => {
      const result = router.route("build a feature");
      expect(result.roles).toContain("CRITIC");
    });

    test("architect intent includes ARCHITECT", () => {
      const result = router.route("design the system architecture");
      expect(result.roles).toContain("ARCHITECT");
    });

    test("architect intent includes REASONER", () => {
      const result = router.route("design the system architecture");
      expect(result.roles).toContain("REASONER");
    });

    test("debug intent includes BUILDER and CRITIC and REASONER", () => {
      const result = router.route("fix this bug");
      expect(result.roles).toContain("BUILDER");
      expect(result.roles).toContain("CRITIC");
      expect(result.roles).toContain("REASONER");
    });

    test("brainstorm intent includes VISIONARY", () => {
      const result = router.route("brainstorm ideas for the app");
      expect(result.roles).toContain("VISIONARY");
    });

    test("optimize intent includes ARCHITECT and CRITIC", () => {
      const result = router.route("optimize the database performance");
      expect(result.roles).toContain("ARCHITECT");
      expect(result.roles).toContain("CRITIC");
    });

    test("plan intent includes ARCHITECT and REASONER", () => {
      const result = router.route("plan the project milestones");
      expect(result.roles).toContain("ARCHITECT");
      expect(result.roles).toContain("REASONER");
    });

    test("fanout mode always includes REASONER", () => {
      // Force fanout with very high scores
      const result = router.route(
        "maybe possibly somehow delete the critical production security database with complex distributed multi-agent migration? not sure what if unclear?"
      );
      if (result.mode === "fanout") {
        expect(result.roles).toContain("REASONER");
      }
    });
  });

  describe("Scores", () => {
    test("all scores between 0 and 100", () => {
      const inputs = [
        "build a todo app",
        "debug this error",
        "complex distributed system with database migration",
        "hello there",
        "maybe possibly unclear what if?",
      ];
      for (const input of inputs) {
        const result = router.route(input);
        expect(result.scores.complexity).toBeGreaterThanOrEqual(0);
        expect(result.scores.complexity).toBeLessThanOrEqual(100);
        expect(result.scores.risk).toBeGreaterThanOrEqual(0);
        expect(result.scores.risk).toBeLessThanOrEqual(100);
        expect(result.scores.uncertainty).toBeGreaterThanOrEqual(0);
        expect(result.scores.uncertainty).toBeLessThanOrEqual(100);
      }
    });

    test("complexity score increases with complex keywords", () => {
      const simple = router.route("create a simple function");
      const complex = router.route(
        "build a distributed multi-agent system with database schema migration and cache"
      );
      expect(complex.scores.complexity).toBeGreaterThan(simple.scores.complexity);
    });

    test("risk score increases with risky keywords", () => {
      const safe = router.route("create a hello function");
      const risky = router.route("delete the production database with security tokens and payment data");
      expect(risky.scores.risk).toBeGreaterThan(safe.scores.risk);
    });

    test("uncertainty score increases with vague language", () => {
      const clear = router.route("build a login form");
      const vague = router.route("maybe possibly not sure what if we somehow explore alternatives?");
      expect(vague.scores.uncertainty).toBeGreaterThan(clear.scores.uncertainty);
    });
  });

  describe("RouterDecision Structure", () => {
    test("always returns a valid RouterDecision", () => {
      const result = router.route("build a todo app");

      // Check all required fields exist
      expect(result).toHaveProperty("intent");
      expect(result).toHaveProperty("complexity");
      expect(result).toHaveProperty("risk");
      expect(result).toHaveProperty("uncertainty");
      expect(result).toHaveProperty("mode");
      expect(result).toHaveProperty("roles");
      expect(result).toHaveProperty("costControl");
      expect(result).toHaveProperty("scores");

      // Check types
      expect(typeof result.intent).toBe("string");
      expect(typeof result.complexity).toBe("number");
      expect(typeof result.risk).toBe("number");
      expect(typeof result.uncertainty).toBe("number");
      expect(typeof result.mode).toBe("string");
      expect(Array.isArray(result.roles)).toBe(true);
      expect(typeof result.costControl).toBe("string");
      expect(typeof result.scores).toBe("object");
      expect(result.roles.length).toBeGreaterThan(0);
    });

    test("costControl string is non-empty", () => {
      const result = router.route("build something");
      expect(result.costControl.length).toBeGreaterThan(0);
    });

    test("scores object mirrors top-level complexity/risk/uncertainty", () => {
      const result = router.route("build a feature");
      expect(result.scores.complexity).toBe(result.complexity);
      expect(result.scores.risk).toBe(result.risk);
      expect(result.scores.uncertainty).toBe(result.uncertainty);
    });
  });
});
