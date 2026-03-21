/**
 * DecipherKit Engine
 * Core transcription engine that calls backend API and applies local corrections
 *
 * Architecture:
 * - Backend loads the v0.3 glyph map server-side (not sent from client each time)
 * - Client sends images as base64 strings + optional user corrections
 * - Backend returns structured TranscriptionResult
 * - Client normalizes confidence levels and applies any local post-processing
 */

import { api } from "@/lib/api/api";
import {
  TranscriptionResult,
  Surface,
  GlyphMap,
  DecipherConfig,
  ConfidenceLevel,
  CorrectionEntry,
} from "./types";
import { prepareImageForApi } from "./image-preprocessor";

/**
 * Default configuration for transcription
 */
export const DEFAULT_DECIPHER_CONFIG: DecipherConfig = {
  maxImagesPerBatch: 4,
  imageCompressionQuality: 0.8,
  maxImageSizeBytes: 1024 * 1024, // 1MB
  enableGlyphMapCorrection: true,
  enableProblemZoneDetection: true,
  enableStructuralAnalysis: true,
  confidenceThreshold: ConfidenceLevel.MEDIUM,
  autoFlagLowConfidence: true,
  requestTimeout: 30000, // 30 seconds
};

/**
 * Normalize confidence strings from API to enum
 * Backend returns "HIGH"/"MEDIUM"/"LOW"/"FLAG", we normalize to lowercase enum
 */
function normalizeConfidence(confidence: string): ConfidenceLevel {
  const normalized = (confidence?.toLowerCase() ?? "medium") as string;
  if (Object.values(ConfidenceLevel).includes(normalized as ConfidenceLevel)) {
    return normalized as ConfidenceLevel;
  }
  return ConfidenceLevel.MEDIUM;
}

/**
 * Strip data URI prefix from base64 string
 * Backend expects raw base64 without "data:image/jpeg;base64," prefix
 */
function stripBase64Prefix(base64: string): string {
  if (base64.startsWith("data:")) {
    return base64.split(",")[1] || base64;
  }
  return base64;
}

/**
 * Transcribe images using backend API
 *
 * Flow:
 * 1. Prepare images (compress, convert to base64)
 * 2. POST to /api/decipher/transcribe with raw base64 strings
 * 3. Backend loads v0.3 glyph map server-side and calls Claude Vision
 * 4. Normalize response and apply any local corrections
 *
 * @param imageUris Array of image URIs to transcribe
 * @param glyphMap User's local glyph map for post-processing (optional)
 * @param config Configuration options
 * @returns Transcription result with surfaces and metadata
 */
