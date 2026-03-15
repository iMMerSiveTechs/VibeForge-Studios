/**
 * VibeForge Cognitive Engine - Boundary Types
 *
 * These are the ONLY types the UI layer knows about.
 * No provider-specific types leak beyond this boundary.
 */

export type EnginePhase =
  | "idle"
  | "routing"
  | "thinking"
  | "streaming"
  | "fusing"
  | "done"
  | "interrupted"
  | "error";

export type EngineMode = "single" | "duo" | "fanout";

export type EngineIntent =
  | "brainstorm"
  | "architect"
  | "build"
  | "debug"
  | "optimize"
  | "plan"
  | "unknown";

export type EngineRole =
  | "BUILDER"
  | "ARCHITECT"
  | "CRITIC"
  | "REASONER"
  | "VISIONARY";

export interface RouteDecision {
  turnId: string;
  intent: EngineIntent;
  mode: EngineMode;
  roles: EngineRole[];
  scores: { complexity: number; risk: number; uncertainty: number };
  costControl: string;
}

export interface EngineDelta {
  role: EngineRole;
  delta: string;
}

export interface EngineMetrics {
  inputTokensUsed: number;
  outputTokensUsed: number;
  estimatedCostUSD: number;
  durationMs: number;
}

export interface EngineFinal {
  turnId: string;
  finalText: string;
  artifacts: Array<{
    id: string;
    kind: string;
    path: string;
    content: string;
  }>;
  roles: string[];
  mode: string;
  intent: string;
  metrics: EngineMetrics;
}

export interface EngineError {
  message: string;
  code?: string;
  role?: string;
}

/** Callbacks the UI provides to the engine */
export interface EngineCallbacks {
  onRoute: (decision: RouteDecision) => void;
  onPhase: (phase: EnginePhase, activeRole?: string) => void;
  onDelta: (delta: EngineDelta) => void;
  onFinal: (result: EngineFinal) => void;
  onError: (error: EngineError) => void;
}

/** Options passed to the engine for model selection */
export interface EngineOptions {
  preset?: "FAST" | "SMART" | "DEEP";
  overrides?: {
    builder?: string;
    critic?: string;
    reasoner?: string;
  };
}

/** The engine adapter interface -- MockEngine and RemoteEngine both implement this */
export interface EngineAdapter {
  generate(message: string, callbacks: EngineCallbacks, options?: EngineOptions): Promise<void>;
  interrupt(turnId: string): Promise<void>;
}
