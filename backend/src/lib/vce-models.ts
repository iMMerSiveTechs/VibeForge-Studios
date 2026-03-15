/**
 * VibeForge Cognitive Engine - Model Adapter Interface (Phase 4)
 * Capability-based model selection (not vendor hardcode)
 */

import type { ModelCapability, TextRequest, TextChunkResponse } from "../types/vce";

/**
 * Abstract adapter interface for all model providers
 */
export abstract class ModelAdapter {
  abstract provider: string;
  abstract model: string;

  /**
   * Get capabilities of this model
   */
  abstract getCapabilities(): ModelCapability;

  /**
   * Stream text response
   */
  abstract streamText(
    request: TextRequest,
    signal: AbortSignal
  ): AsyncIterable<TextChunkResponse>;

  /**
   * Get structured JSON output (with schema validation if supported)
   */
  async structuredOutput(
    request: TextRequest,
    schema: Record<string, unknown>
  ): Promise<unknown> {
    throw new Error("structuredOutput not implemented for this adapter");
  }

  /**
   * Estimate cost for a request
   */
  abstract estimateCost(request: TextRequest): {
    inputTokens: number;
    outputTokens: number;
    estimatedCostUSD: number;
  };

  /**
   * Validate that required credentials are available
   */
  abstract validateCredentials(): boolean;
}

/**
 * Anthropic Claude Adapter (Opus 4.6, Sonnet, Haiku)
 */
export class AnthropicAdapter extends ModelAdapter {
  provider = "anthropic";
  model: string;

  constructor(model: string = "claude-opus-4-6") {
    super();
    this.model = model;
  }

  getCapabilities(): ModelCapability {
    const baseCapabilities: ModelCapability = {
      reasoning: true,
      codeGeneration: true,
      structuredOutput: true,
      streaming: true,
      maxContextTokens: 200000,
      latency: "normal",
      costClass: "expensive",
    };

    // Adjust based on model
    if (this.model.includes("haiku")) {
      baseCapabilities.maxContextTokens = 200000;
      baseCapabilities.costClass = "cheap";
      baseCapabilities.latency = "fast";
    } else if (this.model.includes("sonnet")) {
      baseCapabilities.maxContextTokens = 200000;
      baseCapabilities.costClass = "mid";
      baseCapabilities.latency = "normal";
    }

    return baseCapabilities;
  }

  async *streamText(
    request: TextRequest,
    signal: AbortSignal
  ): AsyncIterable<TextChunkResponse> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

    const url = "https://api.anthropic.com/v1/messages";
    const body = {
      model: this.model,
      max_tokens: request.maxTokens,
      temperature: request.temperature,
      system: request.system,
      messages: [{ role: "user", content: request.user }],
      stream: true,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event = JSON.parse(line.slice(6));
              if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
                yield {
                  delta: event.delta.text,
                  finishReason:
                    event.type === "message_stop" ? "stop" : undefined,
                };
              }
              if (event.type === "message_delta" && event.usage) {
                yield {
                  delta: "",
                  finishReason: "stop",
                  usage: {
                    inputTokens: event.usage.input_tokens ?? 0,
                    outputTokens: event.usage.output_tokens ?? 0,
                  },
                };
              }
            } catch {
              // Skip invalid JSON lines
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  estimateCost(request: TextRequest): {
    inputTokens: number;
    outputTokens: number;
    estimatedCostUSD: number;
  } {
    // Rough token estimation: 1 token ≈ 4 chars
    const inputTokens = Math.ceil(
      (request.system.length + request.user.length) / 4
    );
    const outputTokens = request.maxTokens;

    // Pricing (rough, 2025 rates)
    let inputPrice = 0;
    let outputPrice = 0;

    if (this.model.includes("opus")) {
      inputPrice = 15 / 1000000; // $15 per 1M tokens
      outputPrice = 45 / 1000000; // $45 per 1M tokens
    } else if (this.model.includes("sonnet")) {
      inputPrice = 3 / 1000000;
      outputPrice = 15 / 1000000;
    } else if (this.model.includes("haiku")) {
      inputPrice = 0.8 / 1000000;
      outputPrice = 4 / 1000000;
    }

    return {
      inputTokens,
      outputTokens,
      estimatedCostUSD: inputTokens * inputPrice + outputTokens * outputPrice,
    };
  }

  validateCredentials(): boolean {
    return !!process.env.ANTHROPIC_API_KEY;
  }
}

/**
 * OpenAI GPT Adapter
 */
export class OpenAIAdapter extends ModelAdapter {
  provider = "openai";
  model: string;

