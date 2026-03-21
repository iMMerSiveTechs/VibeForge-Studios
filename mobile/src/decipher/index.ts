/**
 * DecipherKit Module
 * Handwriting transcription engine with local glyph mapping
 */

// Types
export type {
  GlyphMap,
  GlyphEntry,
  ProblemZone,
  StructuralNotation,
  FailureMode,
  Surface,
  TranscriptionToken,
  SpatialRelation,
  FlaggedItem,
  CorrectionEntry,
  DecipherConfig,
  TranscriptionResult,
} from "./types";

export { ConfidenceLevel } from "./types";

// Engine
export {
  transcribeImages,
  transcribeImageBatches,
  submitCorrections,
  validateConfig,
  DEFAULT_DECIPHER_CONFIG,
} from "./decipher-engine";

// Image processing
export {
  detectOrientation,
  imageToBase64,
  compressImage,
  extractDominantColor,
  validateImage,
  prepareImageForApi,
  getImageMetadata,
} from "./image-preprocessor";

// State management
export { useGlyphMapStore } from "./glyph-map-store";

// Components
export { CameraCapture } from "./CameraCapture";
export type { CameraImage } from "./CameraCapture";

export { TranscriptionView } from "./TranscriptionView";

export { CorrectionSheet } from "./CorrectionSheet";

export { DecipherScreen } from "./DecipherScreen";
