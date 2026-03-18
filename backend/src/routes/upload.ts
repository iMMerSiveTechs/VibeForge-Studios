import { Hono } from "hono";
import { db } from "../prisma";
import JSZip from "jszip";
import { auth } from "../auth";
import {
  parseResponseText,
  callWithFallback,
  CODE_ANALYSIS_SYSTEM_PROMPT,
} from "../lib/ai-utils";

// Size guard constants
const MAX_UPLOAD_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_ZIP_ENTRIES = 100;
const MAX_ZIP_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file
const MAX_ZIP_TOTAL_SIZE = 100 * 1024 * 1024; // 100MB total decompressed
const ZIP_TIMEOUT_MS = 30_000; // 30s timeout for zip extraction

const uploadRouter = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

// POST /api/projects/:id/upload-zip
// Accepts multipart/form-data with a "file" field containing a zip
uploadRouter.post("/:id/upload-zip", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const projectId = c.req.param("id");

  // Verify project exists and belongs to user
  const project = await db.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return c.json(
      { error: { message: "Project not found", code: "NOT_FOUND" } },
      404
    );
  }
  if (project.userId !== user.id) {
    return c.json(
      { error: { message: "Project not found", code: "NOT_FOUND" } },
      404
    );
  }

  // Parse the multipart form data
  const formData = await c.req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return c.json(
      { error: { message: "No zip file provided", code: "MISSING_FILE" } },
      400
    );
  }

  // Size guard: reject files larger than 50MB
  if (file.size > MAX_UPLOAD_SIZE) {
    return c.json(
      { error: { message: "File exceeds 50MB limit", code: "PAYLOAD_TOO_LARGE" } },
      413
    );
  }

  // Validate it's a zip
  if (
    !file.name.endsWith(".zip") &&
    file.type !== "application/zip" &&
    file.type !== "application/x-zip-compressed"
  ) {
    return c.json(
      {
        error: {
          message: "File must be a .zip archive",
          code: "INVALID_FILE_TYPE",
        },
      },
      400
    );
  }

  try {
    // Read the zip contents
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Count entries and enforce max entries limit
    let entryCount = 0;
    zip.forEach((relativePath, zipEntry) => {
      if (!zipEntry.dir) entryCount++;
    });
    if (entryCount > MAX_ZIP_ENTRIES) {
      return c.json(
        { error: { message: `Zip contains too many files (${entryCount}). Maximum is ${MAX_ZIP_ENTRIES}.`, code: "ZIP_TOO_MANY_ENTRIES" } },
        400
      );
    }

    const extractedFiles: Array<{ path: string; content: string }> = [];
    const artifacts: Array<{
      kind: string;
      title: string;
      filePath: string;
    }> = [];
    let vfAppSpec: string | null = null;
    let totalDecompressedBytes = 0;

    // Process each file in the zip with a timeout
    const filePromises: Promise<void>[] = [];

    zip.forEach((relativePath, zipEntry) => {
      // Skip directories and hidden files
      if (zipEntry.dir) return;
      if (relativePath.startsWith("__MACOSX/")) return;
      if (relativePath.startsWith(".")) return;
      // Path traversal protection
      if (relativePath.includes("..") || relativePath.startsWith("/")) return;

      filePromises.push(
        zipEntry
          .async("text")
          .then((content) => {
            const contentBytes = Buffer.byteLength(content, "utf8");

            // Per-file size guard
            if (contentBytes > MAX_ZIP_FILE_SIZE) {
              extractedFiles.push({
                path: relativePath,
                content: `[File too large - ${zipEntry.name} (${(contentBytes / 1024 / 1024).toFixed(1)}MB)]`,
              });
              return;
            }

            // Track total decompressed size and bail if exceeded
            totalDecompressedBytes += contentBytes;
            if (totalDecompressedBytes > MAX_ZIP_TOTAL_SIZE) {
              throw new Error("ZIP_TOTAL_SIZE_EXCEEDED");
            }

            const cleanPath = relativePath;

            extractedFiles.push({
              path: cleanPath,
              content: content,
            });

            // Determine artifact kind
            const ext = cleanPath.split(".").pop()?.toLowerCase() ?? "";
            let kind: string = "code";
            if (ext === "html" || ext === "htm") kind = "html";
            else if (ext === "md" || ext === "markdown") kind = "md";

            artifacts.push({
              kind,
              title: cleanPath.split("/").pop() ?? cleanPath,
              filePath: cleanPath,
            });

            // Check if this file contains a VF_APP spec
            if (
              cleanPath.endsWith(".json") ||
              cleanPath.includes("vf_app") ||
              cleanPath.includes("VF_APP")
            ) {
              try {
                const parsed = JSON.parse(content);
                if (
                  parsed &&
                  typeof parsed === "object" &&
                  "name" in parsed &&
                  "start" in parsed &&
                  "screens" in parsed
                ) {
                  vfAppSpec = content;
                }
              } catch {
                // Not valid JSON, skip
              }
            }
          })
          .catch((err) => {
            if (err instanceof Error && err.message === "ZIP_TOTAL_SIZE_EXCEEDED") {
              throw err;
            }
            // Binary file or read error - skip it but note it
            extractedFiles.push({
              path: relativePath,
              content: `[Binary file - ${zipEntry.name}]`,
            });
          })
      );
    });

    // Enforce 30s timeout for zip extraction
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("ZIP_EXTRACTION_TIMEOUT")), ZIP_TIMEOUT_MS)
    );

    try {
      await Promise.race([Promise.all(filePromises), timeoutPromise]);
    } catch (err) {
      if (err instanceof Error && err.message === "ZIP_EXTRACTION_TIMEOUT") {
        return c.json(
          { error: { message: "Zip extraction timed out", code: "ZIP_EXTRACTION_TIMEOUT" } },
          408
        );
      }
      if (err instanceof Error && err.message === "ZIP_TOTAL_SIZE_EXCEEDED") {
        return c.json(
          { error: { message: "Zip decompressed size exceeds 100MB limit", code: "ZIP_TOTAL_SIZE_EXCEEDED" } },
          400
        );
      }
      throw err;
    }

    // Sort files by path for consistent ordering
    extractedFiles.sort((a, b) => a.path.localeCompare(b.path));

    // Also try to detect VF_APP from any .json file in root
    if (!vfAppSpec) {
      for (const f of extractedFiles) {
        if (f.path.endsWith(".json") && !f.path.includes("/")) {
          try {
            const parsed = JSON.parse(f.content);
            if (
              parsed &&
              typeof parsed === "object" &&
              "name" in parsed &&
              "start" in parsed &&
              "screens" in parsed
            ) {
              vfAppSpec = f.content;
              break;
            }
          } catch {
            // skip
          }
        }
      }
    }

    // Update the project with extracted files
    const updateData: {
      files: string;
      artifacts: string;
      vfAppSpec?: string;
    } = {
      files: JSON.stringify(extractedFiles),
      artifacts: JSON.stringify(artifacts),
    };

    if (vfAppSpec) {
      updateData.vfAppSpec = vfAppSpec;
    }

    const updatedProject = await db.project.update({
      where: { id: projectId },
      data: updateData,
    });

    return c.json({
      data: {
        project: updatedProject,
        extracted: {
          fileCount: extractedFiles.length,
          hasVfApp: !!vfAppSpec,
          files: extractedFiles.map((f) => f.path),
        },
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to process zip file";
    return c.json(
      { error: { message, code: "ZIP_PROCESSING_ERROR" } },
      500
    );
  }
});

