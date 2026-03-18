/**
 * Engine Zustand store.
 *
 * IMPORTANT: Always use selectors to subscribe to specific slices:
 *   const phase = useEngineStore(s => s.phase);
 * Never subscribe to the whole store.
 */

import { create } from "zustand";
import type {
  EnginePhase,
  RouteDecision,
  EngineFinal,
  EngineError,
} from "@/engine/types";

interface EngineState {
  phase: EnginePhase;
  mode: "mock" | "remote";
  turnId: string | null;
  activeRole: string | undefined;
  routeDecision: RouteDecision | null;
  isStreaming: boolean;
  lastFinal: EngineFinal | null;
  lastError: EngineError | null;
  lastDurationMs: number;
  streamingTexts: Record<string, string>;

  // Actions
  setPhase: (phase: EnginePhase, activeRole?: string) => void;
  setRouteDecision: (decision: RouteDecision) => void;
  setStreaming: (streaming: boolean) => void;
  setFinal: (result: EngineFinal) => void;
  setError: (error: EngineError) => void;
  setMode: (mode: "mock" | "remote") => void;
  appendDelta: (role: string, delta: string) => void;
  reset: () => void;
}

const initialState = {
  phase: "idle" as EnginePhase,
  mode: "remote" as const,
  turnId: null as string | null,
  activeRole: undefined as string | undefined,
  routeDecision: null as RouteDecision | null,
  isStreaming: false,
  lastFinal: null as EngineFinal | null,
  lastError: null as EngineError | null,
  lastDurationMs: 0,
  streamingTexts: {} as Record<string, string>,
};

export const useEngineStore = create<EngineState>((set) => ({
  ...initialState,

  setPhase: (phase, activeRole) => set({ phase, activeRole }),
  setRouteDecision: (decision) =>
    set({ routeDecision: decision, turnId: decision.turnId }),
  setStreaming: (streaming) => set({ isStreaming: streaming }),
  setFinal: (result) =>
    set({ lastFinal: result, lastDurationMs: result.metrics.durationMs }),
  setError: (error) => set({ lastError: error, phase: "error" }),
  setMode: (mode) => set({ mode }),
  appendDelta: (role, delta) =>
    set((state) => ({
      streamingTexts: {
        ...state.streamingTexts,
        [role]: (state.streamingTexts[role] ?? "") + delta,
      },
    })),
  reset: () => set(initialState),
}));
