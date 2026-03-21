/** A single glyph correction mapping */
export interface GlyphMapEntry {
  /** The misrecognized text */
  original: string;
  /** The correct replacement */
  corrected: string;
  /** Number of times this correction has been applied */
  frequency: number;
  /** ISO timestamp of when this entry was created */
  createdAt: string;
  /** ISO timestamp of last use */
  lastUsedAt: string;
}

/** The full glyph map: keys are the original (misrecognized) strings */
export type GlyphMap = Record<string, GlyphMapEntry>;

/** Result from a single transcription */
export interface TranscriptionResult {
  id: string;
  /** Raw text returned by Claude Vision */
  rawText: string;
  /** Text after glyph map corrections */
  correctedText: string;
  /** Base64 image data (without data URI prefix) */
  imageBase64: string;
  /** ISO timestamp */
  timestamp: string;
  /** Number of glyph corrections applied */
  correctionsApplied: number;
}

/** Wrapper for persisted history */
export interface TranscriptionHistory {
  entries: TranscriptionResult[];
}
