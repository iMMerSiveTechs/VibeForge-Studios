/**
 * Engine barrel export.
 * Import from "@/engine" to access types, adapters, and the client singleton.
 */

export * from "./types";
export { engineClient } from "./EngineClient";
export { MockEngine } from "./adapters/MockEngine";
export { RemoteEngine } from "./adapters/RemoteEngine";
