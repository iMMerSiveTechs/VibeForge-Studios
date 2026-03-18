/**
 * RemoteEngine - Real SSE streaming to the VCE orchestrator.
 *
 * Uses expo/fetch for streaming and auth cookies for authentication.
 * Parses SSE events: route, status, delta, final, error, keepalive.
 */

import { fetch as expoFetch } from "expo/fetch";
import { authClient } from "@/lib/auth/auth-client";
import type {
  EngineAdapter,
  EngineCallbacks,
  EngineOptions,
  EnginePhase,
  EngineRole,
  RouteDecision,
  EngineDelta,
  EngineFinal,
  EngineError,
} from "../types";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
if (!BACKEND_URL) {
  throw new Error("EXPO_PUBLIC_BACKEND_URL is not set");
}

// Raw SSE event shapes from the backend
interface RawRouteEvent {
  turnId: string;
  intent: string;
  mode: string;
  roles: string[];
  scores: { complexity: number; risk: number; uncertainty: number };
  costControl: string;
}

interface RawStatusEvent {
  phase: string;
  turnId?: string;
  role?: string;
  roles?: string[];
}

interface RawDeltaEvent {
  role: string;
  delta: string;
}

interface RawFinalEvent {
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
  metrics: {
    inputTokensUsed: number;
    outputTokensUsed: number;
    estimatedCostUSD: number;
    durationMs: number;
  };
}

interface RawErrorEvent {
  message: string;
  code?: string;
  role?: string;
}

export class RemoteEngine implements EngineAdapter {
  private readerRef: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private isGenerating = false;

  async generate(
    message: string,
    callbacks: EngineCallbacks,
    options?: EngineOptions
  ): Promise<void> {
    // Guard against concurrent requests
    if (this.isGenerating) {
      callbacks.onError({
        message: "A request is already in progress. Please wait or interrupt first.",
      });
      return;
    }

    this.isGenerating = true;

    try {
      const response = await expoFetch(`${BACKEND_URL}/api/vce/chat`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Cookie: authClient.getCookie(),
        },
        body: JSON.stringify({
          message,
          ...(options?.preset ? { preset: options.preset } : {}),
          ...(options?.overrides ? { overrides: options.overrides } : {}),
          ...(options?.projectId ? { projectId: options.projectId } : {}),
        }),
      });

      if (!response.ok) {
        const errJson = (await response.json().catch(() => ({
          error: { message: "Unknown error" },
        }))) as { error: { message: string } };
        throw new Error(
          errJson?.error?.message ?? `HTTP ${response.status}`
        );
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");
      this.readerRef = reader;

      const decoder = new TextDecoder();
      let buffer = "";

      const processEvents = (chunk: string) => {
        buffer += chunk;
        const blocks = buffer.split("\n\n");
        // Only keep the last block as buffer if the chunk didn't end with \n\n
        // (meaning it's an incomplete event)
        if (chunk.endsWith("\n\n")) {
          buffer = "";
        } else {
          buffer = blocks.pop() ?? "";
        }

        for (const block of blocks) {
          if (!block.trim()) continue;
          if (block.startsWith(": keepalive")) continue;

          const lines = block.split("\n");
          let eventType = "";
          let dataStr = "";

          for (const line of lines) {
            if (line.startsWith("event: "))
              eventType = line.slice(7).trim();
            else if (line.startsWith("data: "))
              dataStr = line.slice(6).trim();
          }

          if (!eventType || !dataStr) continue;

          try {
            const data = JSON.parse(dataStr);

            switch (eventType) {
              case "route": {
                const ev = data as RawRouteEvent;
                const decision: RouteDecision = {
                  turnId: ev.turnId,
                  intent: ev.intent as RouteDecision["intent"],
                  mode: ev.mode as RouteDecision["mode"],
                  roles: ev.roles as EngineRole[],
                  scores: ev.scores,
                  costControl: ev.costControl,
                };
                callbacks.onRoute(decision);
                break;
              }

              case "status": {
                const ev = data as RawStatusEvent;
                const phase = ev.phase as EnginePhase;
                let activeRole: string | undefined;
                if (ev.role) {
                  activeRole = ev.role;
                } else if (ev.roles && ev.roles.length > 0) {
                  activeRole = ev.roles.join("+");
                } else if (phase !== "streaming") {
                  activeRole = undefined;
                }
                callbacks.onPhase(phase, activeRole);
                break;
              }

              case "delta": {
                const ev = data as RawDeltaEvent;
                callbacks.onPhase("streaming", ev.role);
                const delta: EngineDelta = {
                  role: ev.role as EngineRole,
                  delta: ev.delta,
                };
                callbacks.onDelta(delta);
                break;
              }

              case "final": {
                const ev = data as RawFinalEvent;
                const result: EngineFinal = {
                  turnId: ev.turnId,
                  finalText: ev.finalText,
                  artifacts: ev.artifacts,
                  roles: ev.roles,
                  mode: ev.mode,
                  intent: ev.intent,
                  metrics: ev.metrics,
                };
                callbacks.onFinal(result);
                break;
              }

              case "error": {
                const ev = data as RawErrorEvent;
                const error: EngineError = {
                  message: ev.message,
                  code: ev.code,
                  role: ev.role,
                };
                callbacks.onError(error);
                break;
              }
            }
          } catch {
            // Malformed SSE data -- skip
          }
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        processEvents(decoder.decode(value, { stream: true }));
      }

      this.readerRef = null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unexpected error";
      callbacks.onError({ message: msg });
    } finally {
      this.isGenerating = false;
    }
  }

  async interrupt(turnId: string): Promise<void> {
    // Cancel the active reader
    const reader = this.readerRef;
    this.readerRef = null;
    if (reader) {
      try {
        reader.cancel();
      } catch {
        // ignore
      }
    }

    // Notify the backend
    try {
      await expoFetch(`${BACKEND_URL}/api/vce/interrupt/${turnId}`, {
        method: "POST",
        credentials: "include",
        headers: { Cookie: authClient.getCookie() },
      });
    } catch {
      // best effort
    }
  }
}
