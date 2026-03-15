/**
 * MockEngine - Simulated streaming engine for UI development.
 *
 * Streams mock output character-by-character so every UI path
 * (route, phase, delta, final) can be exercised without a backend.
 */

import type {
  EngineAdapter,
  EngineCallbacks,
  EngineOptions,
  EngineRole,
  EngineFinal,
  RouteDecision,
} from "../types";

const MOCK_OUTPUT = `// MockEngine: This is simulated output.
// Switch to RemoteEngine to connect to the VCE orchestrator.

function helloVibeForge() {
  return 'Hello from the Cognitive Engine';
}`;

function generateTurnId(): string {
  return `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class MockEngine implements EngineAdapter {
  private abortedTurnId: string | null = null;

  async generate(message: string, callbacks: EngineCallbacks, _options?: EngineOptions): Promise<void> {
    const turnId = generateTurnId();
    const role: EngineRole = "BUILDER";
    const startTime = Date.now();

    const isAborted = () => this.abortedTurnId === turnId;

    // Phase: routing
    callbacks.onPhase("routing");

    await sleep(300);
    if (isAborted()) return;

    // Route decision
    const routeDecision: RouteDecision = {
      turnId,
      intent: "build",
      mode: "single",
      roles: [role],
      scores: { complexity: 25, risk: 10, uncertainty: 15 },
      costControl: "Mock mode -- no API cost",
    };
    callbacks.onRoute(routeDecision);

    // Phase: thinking
    callbacks.onPhase("thinking", role);
    await sleep(400);
    if (isAborted()) return;

    // Phase: streaming
    callbacks.onPhase("streaming", role);

    // Stream character by character
    for (let i = 0; i < MOCK_OUTPUT.length; i++) {
      if (isAborted()) return;
      callbacks.onDelta({ role, delta: MOCK_OUTPUT[i] });
      await sleep(15);
    }

    if (isAborted()) return;

    // Phase: done
    const durationMs = Date.now() - startTime;

    const finalResult: EngineFinal = {
      turnId,
      finalText: MOCK_OUTPUT,
      artifacts: [],
      roles: [role],
      mode: "single",
      intent: "build",
      metrics: {
        inputTokensUsed: message.split(/\s+/).length * 2,
        outputTokensUsed: MOCK_OUTPUT.split(/\s+/).length * 2,
        estimatedCostUSD: 0,
        durationMs,
      },
    };

    callbacks.onFinal(finalResult);
    callbacks.onPhase("done");
  }

  async interrupt(turnId: string): Promise<void> {
    this.abortedTurnId = turnId;
  }
}
