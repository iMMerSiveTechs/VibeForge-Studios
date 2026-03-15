/**
 * VibeForge Cognitive Engine - Phase 1 Types
 * Shared types for router, tasks, streaming, fusion
 */

// ============ Intent & Mode ============
export type Intent = "brainstorm" | "architect" | "build" | "debug" | "optimize" | "plan" | "unknown";
export type Mode = "single" | "duo" | "fanout";
export type Role = "BUILDER" | "ARCHITECT" | "CRITIC" | "REASONER" | "VISIONARY" | "COMPRESSOR" | "ORCHESTRATOR";
export type Priority = "HIGH" | "MED" | "LOW";
export type Severity = "P0" | "P1" | "P2";

// ============ Router Output ============
export interface RouterDecision {
  intent: Intent;
  complexity: number; // 0–100
  risk: number; // 0–100
  uncertainty: number; // 0–100
  mode: Mode;
  roles: Role[];
  costControl: string; // what was done to minimize spend
  scores: {
    complexity: number;
    risk: number;
    uncertainty: number;
  };
}

// ============ Task ============
export interface Task {
  id: string;
  turnId: string;
  role: Role;
  priority: Priority;
  status: "pending" | "running" | "streaming" | "done" | "error" | "cancelled";
  abortController: AbortController;
  streamBuffer: string[];
  result: string | null;
  error: string | null;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

// ============ Streaming ============
export interface TextChunk {
  taskId: string;
  role: Role;
  delta: string;
}

export interface StreamingEvent {
  type: "route" | "delta" | "status" | "fusion" | "final" | "error";
  data: unknown;
  timestamp: number;
}

// ============ Fusion ============
export interface CriticFinding {
  severity: Severity;
  issue: string;
  affectedRole: Role;
  patchSuggestion?: string;
}

export interface FusionInput {
  turnId: string;
  routeDecision: RouterDecision;
  taskResults: Map<string, string>; // role → output
  criticFindings: CriticFinding[];
  contradictionScore: number; // 0–1
}

export interface FusionOutput {
  finalText: string;
  artifacts: Artifact[];
  debateRoundPerformed: boolean;
  compressedSnapshot: CompressedSnapshot;
}

// ============ Artifacts ============
export interface Artifact {
  id: string;
  kind: "code" | "spec" | "test" | "doc" | "schema" | "component";
  path: string;
  language?: string;
  content: string;
  metadata?: Record<string, unknown>;
}

// ============ Compression & State ============
export interface CompressedSnapshot {
  projectId?: string;
  sessionId?: string;
  turnId: string;
  userInput: string;
  routePlan: RouterDecision;
  finalOutput: string;
  summary: string; // compressed version for history
  artifacts: Artifact[];
  createdAt: number;
  tokensUsed: {
    input: number;
    output: number;
  };
}

// ============ Model Capabilities (Phase 4) ============
export interface ModelCapability {
  reasoning: boolean;
  codeGeneration: boolean;
  structuredOutput: boolean;
  streaming: boolean;
  maxContextTokens: number;
  latency: "instant" | "fast" | "normal" | "slow";
  costClass: "cheap" | "mid" | "expensive";
}

export interface TextRequest {
  system: string;
  user: string;
  maxTokens: number;
  temperature: number;
  model: string;
}

export interface TextChunkResponse {
  delta: string;
  finishReason?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

// ============ Cost Tracking ============
export interface CostBudget {
  mode: Mode;
  maxInputTokens: number;
  maxOutputTokens: number;
  currentInputTokens: number;
  currentOutputTokens: number;
}

export interface TurnMetrics {
  turnId: string;
  intent: Intent;
  mode: Mode;
  rolesRun: Role[];
  inputTokensUsed: number;
  outputTokensUsed: number;
  estimatedCost: number;
  durationMs: number;
  wasInterrupted: boolean;
}