// POST /api/projects/:id/analyze-zip
// Analyzes extracted zip files using AI to generate a VF_APP spec
uploadRouter.post("/:id/analyze-zip", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const projectId = c.req.param("id");

  // Load project and verify ownership
  const project = await db.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return c.json({ error: { message: "Project not found", code: "NOT_FOUND" } }, 404);
  }
  if (project.userId !== user.id) {
    return c.json({ error: { message: "Project not found", code: "NOT_FOUND" } }, 404);
  }

  // Parse stored files
  if (!project.files) {
    return c.json({ error: { message: "No files to analyze. Upload a zip first.", code: "NO_FILES" } }, 400);
  }

  let storedFiles: Array<{ path: string; content: string }>;
  try {
    storedFiles = JSON.parse(project.files);
  } catch {
    return c.json({ error: { message: "Failed to parse stored files", code: "PARSE_ERROR" } }, 400);
  }

  if (!storedFiles.length) {
    return c.json({ error: { message: "No files to analyze. Upload a zip first.", code: "NO_FILES" } }, 400);
  }

  // Parse optional body params
  let bodyParams: { maxTokens?: number } = {};
  try {
    bodyParams = await c.req.json();
  } catch {
    // No body is fine
  }

  const maxTokens = bodyParams.maxTokens ?? 16000;
  const temperature = 0.3;

  // Build smart source bundle with token budget
  const SKIP_PATTERNS = [
    /node_modules\//,
    /\.git\//,
    /\.(png|jpg|jpeg|gif|svg|ico|webp|ttf|otf|woff|eot|mp4|mp3|wav)$/i,
    /(package-lock\.json|bun\.lock|yarn\.lock|pnpm-lock\.yaml)$/,
    /\[Binary file/,
    /(dist|build|\.expo|\.next|\.cache)\//,
    /\.(DS_Store|class|pyc)$/,
  ];
  const SOURCE_PATTERNS = [/\.(ts|tsx|js|jsx|json|md|py|swift|kt|dart)$/i];

  const MAX_FILE_CHARS = 4000;
  const MAX_TOTAL_CHARS = maxTokens * 2; // rough budget: leave half for output

  const sourceFiles = storedFiles.filter(f =>
    !SKIP_PATTERNS.some(p => p.test(f.path)) &&
    SOURCE_PATTERNS.some(p => p.test(f.path)) &&
    !f.content.startsWith("[Binary file")
  );

  // Sort smallest first to maximize number of files analyzed
  sourceFiles.sort((a, b) => a.content.length - b.content.length);

  let totalChars = 0;
  const includedParts: string[] = [];
  let skippedCount = 0;

  for (const file of sourceFiles) {
    if (totalChars >= MAX_TOTAL_CHARS) {
      skippedCount++;
      continue;
    }
    const content = file.content.length > MAX_FILE_CHARS
      ? file.content.substring(0, MAX_FILE_CHARS) + "\n... [truncated]"
      : file.content;
    includedParts.push(`=== FILE: ${file.path} ===\n${content}`);
    totalChars += content.length;
  }

  if (skippedCount > 0) {
    includedParts.push(`\n[${skippedCount} additional files omitted due to token limits]`);
  }

  const sourceBundle = includedParts.join("\n\n");
  const userPrompt = `Analyze these source files and generate a VF_APP spec:\n\n${sourceBundle}`;

  // Create run record
  const run = await db.run.create({
    data: {
      projectId,
      status: "running",
      inputSystem: CODE_ANALYSIS_SYSTEM_PROMPT,
      inputUser: `[ZIP ANALYSIS: ${storedFiles.length} files] ${userPrompt.substring(0, 200)}...`,
      inputModel: "auto",
      inputMaxTokens: maxTokens,
      inputTemperature: temperature,
    },
  });

  try {
    const aiResponseWithModel = await callWithFallback(db, user.id, CODE_ANALYSIS_SYSTEM_PROMPT, userPrompt, maxTokens, temperature);
    const aiResponse = aiResponseWithModel;

    const { textContent, inputTokens, outputTokens } = aiResponse;
    const parsed = parseResponseText(textContent);

    const projectUpdate: Record<string, unknown> = { sourceRunId: run.id };
    if (parsed.hasVfApp && parsed.vfApp) {
      projectUpdate.vfAppSpec = JSON.stringify(parsed.vfApp);
    }
    if (parsed.hasVfPack && parsed.vfPack) {
      projectUpdate.files = JSON.stringify(parsed.vfPack.files);
    }

    const updatedProject = await db.project.update({
      where: { id: projectId },
      data: projectUpdate,
    });

    const updatedRun = await db.run.update({
      where: { id: run.id },
      data: {
        status: "done",
        outputTextExcerpt: textContent.substring(0, 500),
        usageInputTokens: inputTokens ?? null,
        usageOutputTokens: outputTokens ?? null,
        parseHasVfApp: parsed.hasVfApp,
        parseHasVfPack: parsed.hasVfPack,
        parseFileCount: parsed.fileCount,
      },
    });

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
    const errorMessage = err instanceof Error ? err.message : "Analysis failed";
    await db.run.update({
      where: { id: run.id },
      data: { status: "error", error: errorMessage },
    });
    return c.json({ error: { message: errorMessage, code: "ANALYSIS_ERROR" } }, 500);
  }
});

export { uploadRouter };
