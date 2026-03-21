/**
 * DecipherKit Types
 * Core type definitions for handwriting transcription and glyph mapping
 */

/**
 * Confidence level for transcription accuracy
 */
export enum ConfidenceLevel {
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
  FLAG = "flag",
}

/**
 * Represents a glyph and its character mapping
 */
export interface GlyphEntry {
  id: string;
  glyphImageBase64: string;
  character: string;
  variants: string[];
  confidence: ConfidenceLevel;
  correctionCount: number;
  lastCorrected: Date | null;
}

/**
 * User's glyph map — persistent knowledge base of handwriting patterns
 */
export interface GlyphMap {
  id: string;
  userId: string;
  glyphs: Record<string, GlyphEntry>;
  version: number;
  lastUpdated: Date;
  totalCorrections: number;
}

/**
 * Represents a zone in the image that caused transcription issues
 */
export interface ProblemZone {
  id: string;
  imageIndex: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  reason: string; // e.g., "blurred", "crowded", "smudged"
  confidence: ConfidenceLevel;
}

/**
 * Notation marks that convey structural meaning
 * (arrows, circles, underlines, brackets, etc.)
 */
export interface StructuralNotation {
  id: string;
  type: "arrow" | "circle" | "underline" | "bracket" | "box" | "line" | "other";
  content: string; // e.g., "→", "☐", "───"
  position: { x: number; y: number };
  significance: "critical" | "supporting" | "decorative";
}

/**
 * Why transcription failed or was uncertain
 */
export interface FailureMode {
  id: string;
  code:
    | "UNKNOWN_GLYPH"
    | "AMBIGUOUS_HANDWRITING"
    | "IMAGE_QUALITY"
    | "STRUCTURAL_AMBIGUITY"
    | "INCOMPLETE_DATA";
  description: string;
  affectedText: string;
  suggestedCorrections: string[];
}

/**
 * Result of a single surface (e.g., page, sticky note)
 */
export interface Surface {
  id: string;
  imageIndex: number;
  dominantColor?: string; // hex color from image
  transcribedText: string;
  confidence: ConfidenceLevel;
  problemZones: ProblemZone[];
  structuralNotations: StructuralNotation[];
  failureModes: FailureMode[];
  tokens: TranscriptionToken[];
  metadata: {
    imageSize: { width: number; height: number };
    detectedOrientation: number; // rotation in degrees (0, 90, 180, 270)
    processingTime: number; // milliseconds
  };
}

/**
 * A single word/token with confidence and position
 */
export interface TranscriptionToken {
  id: string;
  text: string;
  confidence: ConfidenceLevel;
  position: { x: number; y: number; width: number; height: number };
  glyphIds: string[]; // cross-reference to glyph map
}

/**
 * Spatial relation between transcription elements
 * (grouping, ordering, containment)
 */
export interface SpatialRelation {
  id: string;
  type: "above" | "below" | "leftOf" | "rightOf" | "contains" | "groupedWith";
  firstElementId: string; // surface or token id
  secondElementId: string;
  confidence: number; // 0–1
}

/**
 * Item flagged for human review
 */
export interface FlaggedItem {
  id: string;
  surfaceId: string;
  reason: string;
  text: string;
  position: { x: number; y: number };
  createdAt: Date;
  reviewed: boolean;
  reviewerNotes?: string;
}

/**
 * User correction of transcription
 */
export interface CorrectionEntry {
  id: string;
  originalText: string;
  correctedText: string;
  glyphIds: string[];
  timestamp: Date;
  confidence: ConfidenceLevel;
  surfaceId: string;
}

/**
 * Configuration for transcription
 */
export interface DecipherConfig {
  maxImagesPerBatch: number;
  imageCompressionQuality: number; // 0–1
  maxImageSizeBytes: number;
  enableGlyphMapCorrection: boolean;
  enableProblemZoneDetection: boolean;
  enableStructuralAnalysis: boolean;
  confidenceThreshold: ConfidenceLevel;
  autoFlagLowConfidence: boolean;
  requestTimeout: number; // milliseconds
}

/**
 * Full transcription result from the engine
 */
export interface TranscriptionResult {
  id: string;
  surfaces: Surface[];
  spatialRelations: SpatialRelation[];
  flaggedItems: FlaggedItem[];
  overallConfidence: ConfidenceLevel;
  metadata: {
    totalImagesProcessed: number;
    totalTokens: number;
    processingStartTime: Date;
    processingEndTime: Date;
    elapsedMs: number;
  };
}
