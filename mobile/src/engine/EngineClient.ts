/**
 * EngineClient - The single gateway between UI and engine adapters.
 *
 * The UI calls ONLY this. Never touches provider APIs directly.
 */

import type { EngineAdapter, EngineCallbacks, EngineOptions } from "./types";
import { MockEngine } from "./adapters/MockEngine";
import { RemoteEngine } from "./adapters/RemoteEngine";

type ClientMode = "mock" | "remote";

class EngineClient {
  private adapter: EngineAdapter;
  private mode: ClientMode;

  constructor(mode: ClientMode = "remote") {
    this.mode = mode;
    this.adapter = mode === "mock" ? new MockEngine() : new RemoteEngine();
  }

  setMode(mode: ClientMode): void {
    if (mode !== this.mode) {
      this.mode = mode;
      this.adapter = mode === "mock" ? new MockEngine() : new RemoteEngine();
    }
  }

  getMode(): ClientMode {
    return this.mode;
  }

  async generate(
    message: string,
    callbacks: EngineCallbacks,
    options?: EngineOptions
  ): Promise<void> {
    return this.adapter.generate(message, callbacks, options);
  }

  async interrupt(turnId: string): Promise<void> {
    return this.adapter.interrupt(turnId);
  }
}

/** Singleton -- import this everywhere the UI needs engine access */
export const engineClient = new EngineClient("remote");
