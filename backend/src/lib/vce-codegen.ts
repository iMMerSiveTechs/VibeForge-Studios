/**
 * VCE Code Generation Module
 *
 * Handles AI code generation for projects: prompt construction,
 * response parsing, and applying file changes to project records.
 */

export const CODEGEN_SYSTEM_PROMPT = `You are VibeForge, an expert React Native/Expo code generator. When given a prompt, generate code changes as a structured JSON response.

OUTPUT FORMAT (respond with ONLY this JSON, no other text):
{
  "files": [
    { "path": "app/index.tsx", "content": "full file content here", "action": "create" },
    { "path": "components/Button.tsx", "content": "updated content", "action": "update" },
    { "path": "old-file.tsx", "content": "", "action": "delete" }
  ],
  "explanation": "Brief explanation of what was done and why"
}

RULES:
- action must be "create", "update", or "delete"
- For "delete", content should be empty string
- Generate complete, working TypeScript/React Native code
- Use Expo Router for navigation, NativeWind for styling
- Include proper imports and type annotations
- Generate 5-20 files for new apps, 1-5 for modifications`;

interface CodegenFile {
  path: string;
  content: string;
  action: string;
}

interface CodegenResponse {
  files: CodegenFile[];
  explanation: string;
}

/**
 * Extract structured JSON from an AI response that may contain
 * markdown fences, preamble text, or raw JSON.
 */
export function parseCodegenResponse(text: string): CodegenResponse | null {
  // Strategy 1: Extract from markdown code fences (```json ... ``` or ``` ... ```)
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (fenceMatch) {
    try {
      const parsed = JSON.parse(fenceMatch[1]?.trim() ?? "");
      if (parsed && Array.isArray(parsed.files)) {
        return {
          files: parsed.files,
          explanation: parsed.explanation ?? "",
        };
      }
    } catch {
      // Fall through to next strategy
    }
  }

  // Strategy 2: Try parsing the entire text as JSON
  try {
    const parsed = JSON.parse(text.trim());
    if (parsed && Array.isArray(parsed.files)) {
      return {
        files: parsed.files,
        explanation: parsed.explanation ?? "",
      };
    }
  } catch {
    // Fall through to next strategy
  }

  // Strategy 3: Find a JSON object containing a "files" key via regex
  const objectMatch = text.match(/\{[\s\S]*"files"\s*:\s*\[[\s\S]*\][\s\S]*\}/);
  if (objectMatch) {
    try {
      const parsed = JSON.parse(objectMatch[0]);
      if (parsed && Array.isArray(parsed.files)) {
        return {
          files: parsed.files,
          explanation: parsed.explanation ?? "",
        };
      }
    } catch {
      // All strategies exhausted
    }
  }

  return null;
}

/**
 * Apply file changes (create/update/delete) to a project's stored files.
 *
 * Expects the project record to have a `files` column stored as a JSON string
 * representing a Record<string, string> of path -> content.
 */
export async function applyFileChanges(
  projectId: string,
  changes: CodegenFile[],
  db: any
): Promise<{ created: number; updated: number; deleted: number }> {
  // Fetch the project
  const project = await db.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new Error(`Project not found: ${projectId}`);
  }

  // Parse existing files
  let files: Record<string, string> = {};
  if (project.files) {
    try {
      files =
        typeof project.files === "string"
          ? JSON.parse(project.files)
          : project.files;
    } catch {
      files = {};
    }
  }

  const stats = { created: 0, updated: 0, deleted: 0 };

  for (const change of changes) {
    switch (change.action) {
      case "create":
        if (files[change.path] === undefined) {
          stats.created++;
        } else {
          stats.updated++;
        }
        files[change.path] = change.content;
        break;

      case "update":
        files[change.path] = change.content;
        stats.updated++;
        break;

      case "delete":
        if (files[change.path] !== undefined) {
          delete files[change.path];
          stats.deleted++;
        }
        break;
    }
  }

  // Save back to the project
  await db.project.update({
    where: { id: projectId },
    data: { files: JSON.stringify(files) },
  });

  return stats;
}