export async function transcribeImages(
  imageUris: string[],
  glyphMap: GlyphMap | null,
  config: DecipherConfig = DEFAULT_DECIPHER_CONFIG
): Promise<TranscriptionResult> {
  if (imageUris.length === 0) {
    throw new Error("No images provided for transcription");
  }

  if (imageUris.length > config.maxImagesPerBatch) {
    throw new Error(
      `Too many images. Maximum ${config.maxImagesPerBatch} allowed.`
    );
  }

  const startTime = new Date();

  try {
    // Prepare all images in parallel
    console.log(`[Decipher] Preparing ${imageUris.length} image(s) for API...`);
    const preparedImages = await Promise.all(
      imageUris.map((uri) => prepareImageForApi(uri))
    );

    // Build request payload matching backend's expected schema:
    // POST /api/decipher/transcribe
    // { images: string[], config?: { highConfidenceThreshold, enableCrossImageSynthesis, maxFlaggedItems } }
    //
    // NOTE: glyphMap is NOT sent from client — backend loads v0.3 server-side.
    // User corrections are sent separately via POST /api/decipher/correct.
    const requestPayload = {
      images: preparedImages.map((img) => stripBase64Prefix(img.base64)),
      config: {
        enableCrossImageSynthesis: imageUris.length > 1,
        highConfidenceThreshold: 0.9,
      },
    };

    console.log("[Decipher] Sending transcription request to backend...");

    // Call backend API — route is /api/decipher/transcribe
    // api.post auto-unwraps { data: T } envelope per API contract
    const apiResponse = await api.post<{
      images_analyzed: number;
      surfaces: any[];
      cross_image_synthesis?: any[];
      flagged_items?: any[];
      glyph_map_corrections_applied?: any[];
      confidence_gate_log?: any[];
    }>("/api/decipher/transcribe", requestPayload);

    console.log("[Decipher] Received response from backend");

    if (!apiResponse.surfaces) {
      throw new Error("Invalid API response: missing surfaces");
    }

    // Map backend surface format to mobile Surface type
    const surfaces: Surface[] = apiResponse.surfaces.map((surface: any, idx: number) => ({
      id: surface.id || `surface-${idx + 1}`,
      imageIndex: idx,
      dominantColor: surface.color || preparedImages[idx]?.dominantColor,
      transcribedText: surface.transcription?.text || "",
      confidence: normalizeConfidence(surface.transcription?.confidence || "medium"),
      problemZones: [],
      structuralNotations: (surface.structural_notation || []).map((n: any, nIdx: number) => ({
        id: `notation-${idx}-${nIdx}`,
        type: n.type || "other",
        content: n.description || "",
        position: { x: 0, y: 0 },
        significance: "supporting" as const,
      })),
      failureModes: [],
      tokens: surface.transcription?.text
        ? surface.transcription.text.split(/\s+/).map((word: string, wIdx: number) => ({
            id: `token-${idx}-${wIdx}`,
            text: word,
            confidence: normalizeConfidence(surface.transcription?.confidence || "medium"),
            position: { x: 0, y: 0, width: 0, height: 0 },
            glyphIds: [],
          }))
        : [],
      metadata: {
        imageSize: { width: 0, height: 0 },
        detectedOrientation: preparedImages[idx]?.orientation || 0,
        processingTime: 0,
      },
    }));

    // Apply local glyph map corrections if available
    if (config.enableGlyphMapCorrection && glyphMap) {
      console.log("[Decipher] Applying local glyph map corrections...");
      applyGlyphMapCorrections(surfaces, glyphMap);
    }

    const endTime = new Date();

    // Build final result
    const result: TranscriptionResult = {
      id: `result_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      surfaces,
      spatialRelations: (surface => {
        // Map cross-image synthesis to spatial relations
        return (apiResponse.cross_image_synthesis || []).map((syn: any, sIdx: number) => ({
          id: `spatial-${sIdx}`,
          type: "groupedWith" as const,
          firstElementId: syn.mergedFrom?.[0] || "",
          secondElementId: syn.mergedFrom?.[1] || "",
          confidence: 0.8,
        }));
      })(null),
      flaggedItems: (apiResponse.flagged_items || []).map((f: any, fIdx: number) => ({
        id: `flag-${fIdx}`,
        surfaceId: f.surfaceId || "",
        reason: f.reason || "",
        text: f.candidates?.join(" / ") || "",
        position: { x: 0, y: 0 },
        createdAt: new Date(),
        reviewed: false,
      })),
      overallConfidence: surfaces.length > 0
        ? surfaces.reduce((worst, s) => {
            const order = [ConfidenceLevel.FLAG, ConfidenceLevel.LOW, ConfidenceLevel.MEDIUM, ConfidenceLevel.HIGH];
            return order.indexOf(s.confidence) < order.indexOf(worst) ? s.confidence : worst;
          }, ConfidenceLevel.HIGH)
        : ConfidenceLevel.MEDIUM,
      metadata: {
        totalImagesProcessed: imageUris.length,
        totalTokens: surfaces.reduce((sum, s) => sum + (s.tokens?.length || 0), 0),
        processingStartTime: startTime,
        processingEndTime: endTime,
        elapsedMs: endTime.getTime() - startTime.getTime(),
      },
    };

    console.log(
      `[Decipher] Transcription complete in ${result.metadata.elapsedMs}ms`
    );
    return result;
  } catch (error) {
    console.error("[Decipher] Transcription failed:", error);
    throw new Error(
      `Transcription failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Apply known glyph corrections to transcription result
 * Post-processes surfaces based on user's local glyph map
 */
function applyGlyphMapCorrections(
  surfaces: Surface[],
  glyphMap: GlyphMap
): void {
  surfaces.forEach((surface) => {
    if (!surface.tokens) return;

    surface.tokens.forEach((token) => {
      const cleanText = token.text.toLowerCase().trim();

      // Check if any glyphs in map match this token
      Object.entries(glyphMap.glyphs).forEach(([_glyphId, glyph]) => {
        if (
          glyph.character === cleanText &&
          glyph.confidence === ConfidenceLevel.HIGH
        ) {
          if (token.confidence !== ConfidenceLevel.HIGH) {
            token.confidence = ConfidenceLevel.HIGH;
          }
        }
      });
    });
  });
}

/**
 * Send corrections to backend for glyph map update
 * These corrections improve future transcriptions for this user
 */
export async function submitCorrections(
  corrections: Array<{
    original: string;
    corrected: string;
    rule?: string;
    context?: string;
  }>
): Promise<{ applied: number }> {
  const response = await api.post<{ applied: number; updatedMap: any }>(
    "/api/decipher/correct",
    { corrections }
  );
  return { applied: response.applied };
}

/**
 * Batch transcribe multiple image arrays
 * Useful for processing multiple documents or pages
 */
export async function transcribeImageBatches(
  imageBatches: string[][],
  glyphMap: GlyphMap | null,
  config: DecipherConfig = DEFAULT_DECIPHER_CONFIG
): Promise<TranscriptionResult[]> {
  return Promise.all(
    imageBatches.map((batch) => transcribeImages(batch, glyphMap, config))
  );
}

/**
 * Validate transcription configuration
 */
export function validateConfig(
  config: Partial<DecipherConfig>
): config is DecipherConfig {
  const required: (keyof DecipherConfig)[] = [
    "maxImagesPerBatch",
    "imageCompressionQuality",
    "maxImageSizeBytes",
    "enableGlyphMapCorrection",
    "enableProblemZoneDetection",
    "enableStructuralAnalysis",
    "confidenceThreshold",
    "autoFlagLowConfidence",
    "requestTimeout",
  ];

  return required.every((key) => key in config);
}
