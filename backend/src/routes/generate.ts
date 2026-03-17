import { auth } from "../auth";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../prisma";
import {
  DEFAULT_SYSTEM_PROMPT,
  detectProvider,
  parseResponseText,
  selectBestProvider,
  callAnthropicAPI,
  callOpenAIAPI,
  callGeminiAPI,
  callWithFallback,
  type AIResponse,
} from "../lib/ai-utils";
import { CODEGEN_SYSTEM_PROMPT, parseCodegenResponse, applyFileChanges } from "../lib/vce-codegen";

const generateRouter = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

// ---- Route ----

generateRouter.post(
  "/",
  zValidator(
    "json",
    z.object({
      projectId: z.string().min(1),
      prompt: z.string().min(1),
      systemPrompt: z.string().optional(),
      model: z.string().optional(),
      maxTokens: z.number().int().positive().optional(),
      temperature: z.number().min(0).max(2).optional(),
      apiKey: z.string().min(1).optional(),
    })
  ),
  async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json(
        { error: { message: "Unauthorized", code: "UNAUTHORIZED" } },
        401
      );
    }

    const body = c.req.valid("json");

    // Verify project exists and user owns it
    const project = await db.project.findUnique({
      where: { id: body.projectId },
    });
    if (!project || project.userId !== user.id) {
      return c.json(
        { error: { message: "Project not found", code: "NOT_FOUND" } },
        404
      );
    }

    const systemPrompt = body.systemPrompt ?? DEFAULT_SYSTEM_PROMPT;
    const model = body.model ?? "claude-sonnet-4-5";
    const maxTokens = body.maxTokens ?? 16000;
    const temperature = body.temperature ?? 0.7;

    // Step 1: Create a Run record with status "running"
    const run = await db.run.create({
      data: {
        projectId: body.projectId,
        status: "running",
        inputSystem: systemPrompt,
        inputUser: body.prompt,
        inputModel: model,
        inputMaxTokens: maxTokens,
        inputTemperature: temperature,
      },
    });

    try {
      // Step 2: Detect provider and call the appropriate API
      let aiResponse: AIResponse;
      let actualModel = model;

      if (body.apiKey) {
        // Explicit key provided - use it directly with specified model
        const provider = detectProvider(model);
        switch (provider) {
          case "anthropic":
            aiResponse = await callAnthropicAPI(
              body.apiKey,
              model,
              systemPrompt,
              body.prompt,
              maxTokens,
              temperature
            );
            break;
          case "openai":
            aiResponse = await callOpenAIAPI(
              body.apiKey,
              model,
              systemPrompt,
              body.prompt,
              maxTokens,
              temperature
            );
            break;
          case "gemini":
            aiResponse = await callGeminiAPI(
              body.apiKey,
              model,
              systemPrompt,
              body.prompt,
              maxTokens,
              temperature
            );
            break;
        }
      } else {
        // No key provided - use auto-fallback from settings
        const result = await callWithFallback(db, user.id, systemPrompt, body.prompt, maxTokens, temperature);
        aiResponse = result;
        actualModel = result.usedModel;
      }

      const { textContent, inputTokens, outputTokens } = aiResponse;

      // Validate that we got actual content from AI
      if (!textContent || textContent.trim().length === 0) {
        throw new Error("AI API returned empty response. Try again or check your API key.");
      }

      const excerpt = textContent.substring(0, 500);

      // Step 3: Parse the response
      const parsed = parseResponseText(textContent);

      // Log parsing results for debugging
      console.log("[Generate] Parsing results:", {
        hasVfApp: parsed.hasVfApp,
        hasVfPack: parsed.hasVfPack,
        fileCount: parsed.fileCount,
        textLength: textContent.length,
        model: actualModel,
      });

      // Step 4 & 5: Update project based on parsed output
      const projectUpdate: Record<string, unknown> = {};

      if (parsed.hasVfApp && parsed.vfApp) {
        projectUpdate.vfAppSpec = JSON.stringify(parsed.vfApp);
      }

      if (parsed.hasVfPack && parsed.vfPack) {
        projectUpdate.files = JSON.stringify(parsed.vfPack.files);
        projectUpdate.artifacts = JSON.stringify(
          parsed.vfPack.files.map((f) => f.path)
        );
      } else if (parsed.snippetFiles.length > 0) {
        // Step 6: Fallback snippets
        projectUpdate.files = JSON.stringify(parsed.snippetFiles);
        projectUpdate.artifacts = JSON.stringify(
          parsed.snippetFiles.map((f) => f.path)
        );
      }

      projectUpdate.sourceRunId = run.id;

      const updatedProject = await db.project.update({
        where: { id: body.projectId },
        data: projectUpdate,
      });

      // Step 7: Update the Run with results
      const updatedRun = await db.run.update({
        where: { id: run.id },
        data: {
          status: "done",
          outputTextExcerpt: excerpt,
          usageInputTokens: inputTokens ?? null,
          usageOutputTokens: outputTokens ?? null,
          parseHasVfApp: parsed.hasVfApp,
          parseHasVfPack: parsed.hasVfPack,
          parseFileCount: parsed.fileCount,
        },
      });

      // Step 8: Return combined result
      return c.json({
        data: {
          run: updatedRun,
          project: updatedProject,
          parsed: {
            hasVfApp: parsed.hasVfApp,
            hasVfPack: parsed.hasVfPack,
            fileCount: parsed.fileCount,
          },
        },
      });
    } catch (err) {
      // Handle unexpected errors
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";

      await db.run.update({
        where: { id: run.id },
        data: {
          status: "error",
          error: errorMessage,
        },
      });

      return c.json(
        {
          error: {
            message: errorMessage,
            code: "INTERNAL_ERROR",
          },
        },
        500
      );
    }
  }
);

