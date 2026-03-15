import { auth } from "../auth";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../prisma";
import {
  DEFAULT_SYSTEM_PROMPT,
  detectProvider,
  parseResponseText,
  callAnthropicAPI,
  callOpenAIAPI,
  callGeminiAPI,
  callWithFallback,
  type AIResponse,
} from "../lib/ai-utils";

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

export { generateRouter };
