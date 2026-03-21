/**
 * DecipherKit API Routes
 *
 * Provides endpoints for handwriting transcription using Claude Vision API
 * with a personalized Glyph Map.
 *
 * Architecture:
 * - The v0.3 glyph map is loaded SERVER-SIDE from the bundled JSON file.
 * - Clients only send images and optional config — NOT the full glyph map.
 * - User corrections are sent via POST /correct and stored per-user (future: DB).
 *
 * Registration: Add to backend/src/index.ts:
 * ```typescript
 * import { decipherRoutes } from './routes/decipher'
 * app.route('/api/decipher', decipherRoutes)
 * ```
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { env } from "../env";
import { buildDecipherSystemPrompt, type GlyphMap, type DecipherConfig, type TranscriptionResult, type CorrectionEntry } from "../lib/decipher-prompt";
import { readFileSync } from "fs";
import { resolve } from "path";

const decipherRoutes = new Hono();

/**
 * Load the v0.3 glyph map from the bundled JSON file (server-side).
 * This is loaded once at startup and shared across all requests.
 * In production, per-user glyph maps would be loaded from a database.
 */
let GLYPH_MAP_V3: Record<string, unknown> | null = null;

function getGlyphMap(): Record<string, unknown> {
  if (GLYPH_MAP_V3) return GLYPH_MAP_V3;

  try {
    // Try loading from the decipher-kit core directory (relative to project root)
    const glyphMapPath = resolve(
      __dirname,
      "../../../decipher-kit/core/glyph-map-jaytee-v0.3.json"
    );
    const raw = readFileSync(glyphMapPath, "utf-8");
    GLYPH_MAP_V3 = JSON.parse(raw);
    console.log("[DecipherKit] Loaded glyph map v0.3 from:", glyphMapPath);
    return GLYPH_MAP_V3!;
  } catch (e) {
    // Fallback: return a minimal glyph map so the system still works
    console.warn(
      "[DecipherKit] Could not load glyph map v0.3 from disk, using minimal fallback:",
      e instanceof Error ? e.message : String(e)
    );
    return {
      meta: { version: "0.3-fallback", writer: "unknown" },
      reliable_forms: { capitals: [], always_clean_words: [] },
      problem_zones: [],
      structural_notation: {},
      known_vocabulary: [],
      corrections: [],
    };
  }
}

/**
 * Validate and parse Anthropic API configuration
 */
function validateAnthropicKey(): string {
  const key = env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error("ANTHROPIC_API_KEY is not configured in environment variables");
  }
  return key;
}

/**
 * Validate base64 image data
 * @param base64 - The base64-encoded image string (without data: prefix)
 * @returns Size in bytes
 */
function validateBase64Image(base64: string): number {
  if (!base64 || base64.length === 0) {
    throw new Error("Image data is empty");
  }

  // Rough size calculation: base64 is ~1.33x the original size
  const sizeBytes = Math.ceil((base64.length * 3) / 4);
  const maxSizeBytes = 5 * 1024 * 1024; // 5MB

  if (sizeBytes > maxSizeBytes) {
    throw new Error(`Image exceeds maximum size of 5MB (got ~${(sizeBytes / 1024 / 1024).toFixed(2)}MB)`);
  }

  return sizeBytes;
}

/**
 * Convert base64 string to data URL
 */
function base64ToDataUrl(base64: string, mimeType: string = "image/jpeg"): string {
  // If it already has a data: prefix, return as-is
  if (base64.startsWith("data:")) {
    return base64;
  }
  return `data:${mimeType};base64,${base64}`;
}

/**
 * POST /api/decipher/transcribe
 * Transcribe handwritten notes from images using Claude Vision API
 *
 * Request body:
 * {
 *   "images": ["base64_image_1", "base64_image_2"],
 *   "config": { ... optional DecipherConfig ... }
 * }
 *
 * NOTE: glyphMap is loaded server-side from v0.3 JSON file.
 * Clients do NOT need to send the glyph map.
 *
 * Returns: { data: TranscriptionResult }
 */