// ============ SSE Streaming Code Generation ============
generateRouter.post(
  "/:projectId/stream",
  zValidator(
    "json",
    z.object({
      prompt: z.string().min(1),
      preset: z.enum(["FAST", "SMART", "DEEP"]).optional(),
    })
  ),
  async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
    }

    const projectId = c.req.param("projectId");
    const { prompt, preset } = c.req.valid("json");

    // Verify project ownership
    const project = await db.project.findUnique({ where: { id: projectId } });
    if (!project || project.userId !== user.id) {
      return c.json({ error: { message: "Project not found", code: "NOT_FOUND" } }, 404);
    }

    // Resolve provider
    const providerInfo = await selectBestProvider(db, user.id);
    if (!providerInfo) {
      return c.json({ error: { message: "No AI API key configured. Add one in Settings.", code: "NO_API_KEY" } }, 400);
    }

    // Create Run
    const run = await db.run.create({
      data: {
        projectId,
        status: "running",
        inputSystem: CODEGEN_SYSTEM_PROMPT,
        inputUser: prompt,
        inputModel: providerInfo.model,
        inputMaxTokens: 16000,
        inputTemperature: 0.7,
      },
    });

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let closed = false;

        function send(eventType: string, data: unknown): void {
          if (closed) return;
          try {
            controller.enqueue(encoder.encode(`event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`));
          } catch {
            closed = true;
          }
        }

        function close(): void {
          if (!closed) {
            closed = true;
            try { controller.close(); } catch { /* already closed */ }
          }
        }

        try {
          send("progress", { phase: "analyzing", message: "Analyzing your request..." });

          // Build the user prompt with project context
          let existingFiles: Array<{ path: string; content: string }> = [];
          try { existingFiles = JSON.parse(project.files); } catch { /* empty */ }

          const contextPrompt = existingFiles.length > 0
            ? `Current project files:\n${existingFiles.map(f => `- ${f.path}`).join("\n")}\n\nUser request: ${prompt}`
            : `New project. User request: ${prompt}`;

          send("progress", { phase: "generating", message: "Generating code..." });

          // Call AI (non-streaming for structured output)
          const aiResponse = await callWithFallback(
            db, user.id, CODEGEN_SYSTEM_PROMPT, contextPrompt, 16000, 0.7
          );

          send("progress", { phase: "parsing", message: "Parsing AI response..." });

          // Parse codegen response
          const codegenResult = parseCodegenResponse(aiResponse.textContent);

          if (!codegenResult || codegenResult.files.length === 0) {
            // Fall back to standard VF_PACK parsing
            const parsed = parseResponseText(aiResponse.textContent);
            if (parsed.hasVfPack && parsed.vfPack) {
              const changes = parsed.vfPack.files.map(f => ({ path: f.path, content: f.content, action: "create" as const }));
              send("progress", { phase: "writing", message: `Writing ${changes.length} files...` });
              const result = await applyFileChanges(projectId, changes, db);

              await db.run.update({
                where: { id: run.id },
                data: {
                  status: "done",
                  outputTextExcerpt: aiResponse.textContent.substring(0, 500),
                  usageInputTokens: aiResponse.inputTokens ?? null,
                  usageOutputTokens: aiResponse.outputTokens ?? null,
                  parseHasVfPack: true,
                  parseFileCount: changes.length,
                },
              });

              send("files", { changes, ...result });
              send("done", { runId: run.id, explanation: "Generated files from AI response" });
            } else {
              throw new Error("AI did not generate structured code output. Try rephrasing your request.");
            }
          } else {
            send("progress", { phase: "writing", message: `Writing ${codegenResult.files.length} files...` });

            const result = await applyFileChanges(projectId, codegenResult.files, db);

            await db.run.update({
              where: { id: run.id },
              data: {
                status: "done",
                outputTextExcerpt: codegenResult.explanation.substring(0, 500),
                usageInputTokens: aiResponse.inputTokens ?? null,
                usageOutputTokens: aiResponse.outputTokens ?? null,
                parseHasVfPack: true,
                parseFileCount: codegenResult.files.length,
              },
            });

            send("files", { changes: codegenResult.files, ...result });
            send("done", { runId: run.id, explanation: codegenResult.explanation });
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unexpected error";
          console.error("[Generate/Stream] Error:", err);

          await db.run.update({
            where: { id: run.id },
            data: { status: "error", error: message },
          }).catch(() => {});

          send("error", { message });
        } finally {
          close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  }
);

export { generateRouter };
