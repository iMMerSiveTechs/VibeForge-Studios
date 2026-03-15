/**
 * VibeForge Cognitive Engine - Deterministic Router
 * Rule-based (non-LLM) routing: intent detection + complexity/risk/uncertainty scoring
 */

import type { Intent, Mode, Role, RouterDecision } from "../types/vce";

// ============ Keyword Databases ============
const INTENT_KEYWORDS = {
  build: [
    "write", "create", "implement", "code", "add", "build", "generate",
    "make", "function", "class", "component", "feature",
  ],
  architect: [
    "design", "architecture", "structure", "system", "flow", "schema",
    "database", "api", "interface", "dataflow", "model",
  ],
  debug: [
    "fix", "bug", "error", "issue", "broken", "not working", "fail",
    "crash", "why", "problem", "wrong", "incorrect",
  ],
  brainstorm: [
    "idea", "think", "explore", "what if", "brainstorm", "suggest",
    "options", "alternative", "approach", "consider",
  ],
  optimize: [
    "optimize", "faster", "performance", "improve", "slow", "refactor",
    "speed", "efficiency", "reduce", "simplify",
  ],
  plan: [
    "plan", "outline", "steps", "roadmap", "strategy", "schedule",
    "sequence", "phases", "milestones",
  ],
};

const COMPLEXITY_KEYWORDS = {
  high: [
    "multi-agent", "fanout", "parallel", "concurrent", "distributed",
    "database", "schema", "migration", "stateful", "cache", "async",
    "complex", "intricate", "architecture", "system design",
  ],
  medium: [
    "function", "class", "component", "logic", "flow", "error handling",
    "integration", "api", "request", "response",
  ],
};

const RISK_KEYWORDS = {
  high: [
    "security", "auth", "password", "token", "database", "production",
    "breaking", "delete", "migration", "critical", "payment", "financial",
  ],
  medium: [
    "user", "data", "state", "api", "integration", "change",
  ],
};

// ============ Router ============
export class VCERouter {
  /**
   * Detect intent from user request using keyword matching + heuristics
   */
  private detectIntent(text: string): Intent {
    const lower = text.toLowerCase();

    for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
      if (keywords.some((kw) => lower.includes(kw))) {
        return intent as Intent;
      }
    }

    return "unknown";
  }

  /**
   * Score complexity 0–100 based on keywords + heuristics
   */
  private scoreComplexity(text: string): number {
    const lower = text.toLowerCase();
    let score = 0;

    // High complexity keywords
    const highComplexity = COMPLEXITY_KEYWORDS.high.filter((kw) => lower.includes(kw)).length;
    score += highComplexity * 15;

    // Code block size (rough estimate from backticks)
    const codeBlocks = (text.match(/```/g) || []).length / 2;
    score += Math.min(codeBlocks * 20, 30);

    // Request length (longer = more complex)
    score += Math.min(text.length / 100, 20);

    // Keywords indicating low complexity
    if (lower.includes("simple") || lower.includes("trivial")) score -= 20;

    return Math.max(0, Math.min(score, 100));
  }

  /**
   * Score risk 0–100 based on keywords + context
   */
  private scoreRisk(text: string): number {
    const lower = text.toLowerCase();
    let score = 0;

    // High-risk keywords
    const highRisk = RISK_KEYWORDS.high.filter((kw) => lower.includes(kw)).length;
    score += highRisk * 25;

    // Medium-risk keywords
    const mediumRisk = RISK_KEYWORDS.medium.filter((kw) => lower.includes(kw)).length;
    score += mediumRisk * 10;

    // Production mention
    if (lower.includes("production")) score += 15;

    // Delete/destructive action
    if (lower.includes("delete") || lower.includes("remove") || lower.includes("drop")) {
      score += 20;
    }

    return Math.max(0, Math.min(score, 100));
  }

  /**
   * Score uncertainty 0–100 based on vague language + edge cases
   */
  private scoreUncertainty(text: string): number {
    const lower = text.toLowerCase();
    let score = 0;

    // Vague language
    const vagueWords = ["maybe", "might", "unclear", "not sure", "what if", "possibly", "somehow"];
    const vagueCount = vagueWords.filter((w) => lower.includes(w)).length;
    score += vagueCount * 15;

    // Questions (indicate uncertainty)
    const questionCount = (text.match(/\?/g) || []).length;
    score += Math.min(questionCount * 10, 30);

    // Contradictions (if/else in request)
    if (lower.includes(" or ") || lower.includes(" vs ")) score += 20;

    // Edge cases mentioned
    if (lower.includes("edge case") || lower.includes("corner case")) score += 15;

    return Math.max(0, Math.min(score, 100));
  }

  /**
   * Select mode based on max score
   */
  private selectMode(maxScore: number): Mode {
    if (maxScore < 35) return "single";
    if (maxScore < 70) return "duo";
    return "fanout";
  }

  /**
   * Select roles based on intent + mode + scores
   */
  private selectRoles(intent: Intent, mode: Mode, scores: { complexity: number; risk: number; uncertainty: number }): Role[] {
    const roles: Set<Role> = new Set();

    // Always include based on intent
    switch (intent) {
      case "build":
        roles.add("BUILDER");
        roles.add("CRITIC");
        if (scores.complexity > 60) roles.add("ARCHITECT");
        if (scores.uncertainty > 50) roles.add("REASONER");
        break;

      case "architect":
        roles.add("ARCHITECT");
        roles.add("CRITIC");
        roles.add("REASONER");
        break;

      case "debug":
        roles.add("BUILDER");
        roles.add("CRITIC");
        roles.add("REASONER");
        break;

      case "brainstorm":
        roles.add("VISIONARY");
        roles.add("CRITIC");
        if (scores.uncertainty > 50) roles.add("REASONER");
        break;

      case "optimize":
        roles.add("ARCHITECT");
        roles.add("CRITIC");
        if (scores.complexity > 50) roles.add("BUILDER");
        break;

      case "plan":
        roles.add("ARCHITECT");
        roles.add("REASONER");
        roles.add("CRITIC");
        break;

      default:
        roles.add("BUILDER");
        roles.add("CRITIC");
        break;
    }

    // Fanout mode: always add REASONER for reconciliation
    if (mode === "fanout" && !roles.has("REASONER")) {
      roles.add("REASONER");
    }

    return Array.from(roles);
  }

  /**
   * Main router function
   */
  route(userRequest: string): RouterDecision {
    const intent = this.detectIntent(userRequest);
    const complexity = this.scoreComplexity(userRequest);
    const risk = this.scoreRisk(userRequest);
    const uncertainty = this.scoreUncertainty(userRequest);
    const maxScore = Math.max(complexity, risk, uncertainty);
    const mode = this.selectMode(maxScore);
    const roles = this.selectRoles(intent, mode, { complexity, risk, uncertainty });

    // Cost control logic
    let costControl = "baseline single-shot";
    if (mode === "duo") costControl = "duo mode: parallel Critic for quality gate";
    if (mode === "fanout") costControl = "fanout mode: will trigger debate round only if contradiction > 0.7";
    if (uncertainty > 60) costControl += "; escalated due to high uncertainty";

    return {
      intent,
      complexity,
      risk,
      uncertainty,
      mode,
      roles,
      costControl,
      scores: { complexity, risk, uncertainty },
    };
  }
}

export default VCERouter;