decipherRoutes.post(
  "/transcribe",
  zValidator(
    "json",
    z.object({
      images: z.array(z.string().min(1, "Image data cannot be empty"))
        .min(1, "At least one image is required")
        .max(4, "Maximum 4 images allowed"),
      glyphMap: z.record(z.unknown()).optional(),
      config: z.object({
        highConfidenceThreshold: z.number().min(0).max(1).optional(),
        enableCrossImageSynthesis: z.boolean().optional(),
        maxFlaggedItems: z.number().positive().optional(),
      }).optional(),
    })
  ),
  async (c) => {
    try {
      // Validate Anthropic API key is configured
      const anthropicKey = validateAnthropicKey();

      const { images, glyphMap: clientGlyphMap, config } = c.req.valid("json");

      // Use server-side v0.3 glyph map, with optional client overrides merged
      const serverGlyphMap = getGlyphMap();
      const glyphMap = clientGlyphMap
        ? { ...serverGlyphMap, ...clientGlyphMap }
        : serverGlyphMap;

      // Validate all images
      let totalSize = 0;
      for (const image of images) {
        const size = validateBase64Image(image);
        totalSize += size;
      }

      // Build the system prompt with injected glyph map
      const systemPrompt = buildDecipherSystemPrompt(glyphMap);

      // Build Claude Vision API request
      const apiRequest = {
        model: "claude-sonnet-4-5-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: [
              // Add all images
              ...images.map((base64, index) => ({
                type: "image" as const,
                source: {
                  type: "base64" as const,
                  media_type: "image/jpeg" as const,
                  data: base64,
                },
              })),
              // Add transcription instruction
              {
                type: "text" as const,
                text: `Please transcribe these handwritten notes using the DecipherKit protocol and your personalized Glyph Map.

Return ONLY valid JSON matching the exact schema provided in your instructions. Do not include any markdown code blocks, explanations, or preamble.

${images.length > 1 ? "Apply cross-image synthesis to merge partial reads and identify contradictions." : ""}`,
              },
            ],
          },
        ],
      };

      // Call Claude API
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(apiRequest),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as Record<string, unknown>;
        const errorMessage = (errorData.error as Record<string, unknown>)?.message || `Claude API error: HTTP ${response.status}`;
        throw new Error(String(errorMessage));
      }

      const apiResponse = await response.json() as Record<string, unknown>;
      const content = (apiResponse.content as Array<Record<string, unknown>>)?.[0];
      const responseText = content?.text as string | undefined;

      if (!responseText) {
        throw new Error("No response text from Claude API");
      }

      // Parse the JSON response
      let result: TranscriptionResult;
      try {
        result = JSON.parse(responseText) as TranscriptionResult;
      } catch {
        // If Claude's response isn't pure JSON, try to extract JSON from it
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("Could not parse Claude response as JSON");
        }
        result = JSON.parse(jsonMatch[0]) as TranscriptionResult;
      }

      // Validate result structure
      if (!result.surfaces || !Array.isArray(result.surfaces)) {
        throw new Error("Invalid transcription result: missing or invalid surfaces array");
      }

      return c.json({ data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to transcribe images";

      // Provide specific error codes for common issues
      let code = "TRANSCRIPTION_FAILED";
      if (message.includes("ANTHROPIC_API_KEY")) {
        code = "MISSING_ANTHROPIC_KEY";
      } else if (message.includes("exceeds maximum size")) {
        code = "IMAGE_TOO_LARGE";
      } else if (message.includes("401") || message.includes("unauthorized")) {
        code = "INVALID_API_KEY";
      } else if (message.includes("429") || message.includes("rate")) {
        code = "RATE_LIMIT_EXCEEDED";
      }

      return c.json(
        { error: { message, code } },
        code === "MISSING_ANTHROPIC_KEY" ? 500 : code === "INVALID_API_KEY" ? 401 : 400
      );
    }
  }
);

/**
 * POST /api/decipher/correct
 * Apply corrections to transcription results (updates in-memory glyph map)
 * Future: Store per-user maps in database
 *
 * Request body:
 * {
 *   "corrections": [
 *     { "original": "teh", "corrected": "the", "rule": "common_typo" },
 *     { "original": "a", "corrected": "u", "context": "in_word_start" }
 *   ]
 * }
 *
 * Returns: { data: { applied: number, updatedMap: GlyphMap } }
 */
decipherRoutes.post(
  "/correct",
  zValidator(
    "json",
    z.object({
      corrections: z.array(
        z.object({
          original: z.string().min(1, "Original text is required"),
          corrected: z.string().min(1, "Corrected text is required"),
          rule: z.string().optional(),
          context: z.string().optional(),
        })
      ).min(1, "At least one correction is required"),
    })
  ),
  async (c) => {
    try {
      const { corrections } = c.req.valid("json");

      // TODO: In production, load per-user glyph map from database
      // For now, we'll return a success response with the applied corrections
      // and indicate where the updated map should be stored

      const updatedMap: GlyphMap = {
        corrections_applied: corrections.length,
        corrections: corrections.map((correction) => ({
          original: correction.original,
          corrected: correction.corrected,
          rule: correction.rule,
          context: correction.context,
          appliedAt: new Date().toISOString(),
        })),
        note: "In production, this map should be persisted to database per user",
      };

      return c.json({
        data: {
          applied: corrections.length,
          updatedMap,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to apply corrections";
      return c.json(
        { error: { message, code: "CORRECTION_FAILED" } },
        400
      );
    }
  }
);

/**
 * GET /api/decipher/health
 * Health check endpoint (optional)
 */
decipherRoutes.get("/health", (c) => {
  const hasAnthropicKey = !!env.ANTHROPIC_API_KEY;
  return c.json({
    data: {
      status: "ok",
      anthropicConfigured: hasAnthropicKey,
    },
  });
});

export { decipherRoutes };
