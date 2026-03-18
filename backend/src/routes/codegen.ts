import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../prisma";
import { auth } from "../auth";
import { callWithFallback, type AIResponse } from "../lib/ai-utils";
import { applyFileChanges } from "../lib/vce-codegen";

const codegenRouter = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

// ---- System Prompt ----

const CODEGEN_V2_SYSTEM_PROMPT = `You are a React Native code generator for Expo SDK 53.
Generate complete, working React Native apps using:
- Functional components with hooks (useState, useEffect)
- StyleSheet.create for all styling
- expo-router for navigation if multiple screens
- Standard RN components: View, Text, TouchableOpacity, FlatList, TextInput, ScrollView, etc.

The entry point is always App.js with a default export.

CRITICAL: When the user asks for changes, modify ONLY what they asked for. Keep ALL other code exactly the same. Do not rewrite files that don't need changes.

In addition to real React Native files, ALWAYS generate a self-contained preview.html file that approximates the same UI and behavior for in-app preview. The preview.html should:
- Be a single HTML file with inline CSS and JavaScript
- Use a dark theme (#020203 background, #F0F0F0 text)
- Approximate the React Native layout using HTML/CSS
- Include interactive elements (buttons, inputs) where applicable
- Be visually similar to what the RN app would look like
- Include a console bridge: override console.log/error/warn to call window.ReactNativeWebView?.postMessage(JSON.stringify({type:'console',level,message}))

When applying follow-up prompts:
- Modify only the files that need changing
- Preserve all unrelated files
- Always update preview.html to reflect the same changes

Respond with ONLY valid JSON (no markdown, no backticks):
{
  "files": [
    {
      "path": "App.js",
      "content": "full file content here",
      "action": "create" | "update" | "delete"
    }
  ],
  "explanation": "1-2 sentence description of what changed"
}`;

// ---- Helpers ----

interface CodegenFile {
  path: string;
  content: string;
  action: string;
}

interface CodegenResult {
  files: CodegenFile[];
  explanation: string;
}

/**
 * Parse AI response as JSON with 3 fallback strategies:
 * 1. Direct JSON.parse
 * 2. Markdown fence extraction
 * 3. Find first { to last }
 */
function parseCodegenJSON(text: string): CodegenResult | null {
  // Strategy 1: Direct JSON.parse
  try {
    const parsed = JSON.parse(text.trim());
    if (parsed && Array.isArray(parsed.files)) {
      return { files: parsed.files, explanation: parsed.explanation ?? "" };
    }
  } catch {
    // fall through
  }

  // Strategy 2: Markdown fence extraction
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (fenceMatch?.[1]) {
    try {
      const parsed = JSON.parse(fenceMatch[1].trim());
      if (parsed && Array.isArray(parsed.files)) {
        return { files: parsed.files, explanation: parsed.explanation ?? "" };
      }
    } catch {
      // fall through
    }
  }

  // Strategy 3: Find first { to last }
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      const parsed = JSON.parse(text.substring(firstBrace, lastBrace + 1));
      if (parsed && Array.isArray(parsed.files)) {
        return { files: parsed.files, explanation: parsed.explanation ?? "" };
      }
    } catch {
      // all strategies exhausted
    }
  }

  return null;
}

/**
 * Build the user prompt with conversation history and current project files.
 */
function buildUserPrompt(
  history: Array<{ role: string; content: string }>,
  projectFiles: Record<string, string>,
  currentPrompt: string
): string {
  const parts: string[] = [];

  // Conversation history
  if (history.length > 0) {
    parts.push("Previous conversation:");
    for (const msg of history) {
      const role = msg.role === "user" ? "User" : "Assistant";
      parts.push(`${role}: ${msg.content}`);
    }
    parts.push("");
  }

  // Current project files
  const filePaths = Object.keys(projectFiles);
  if (filePaths.length > 0) {
    parts.push("Current project files:");
    for (const filePath of filePaths) {
      parts.push(`--- ${filePath} ---`);
      parts.push(projectFiles[filePath] ?? "");
      parts.push("");
    }
  }

  parts.push(`User request: ${currentPrompt}`);

  return parts.join("\n");
}

// ---- POST /api/codegen/:projectId ----