  constructor(model: string = "gpt-4o") {
    super();
    this.model = model;
  }

  getCapabilities(): ModelCapability {
    return {
      reasoning: true,
      codeGeneration: true,
      structuredOutput: true,
      streaming: true,
      maxContextTokens: 128000,
      latency: "normal",
      costClass: "expensive",
    };
  }

  async *streamText(
    request: TextRequest,
    signal: AbortSignal
  ): AsyncIterable<TextChunkResponse> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY not set");

    const url = "https://api.openai.com/v1/chat/completions";
    const body = {
      model: this.model,
      max_tokens: request.maxTokens,
      temperature: request.temperature,
      messages: [
        { role: "system", content: request.system },
        { role: "user", content: request.user },
      ],
      stream: true,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              yield { delta: "", finishReason: "stop" };
              continue;
            }
            try {
              const event = JSON.parse(data);
              if (event.choices?.[0]?.delta?.content) {
                yield { delta: event.choices[0].delta.content };
              }
              if (event.usage) {
                yield {
                  delta: "",
                  finishReason: "stop",
                  usage: {
                    inputTokens: event.usage.prompt_tokens ?? 0,
                    outputTokens: event.usage.completion_tokens ?? 0,
                  },
                };
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  estimateCost(request: TextRequest): {
    inputTokens: number;
    outputTokens: number;
    estimatedCostUSD: number;
  } {
    const inputTokens = Math.ceil((request.system.length + request.user.length) / 4);
    const outputTokens = request.maxTokens;

    // GPT-4o pricing
    const inputPrice = 5 / 1000000; // $5 per 1M
    const outputPrice = 15 / 1000000; // $15 per 1M

    return {
      inputTokens,
      outputTokens,
      estimatedCostUSD: inputTokens * inputPrice + outputTokens * outputPrice,
    };
  }

  validateCredentials(): boolean {
    return !!process.env.OPENAI_API_KEY;
  }
}

/**
 * Google Gemini Adapter
 */
export class GeminiAdapter extends ModelAdapter {
  provider = "google";
  model: string;

  constructor(model: string = "gemini-2.0-flash") {
    super();
    this.model = model;
  }

  getCapabilities(): ModelCapability {
    return {
      reasoning: true,
      codeGeneration: true,
      structuredOutput: true,
      streaming: true,
      maxContextTokens: 1000000,
      latency: "normal",
      costClass: "cheap",
    };
  }

  async *streamText(
    request: TextRequest,
    signal: AbortSignal
  ): AsyncIterable<TextChunkResponse> {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_API_KEY not set");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:streamGenerateContent?key=${apiKey}`;
    const body = {
      system_instruction: { parts: [{ text: request.system }] },
      contents: {
        parts: [{ text: request.user }],
      },
      generationConfig: {
        maxOutputTokens: request.maxTokens,
        temperature: request.temperature,
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        // Parse each JSON object (Gemini returns NDJSON)
        const lines = text.split("\n").filter((l) => l.trim());

        for (const line of lines) {
          try {
            const event = JSON.parse(line);
            if (event.candidates?.[0]?.content?.parts?.[0]?.text) {
              yield { delta: event.candidates[0].content.parts[0].text };
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  estimateCost(request: TextRequest): {
    inputTokens: number;
    outputTokens: number;
    estimatedCostUSD: number;
  } {
    const inputTokens = Math.ceil((request.system.length + request.user.length) / 4);
    const outputTokens = request.maxTokens;

    // Gemini pricing (free tier or very cheap)
    return {
      inputTokens,
      outputTokens,
      estimatedCostUSD: 0, // Often free or <$0.001
    };
  }

  validateCredentials(): boolean {
    return !!process.env.GOOGLE_API_KEY;
  }
}

/**
 * Model factory: select adapter based on capability requirements
 */
export function selectModelAdapter(
  preferredProvider?: string
): ModelAdapter {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GOOGLE_API_KEY;

  // Use preferred if available
  if (preferredProvider === "anthropic" && anthropicKey) {
    return new AnthropicAdapter("claude-opus-4-6");
  }
  if (preferredProvider === "openai" && openaiKey) {
    return new OpenAIAdapter("gpt-4o");
  }
  if (preferredProvider === "google" && geminiKey) {
    return new GeminiAdapter("gemini-2.0-flash");
  }

  // Fallback: pick first available (cost-aware)
  if (geminiKey) return new GeminiAdapter(); // Cheapest
  if (openaiKey) return new OpenAIAdapter();
  if (anthropicKey) return new AnthropicAdapter();

  throw new Error("No model API keys configured");
}

export default ModelAdapter;
