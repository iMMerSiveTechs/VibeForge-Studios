export type ModelTier = "fast" | "smart" | "max";
export type ModelProvider = "anthropic" | "openai" | "gemini";
export type ModelCapability = "streaming" | "tools" | "vision" | "json" | "reasoning";

export interface ModelOption {
  provider: ModelProvider;
  modelId: string;
  displayName: string;
  tier: ModelTier;
  capabilities: ModelCapability[];
  recommended: boolean;
  hiddenByDefault: boolean;
  contextWindow: number;
  costPer1MInput: number;
  costPer1MOutput: number;
}

export const MODEL_CATALOG: ModelOption[] = [
  // ── Anthropic ──────────────────────────────────────────────────────────
  { provider: "anthropic", modelId: "claude-haiku-4-5", displayName: "Claude Haiku 4.5", tier: "fast", capabilities: ["streaming", "tools", "vision", "json"], recommended: true, hiddenByDefault: false, contextWindow: 200000, costPer1MInput: 0.80, costPer1MOutput: 4.00 },
  { provider: "anthropic", modelId: "claude-sonnet-4-5", displayName: "Claude Sonnet 4.5", tier: "smart", capabilities: ["streaming", "tools", "vision", "json"], recommended: false, hiddenByDefault: false, contextWindow: 200000, costPer1MInput: 3.00, costPer1MOutput: 15.00 },
  { provider: "anthropic", modelId: "claude-sonnet-4-6", displayName: "Claude Sonnet 4.6", tier: "smart", capabilities: ["streaming", "tools", "vision", "json"], recommended: true, hiddenByDefault: false, contextWindow: 200000, costPer1MInput: 3.00, costPer1MOutput: 15.00 },
  { provider: "anthropic", modelId: "claude-opus-4-5", displayName: "Claude Opus 4.5", tier: "max", capabilities: ["streaming", "tools", "vision", "json"], recommended: false, hiddenByDefault: false, contextWindow: 200000, costPer1MInput: 15.00, costPer1MOutput: 75.00 },
  { provider: "anthropic", modelId: "claude-opus-4-6", displayName: "Claude Opus 4.6", tier: "max", capabilities: ["streaming", "tools", "vision", "json"], recommended: true, hiddenByDefault: false, contextWindow: 200000, costPer1MInput: 15.00, costPer1MOutput: 75.00 },

  // ── OpenAI ─────────────────────────────────────────────────────────────
  { provider: "openai", modelId: "gpt-4o-mini", displayName: "GPT-4o Mini", tier: "fast", capabilities: ["streaming", "tools", "vision", "json"], recommended: true, hiddenByDefault: false, contextWindow: 128000, costPer1MInput: 0.15, costPer1MOutput: 0.60 },
  { provider: "openai", modelId: "gpt-4o", displayName: "GPT-4o", tier: "smart", capabilities: ["streaming", "tools", "vision", "json"], recommended: true, hiddenByDefault: false, contextWindow: 128000, costPer1MInput: 2.50, costPer1MOutput: 10.00 },
  { provider: "openai", modelId: "o4-mini", displayName: "o4 Mini (Reasoning)", tier: "fast", capabilities: ["streaming", "tools", "json", "reasoning"], recommended: false, hiddenByDefault: false, contextWindow: 200000, costPer1MInput: 1.10, costPer1MOutput: 4.40 },
  { provider: "openai", modelId: "o3", displayName: "o3 (Deep Reasoning)", tier: "max", capabilities: ["streaming", "tools", "json", "reasoning"], recommended: true, hiddenByDefault: false, contextWindow: 200000, costPer1MInput: 10.00, costPer1MOutput: 40.00 },
  { provider: "openai", modelId: "gpt-4.1", displayName: "GPT-4.1", tier: "smart", capabilities: ["streaming", "tools", "vision", "json"], recommended: false, hiddenByDefault: false, contextWindow: 128000, costPer1MInput: 2.00, costPer1MOutput: 8.00 },

  // ── Gemini ─────────────────────────────────────────────────────────────
  { provider: "gemini", modelId: "gemini-2.0-flash", displayName: "Gemini 2.0 Flash", tier: "fast", capabilities: ["streaming", "tools", "vision", "json"], recommended: true, hiddenByDefault: false, contextWindow: 1000000, costPer1MInput: 0.10, costPer1MOutput: 0.40 },
  { provider: "gemini", modelId: "gemini-2.0-flash-lite", displayName: "Gemini 2.0 Flash Lite", tier: "fast", capabilities: ["streaming", "tools", "json"], recommended: false, hiddenByDefault: false, contextWindow: 1000000, costPer1MInput: 0.075, costPer1MOutput: 0.30 },
  { provider: "gemini", modelId: "gemini-2.5-pro", displayName: "Gemini 2.5 Pro", tier: "smart", capabilities: ["streaming", "tools", "vision", "json", "reasoning"], recommended: true, hiddenByDefault: false, contextWindow: 1000000, costPer1MInput: 1.25, costPer1MOutput: 10.00 },
  { provider: "gemini", modelId: "gemini-2.5-pro-preview-06-05", displayName: "Gemini 2.5 Pro Preview", tier: "max", capabilities: ["streaming", "tools", "vision", "json", "reasoning"], recommended: false, hiddenByDefault: false, contextWindow: 1000000, costPer1MInput: 1.25, costPer1MOutput: 10.00 },
  { provider: "gemini", modelId: "gemini-2.5-flash", displayName: "Gemini 2.5 Flash", tier: "smart", capabilities: ["streaming", "tools", "vision", "json", "reasoning"], recommended: false, hiddenByDefault: false, contextWindow: 1000000, costPer1MInput: 0.30, costPer1MOutput: 2.50 },
];

export const PRESET_TIER_MAP: Record<"FAST" | "SMART" | "DEEP", ModelTier> = {
  FAST: "fast",
  SMART: "smart",
  DEEP: "max",
};

export function getModelsByProvider(provider: ModelProvider): ModelOption[] {
  return MODEL_CATALOG.filter((m) => m.provider === provider);
}

export function getRecommendedModel(provider: ModelProvider, tier: ModelTier): ModelOption | undefined {
  return MODEL_CATALOG.find((m) => m.provider === provider && m.tier === tier && m.recommended);
}

export function isValidModelId(modelId: string): boolean {
  return MODEL_CATALOG.some((m) => m.modelId === modelId);
}