codegenRouter.post(
  "/:projectId",
  zValidator(
    "json",
    z.object({
      prompt: z.string().min(1),
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

    const projectId = c.req.param("projectId");
    const { prompt } = c.req.valid("json");

    // Verify project ownership
    const project = await db.project.findUnique({
      where: { id: projectId },
    });
    if (!project || project.userId !== user.id) {
      return c.json(
        { error: { message: "Project not found", code: "NOT_FOUND" } },
        404
      );
    }

    // Load project files
    let projectFiles: Record<string, string> = {};
    try {
      const parsed = JSON.parse(project.files);
      if (Array.isArray(parsed)) {
        // Array format: [{path, content}, ...]
        for (const f of parsed) {
          if (f.path && typeof f.content === "string") {
            projectFiles[f.path] = f.content;
          }
        }
      } else if (typeof parsed === "object" && parsed !== null) {
        // Object format: {path: content, ...}
        projectFiles = parsed;
      }
    } catch {
      projectFiles = {};
    }

    // Load last 10 GenerationMessages
    const history = await db.generationMessage.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
      take: 10,
      select: { role: true, content: true },
    });

    // Build prompt
    const userPrompt = buildUserPrompt(history, projectFiles, prompt);

    try {
      // Call AI via callWithFallback
      const aiResponse: AIResponse & { usedModel: string } =
        await callWithFallback(
          db,
          user.id,
          CODEGEN_V2_SYSTEM_PROMPT,
          userPrompt,
          16000,
          0.7
        );

      if (!aiResponse.textContent || aiResponse.textContent.trim().length === 0) {
        throw new Error("AI returned an empty response. Please try again.");
      }

      // Parse the JSON response with 3 fallbacks
      const parsed = parseCodegenJSON(aiResponse.textContent);
      if (!parsed || parsed.files.length === 0) {
        throw new Error(
          "AI did not return valid structured code. Try rephrasing your request."
        );
      }

      // Apply file changes
      const stats = await applyFileChanges(projectId, parsed.files, db);

      // Save conversation messages
      await db.generationMessage.createMany({
        data: [
          { projectId, role: "user", content: prompt },
          {
            projectId,
            role: "assistant",
            content: parsed.explanation || "Code generated successfully.",
          },
        ],
      });

      // Track usage: upsert UsageRecord for today
      try {
        const responseText = aiResponse.textContent ?? "";
        const tokenCount = Math.ceil(responseText.length / 4);
        const today = new Date().toISOString().split("T")[0]!;
        await db.usageRecord.upsert({
          where: { userId_date: { userId: user.id, date: today } },
          update: {
            tokensUsed: { increment: tokenCount },
            requestCount: { increment: 1 },
          },
          create: {
            userId: user.id,
            date: today,
            tokensUsed: tokenCount,
            requestCount: 1,
          },
        });
      } catch (usageErr) {
        console.error("[Codegen] Failed to track usage:", usageErr);
      }

      // Reload project to get updated files
      const updatedProject = await db.project.findUnique({
        where: { id: projectId },
      });

      // Build changedFiles list
      const changedFiles = parsed.files.map((f) => f.path);

      // Parse allFiles from updated project
      let allFiles: Record<string, string> = {};
      if (updatedProject?.files) {
        try {
          const pf = JSON.parse(updatedProject.files);
          if (typeof pf === "object" && pf !== null) {
            allFiles = pf;
          }
        } catch {
          // ignore
        }
      }

      return c.json({
        data: {
          changedFiles,
          explanation: parsed.explanation,
          allFiles: Object.keys(allFiles),
          created: stats.created,
          updated: stats.updated,
          deleted: stats.deleted,
        },
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error occurred";
      console.error("[Codegen] Error:", err);
      return c.json(
        { error: { message, code: "CODEGEN_ERROR" } },
        500
      );
    }
  }
);

// ---- GET /api/codegen/:projectId/history ----

codegenRouter.get("/:projectId/history", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json(
      { error: { message: "Unauthorized", code: "UNAUTHORIZED" } },
      401
    );
  }

  const projectId = c.req.param("projectId");

  // Verify project ownership
  const project = await db.project.findUnique({
    where: { id: projectId },
  });
  if (!project || project.userId !== user.id) {
    return c.json(
      { error: { message: "Project not found", code: "NOT_FOUND" } },
      404
    );
  }

  const messages = await db.generationMessage.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
  });

  return c.json({ data: messages });
});

export { codegenRouter };
