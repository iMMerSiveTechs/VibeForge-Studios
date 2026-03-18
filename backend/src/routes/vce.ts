/**
 * VibeForge Cognitive Engine - Phase 1.5 Orchestrator Route
 * SSE streaming endpoint with deterministic routing, parallel specialist calls, and fusion
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { randomUUID } from "crypto";
import { auth } from "../auth";
import { db } from "../prisma";
import { selectBestProvider } from "../lib/ai-utils";
import { PRESET_TIER_MAP, getRecommendedModel, isValidModelId } from "../lib/model-catalog";
import type { ModelTier } from "../lib/model-catalog";
import { VCERouter } from "../lib/vce-router";
import { TaskRuntime } from "../lib/vce-runtime";
import { Fusion } from "../lib/vce-fusion";
import { CostTracker } from "../lib/vce-cost-policy";
import type { Role, RouterDecision, CriticFinding } from "../types/vce";

// ============ Singleton router + runtime (shared across requests) ============
const vceRouter = new VCERouter();
const runtime = new TaskRuntime();
const fusion = new Fusion();

// Map of turnId -> { controller, userId, createdAt } for interrupt support
interface ActiveTurn {
  controller: AbortController;
  userId: string;
  createdAt: number;
}
const activeTurns = new Map<string, ActiveTurn>();

// TTL cleanup: remove stale turns older than 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [turnId, turn] of activeTurns) {
    if (now - turn.createdAt > 10 * 60 * 1000) {
      turn.controller.abort();
      activeTurns.delete(turnId);
    }
  }
}, 60_000);

// ============ Hono app ============
const vceHonoRouter = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

// ============ Role System Prompts ============
function buildSystemPrompt(role: Role, userInput: string): string {
  switch (role) {
    case "BUILDER":
      return `You are an expert software engineer. Your task: ${userInput}. Produce complete, working code with full implementations.`;
    case "ARCHITECT":
      return `You are a system architect. Analyze this request: ${userInput}. Describe the architecture, data flow, key interfaces, and implementation strategy.`;
    case "CRITIC":
      return `You are a code reviewer. Review the following and find P0 (critical bugs/security), P1 (important issues), P2 (minor). Rate each finding. Output as: ## Findings\n[P0] ...\n[P1] ...\n[P2] ...`;
    case "REASONER":
      return `You are a reconciliation specialist. Given these two outputs that contradict each other, produce a single unified approach that resolves the contradiction.`;
    case "VISIONARY":
      return `You are a creative visionary and product strategist. Explore innovative approaches, bold ideas, and creative directions for this request: ${userInput}. Think beyond conventional solutions.`;
    default:
      return `You are an expert AI assistant. Your task: ${userInput}. Provide a complete, thoughtful response.`;
  }
}

// ============ Streaming AI call with SSE delta emit ============
interface StreamCallOptions {
  apiKey: string;
  model: string;
  provider: "anthropic" | "openai" | "gemini";
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
  temperature: number;
  abortSignal: AbortSignal;
  onDelta: (delta: string) => void;
  onComplete: (fullText: string, inputTokens: number, outputTokens: number) => void;
  onError: (err: Error) => void;
}

async function streamAnthropicCall(opts: StreamCallOptions): Promise<void> {
  const { apiKey, model, systemPrompt, userPrompt, maxTokens, temperature, abortSignal, onDelta, onComplete, onError } = opts;

  try {
    const response = await fetch("https://proxy.vibecodeapp.com/anthropic/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        stream: true,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
      signal: abortSignal,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Anthropic stream error (${response.status}): ${errText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let fullText = "";
    let inputTokens = 0;
    let outputTokens = 0;
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;

        try {
          const event = JSON.parse(jsonStr) as {
            type?: string;
            delta?: { type?: string; text?: string };
            usage?: { input_tokens?: number; output_tokens?: number };
            message?: { usage?: { input_tokens?: number; output_tokens?: number } };
          };

          if (event.type === "content_block_delta" && event.delta?.type === "text_delta" && event.delta.text) {
            fullText += event.delta.text;
            onDelta(event.delta.text);
          } else if (event.type === "message_start" && event.message?.usage) {
            inputTokens = event.message.usage.input_tokens ?? 0;
          } else if (event.type === "message_delta" && event.usage) {
            outputTokens = event.usage.output_tokens ?? 0;
          }
        } catch {
          // Skip malformed JSON lines
        }
      }
    }

    onComplete(fullText, inputTokens, outputTokens);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") return;
    onError(err instanceof Error ? err : new Error(String(err)));
  }
}

async function streamOpenAICall(opts: StreamCallOptions): Promise<void> {
  const { apiKey, model, systemPrompt, userPrompt, maxTokens, temperature, abortSignal, onDelta, onComplete, onError } = opts;

  try {
    const response = await fetch("https://proxy.vibecodeapp.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        stream: true,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
      signal: abortSignal,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI stream error (${response.status}): ${errText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let fullText = "";
    let inputTokens = 0;
    let outputTokens = 0;
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;

        try {
          const event = JSON.parse(jsonStr) as {
            choices?: Array<{ delta?: { content?: string }; finish_reason?: string }>;
            usage?: { prompt_tokens?: number; completion_tokens?: number };
          };

          const delta = event.choices?.[0]?.delta?.content;
          if (delta) {
            fullText += delta;
            onDelta(delta);
          }
          if (event.usage) {
            inputTokens = event.usage.prompt_tokens ?? 0;
            outputTokens = event.usage.completion_tokens ?? 0;
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }

    onComplete(fullText, inputTokens, outputTokens);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") return;
    onError(err instanceof Error ? err : new Error(String(err)));
  }
}

async function streamGeminiCall(opts: StreamCallOptions): Promise<void> {
  // Gemini doesn't support SSE the same way — fall back to non-streaming and emit as single delta
  const { apiKey, model, systemPrompt, userPrompt, maxTokens, temperature, abortSignal, onDelta, onComplete, onError } = opts;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt + "\n\n" + userPrompt }] }],
          generationConfig: { maxOutputTokens: maxTokens, temperature },
        }),
        signal: abortSignal,
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini error (${response.status}): ${errText}`);
    }

    const result = (await response.json()) as {
      candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
    };

    const text = result.candidates[0]?.content?.parts.map((p) => p.text).join("\n") ?? "";
    const inputTokens = result.usageMetadata?.promptTokenCount ?? 0;
    const outputTokens = result.usageMetadata?.candidatesTokenCount ?? 0;

    // Emit in small chunks to simulate streaming
    const chunkSize = 80;
    for (let i = 0; i < text.length; i += chunkSize) {
      if (abortSignal.aborted) return;
      onDelta(text.slice(i, i + chunkSize));
      await new Promise((r) => setTimeout(r, 10));
    }

    onComplete(text, inputTokens, outputTokens);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") return;
    onError(err instanceof Error ? err : new Error(String(err)));
  }
}

async function runStreamingCall(opts: StreamCallOptions): Promise<void> {
  switch (opts.provider) {
    case "anthropic":
      return streamAnthropicCall(opts);
    case "openai":
      return streamOpenAICall(opts);
    case "gemini":
      return streamGeminiCall(opts);
  }
}

// ============ resolveModelForRole helper ============
function resolveModelForRole(
  role: "builder" | "critic" | "reasoner",
  preset: "FAST" | "SMART" | "DEEP" | undefined,
  overrides: { builder?: string; critic?: string; reasoner?: string } | undefined,
  defaultProviderInfo: { provider: "anthropic" | "openai" | "gemini"; model: string; apiKey: string }
): { model: string; provider: "anthropic" | "openai" | "gemini"; apiKey: string } {
  // Check explicit override first (validate it exists in catalog)
  const override = overrides?.[role];
  if (override && isValidModelId(override)) {
    return { ...defaultProviderInfo, model: override };
  }

  // If preset specified, try to find a recommended model for that tier
  if (preset) {
    const tier: ModelTier = PRESET_TIER_MAP[preset];
    const recommended = getRecommendedModel(defaultProviderInfo.provider, tier);
    if (recommended) {
      return { ...defaultProviderInfo, model: recommended.modelId };
    }
  }

  // Fall back to default
  return defaultProviderInfo;
}

// ============ POST /api/vce/chat ============
vceHonoRouter.post(
  "/chat",
  zValidator(
    "json",
    z.object({
      message: z.string().min(1),
      projectId: z.string().optional(),
      preset: z.enum(["FAST", "SMART", "DEEP"]).optional(),
      overrides: z.object({
        builder: z.string().optional(),
        critic: z.string().optional(),
        reasoner: z.string().optional(),
      }).optional(),
    })
  ),
  async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
    }

    const { message, projectId, preset, overrides } = c.req.valid("json");

    // Resolve provider
    const providerInfo = await selectBestProvider(db, user.id);
    if (!providerInfo) {
      return c.json(
        { error: { message: "No AI API key configured. Add one in Settings.", code: "NO_API_KEY" } },
        400
      );
    }

    const turnId = randomUUID();
    const turnAbortController = new AbortController();
    activeTurns.set(turnId, { controller: turnAbortController, userId: user.id, createdAt: Date.now() });

    // Route the request (deterministic, no LLM)
    const routeDecision: RouterDecision = vceRouter.route(message);
    const costTracker = new CostTracker(routeDecision.mode);

    // Build SSE response using ReadableStream
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let closed = false;

        function send(eventType: string, data: unknown): boolean {
          if (closed) return false;
          try {
            const line = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
            controller.enqueue(encoder.encode(line));
            return true;
          } catch {
            closed = true;
            return false;
          }
        }

        function sendKeepalive(): boolean {
          if (closed) return false;
          try {
            controller.enqueue(encoder.encode(": keepalive\n\n"));
            return true;
          } catch {
            closed = true;
            return false;
          }
        }

        function close() {
          if (!closed) {
            closed = true;
            activeTurns.delete(turnId);
            try {
              controller.close();
            } catch {
              // already closed
            }
          }
        }

        // Keepalive every 15s
        const keepaliveTimer = setInterval(() => {
          if (!sendKeepalive()) clearInterval(keepaliveTimer);
        }, 15000);

        try {
          // 1. Emit route decision
          send("route", {
            turnId,
            intent: routeDecision.intent,
            mode: routeDecision.mode,
            roles: routeDecision.roles,
            scores: routeDecision.scores,
            costControl: routeDecision.costControl,
          });

          send("status", { phase: "routing", turnId });

          // 2. Determine which roles to run based on mode
          const rolesToRun = routeDecision.roles.filter(
            (r): r is Role => ["BUILDER", "ARCHITECT", "CRITIC", "REASONER", "VISIONARY"].includes(r)
          );

          // Ensure we always have at least BUILDER
          if (!rolesToRun.includes("BUILDER") && !rolesToRun.includes("ARCHITECT") && !rolesToRun.includes("VISIONARY")) {
            rolesToRun.unshift("BUILDER");
          }

          // Separate primary roles (run first) from sequential roles (run after)
          const primaryRoles: Role[] = rolesToRun.filter((r) => r !== "CRITIC" && r !== "REASONER");
          const hasCritic = rolesToRun.includes("CRITIC");
          const hasReasoner = rolesToRun.includes("REASONER");

          const taskResults = new Map<string, string>();

          send("status", { phase: "thinking", turnId });

          // ============ Run primary roles ============
          if (routeDecision.mode === "single") {
            // Single: run only the first primary role sequentially
            const role = primaryRoles[0] ?? "BUILDER";
            const task = runtime.createTask(turnId, role, "HIGH");
            const systemPrompt = buildSystemPrompt(role, message);

            send("status", { phase: "streaming", turnId, role });
            runtime.markRunning(task.id);

            let fullText = "";

            const roleKey = role === "BUILDER" ? "builder" : role === "CRITIC" ? "critic" : role === "REASONER" ? "reasoner" : null;
            const resolved = roleKey ? resolveModelForRole(roleKey, preset, overrides, providerInfo) : providerInfo;

            await new Promise<void>((resolve) => {
              runStreamingCall({
                apiKey: resolved.apiKey,
                model: resolved.model,
                provider: resolved.provider,
                systemPrompt,
                userPrompt: message,
                maxTokens: 2000,
                temperature: 0.7,
                abortSignal: turnAbortController.signal,
                onDelta: (delta) => {
                  fullText += delta;
                  runtime.streamDelta(task.id, delta);
                  send("delta", { role, delta });
                },
                onComplete: (text, inputTok, outputTok) => {
                  fullText = text;
                  runtime.completeTask(task.id, text);
                  costTracker.addTokens(inputTok, outputTok, 0);
                  resolve();
                },
                onError: (err) => {
                  runtime.failTask(task.id, err.message);
                  send("error", { message: err.message, role });
                  resolve();
                },
              });
            });

            if (fullText) taskResults.set(role, fullText);

          } else {
            // Duo / Fanout: run primary roles in parallel
            send("status", { phase: "streaming", turnId, roles: primaryRoles });

            await Promise.all(
              primaryRoles.map(async (role) => {
                const task = runtime.createTask(turnId, role, "HIGH");
                const systemPrompt = buildSystemPrompt(role, message);
                runtime.markRunning(task.id);

                let fullText = "";

                const parallelRoleKey = role === "BUILDER" ? "builder" : role === "CRITIC" ? "critic" : role === "REASONER" ? "reasoner" : null;
                const parallelResolved = parallelRoleKey ? resolveModelForRole(parallelRoleKey, preset, overrides, providerInfo) : providerInfo;

                await new Promise<void>((resolve) => {
                  runStreamingCall({
                    apiKey: parallelResolved.apiKey,
                    model: parallelResolved.model,
                    provider: parallelResolved.provider,
                    systemPrompt,
                    userPrompt: message,
                    maxTokens: 3000,
                    temperature: 0.7,
                    abortSignal: turnAbortController.signal,
                    onDelta: (delta) => {
                      fullText += delta;
                      runtime.streamDelta(task.id, delta);
                      send("delta", { role, delta });
                    },
                    onComplete: (text, inputTok, outputTok) => {
                      fullText = text;
                      runtime.completeTask(task.id, text);
                      costTracker.addTokens(inputTok, outputTok, 0);
                      resolve();
                    },
                    onError: (err) => {
                      runtime.failTask(task.id, err.message);
                      send("error", { message: err.message, role });
                      resolve();
                    },
                  });
                });

                if (fullText) taskResults.set(role, fullText);
              })
            );
          }

          // ============ CRITIC role (sequential after primary) ============
          if (hasCritic && !turnAbortController.signal.aborted) {
            const criticTask = runtime.createTask(turnId, "CRITIC", "MED");
            runtime.markRunning(criticTask.id);

            // Build context from primary outputs
            const primaryOutputsSummary = Array.from(taskResults.entries())
              .map(([r, text]) => `=== ${r} OUTPUT ===\n${text.substring(0, 2000)}`)
              .join("\n\n");

            const criticUserPrompt = `Review the following outputs:\n\n${primaryOutputsSummary}\n\nOriginal request: ${message}`;
            const criticSystemPrompt = buildSystemPrompt("CRITIC", message);

            send("status", { phase: "streaming", turnId, role: "CRITIC" });

            let criticText = "";

            const criticResolved = resolveModelForRole("critic", preset, overrides, providerInfo);

            await new Promise<void>((resolve) => {
              runStreamingCall({
                apiKey: criticResolved.apiKey,
                model: criticResolved.model,
                provider: criticResolved.provider,
                systemPrompt: criticSystemPrompt,
                userPrompt: criticUserPrompt,
                maxTokens: 1500,
                temperature: 0.3,
                abortSignal: turnAbortController.signal,
                onDelta: (delta) => {
                  criticText += delta;
                  runtime.streamDelta(criticTask.id, delta);
                  send("delta", { role: "CRITIC", delta });
                },
                onComplete: (text, inputTok, outputTok) => {
                  criticText = text;
                  runtime.completeTask(criticTask.id, text);
                  costTracker.addTokens(inputTok, outputTok, 0);
                  resolve();
                },
                onError: (err) => {
                  runtime.failTask(criticTask.id, err.message);
                  send("error", { message: err.message, role: "CRITIC" });
                  resolve();
                },
              });
            });

            if (criticText) taskResults.set("CRITIC", criticText);
          }

          // ============ REASONER role (fanout only, if contradiction) ============
          if (hasReasoner && routeDecision.mode === "fanout" && taskResults.size >= 2 && !turnAbortController.signal.aborted) {
            const outputs = Array.from(taskResults.entries());
            const output1 = outputs[0];
            const output2 = outputs[1];

            if (output1 && output2) {
              const reasonerTask = runtime.createTask(turnId, "REASONER", "MED");
              runtime.markRunning(reasonerTask.id);

              const reasonerUserPrompt = `Output 1 (${output1[0]}):\n${output1[1].substring(0, 1500)}\n\nOutput 2 (${output2[0]}):\n${output2[1].substring(0, 1500)}\n\nOriginal request: ${message}`;
              const reasonerSystemPrompt = buildSystemPrompt("REASONER", message);

              send("status", { phase: "streaming", turnId, role: "REASONER" });

              let reasonerText = "";

              const reasonerResolved = resolveModelForRole("reasoner", preset, overrides, providerInfo);

              await new Promise<void>((resolve) => {
                runStreamingCall({
                  apiKey: reasonerResolved.apiKey,
                  model: reasonerResolved.model,
                  provider: reasonerResolved.provider,
                  systemPrompt: reasonerSystemPrompt,
                  userPrompt: reasonerUserPrompt,
                  maxTokens: 1500,
                  temperature: 0.4,
                  abortSignal: turnAbortController.signal,
                  onDelta: (delta) => {
                    reasonerText += delta;
                    runtime.streamDelta(reasonerTask.id, delta);
                    send("delta", { role: "REASONER", delta });
                  },
                  onComplete: (text, inputTok, outputTok) => {
                    reasonerText = text;
                    runtime.completeTask(reasonerTask.id, text);
                    costTracker.addTokens(inputTok, outputTok, 0);
                    resolve();
                  },
                  onError: (err) => {
                    runtime.failTask(reasonerTask.id, err.message);
                    send("error", { message: err.message, role: "REASONER" });
                    resolve();
                  },
                });
              });

              if (reasonerText) taskResults.set("REASONER", reasonerText);
            }
          }

          // ============ Fusion ============
          if (!turnAbortController.signal.aborted) {
            send("status", { phase: "fusing", turnId });

            // Parse critic findings from CRITIC output
            const criticFindings: CriticFinding[] = [];
            const criticOutput = taskResults.get("CRITIC") ?? "";
            const p0Matches = criticOutput.matchAll(/\[P0\]\s*(.+)/g);
            const p1Matches = criticOutput.matchAll(/\[P1\]\s*(.+)/g);
            const p2Matches = criticOutput.matchAll(/\[P2\]\s*(.+)/g);

            for (const m of p0Matches) {
              criticFindings.push({ severity: "P0", issue: m[1] ?? "", affectedRole: "BUILDER" });
            }
            for (const m of p1Matches) {
              criticFindings.push({ severity: "P1", issue: m[1] ?? "", affectedRole: "BUILDER" });
            }
            for (const m of p2Matches) {
              criticFindings.push({ severity: "P2", issue: m[1] ?? "", affectedRole: "BUILDER" });
            }

            const fusionOutput = await fusion.fuse({
              turnId,
              routeDecision,
              taskResults,
              criticFindings,
              contradictionScore: 0,
            });

            const metrics = costTracker.getMetrics();

            send("final", {
              turnId,
              finalText: fusionOutput.finalText,
              artifacts: fusionOutput.artifacts,
              debateRoundPerformed: fusionOutput.debateRoundPerformed,
              roles: Array.from(taskResults.keys()),
              mode: routeDecision.mode,
              intent: routeDecision.intent,
              metrics: {
                inputTokensUsed: metrics.inputTokensUsed,
                outputTokensUsed: metrics.outputTokensUsed,
                estimatedCostUSD: metrics.estimatedCostUSD,
                durationMs: metrics.timeElapsedMs,
              },
            });

            send("status", { phase: "done", turnId });
          } else {
            send("status", { phase: "interrupted", turnId });
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unexpected error";
          console.error("[VCE] Orchestrator error:", err);
          send("error", { message, code: "ORCHESTRATOR_ERROR" });
        } finally {
          clearInterval(keepaliveTimer);
          runtime.cleanupTurn(turnId);
          close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
        "Transfer-Encoding": "chunked",
      },
    });
  }
);

// ============ POST /api/vce/interrupt/:turnId ============
vceHonoRouter.post("/interrupt/:turnId", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const { turnId } = c.req.param();
  const turn = activeTurns.get(turnId);

  if (!turn || turn.userId !== user.id) {
    return c.json({ data: { status: "not_found", turnId } });
  }

  turn.controller.abort();
  activeTurns.delete(turnId);
  runtime.cancelTurn(turnId);

  return c.json({ data: { status: "interrupted", turnId } });
});

// ============ GET /api/vce/turns ============
vceHonoRouter.get("/turns", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  // Only return this user's active turns
  const userTurnIds: string[] = [];
  for (const [turnId, turn] of activeTurns) {
    if (turn.userId === user.id) {
      userTurnIds.push(turnId);
    }
  }

  return c.json({
    data: {
      active: userTurnIds,
      count: userTurnIds.length,
    },
  });
});

export { vceHonoRouter };
