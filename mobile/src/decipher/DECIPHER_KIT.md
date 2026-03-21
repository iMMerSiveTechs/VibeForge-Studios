# DecipherKit Module

Handwriting transcription and glyph mapping engine for VibeForge Studios mobile app.

## Overview

DecipherKit provides a complete solution for transcribing handwritten text from images, with local correction and learning capabilities through a persistent glyph map (knowledge base of handwriting patterns).

**Key Features:**
- Multi-image capture and gallery support (up to 4 images per batch)
- Backend-powered transcription via `/api/decipher` endpoint
- Local glyph map for persistent correction history
- Confidence-based flagging system (HIGH, MEDIUM, LOW, FLAG)
- Structural notation detection (arrows, circles, underlines, brackets)
- Problem zone identification (blurred, crowded, smudged areas)
- Bottom-sheet correction interface
- Export results and glyph maps as JSON

## Architecture

### Module Structure

```
src/decipher/
├── types.ts                 # All TypeScript interfaces
├── glyph-map-store.ts       # Zustand store (persistent state)
├── decipher-engine.ts       # API client & transcription logic
├── image-preprocessor.ts    # Image utilities
├── CameraCapture.tsx        # Multi-image capture component
├── TranscriptionView.tsx    # Results display component
├── CorrectionSheet.tsx      # Bottom-sheet correction UI
├── DecipherScreen.tsx       # Main screen (orchestrates all)
└── index.ts                 # Clean module exports
```

### Core Concepts

**Surfaces**
- Each image becomes a "surface" (e.g., a sticky note, page, or handwritten card)
- Contains full transcribed text, tokens, confidence, and metadata

**Tokens**
- Individual words/units with position info and confidence
- Cross-reference to glyphs in the user's persistent glyph map

**Glyph Map**
- User's personal knowledge base of handwriting patterns
- Persisted in AsyncStorage
- Maps glyph images + character → corrections + confidence
- Updated with user corrections over time

**Confidence Levels**
- `HIGH` (green): High confidence in transcription
- `MEDIUM` (yellow): Moderate confidence
- `LOW` (red): Low confidence or ambiguity
- `FLAG` (purple): Marked for human review

## Usage

### Basic Integration

```tsx
// In a tab or screen:
import { DecipherScreen } from "@/decipher";

export default function MyScreen() {
  return <DecipherScreen />;
}
```

The module is integrated as a tab in `src/app/(app)/(tabs)/decipher.tsx`.

### Using the Glyph Map Store

```tsx
import { useGlyphMapStore } from "@/decipher";

function MyComponent() {
  const {
    glyphMap,
    addCorrection,
    refreshCorrectionStats,
    getCorrectionStats
  } = useGlyphMapStore();

  // Initialize glyph map for user
  useEffect(() => {
    useGlyphMapStore.getState().initializeGlyphMap("user-id");
  }, []);

  // Add a correction
  const handleCorrect = (original: string, corrected: string) => {
    addCorrection({
      id: Date.now().toString(),
      originalText: original,
      correctedText: corrected,
      glyphIds: [],
      timestamp: new Date(),
      confidence: "medium",
      surfaceId: "surface-123",
    });
  };

  const stats = getCorrectionStats();
  console.log(`Total corrections: ${stats.totalCorrections}`);
}
```

### Transcribing Images Directly

```tsx
import {
  transcribeImages,
  DEFAULT_DECIPHER_CONFIG
} from "@/decipher";
import { useGlyphMapStore } from "@/decipher";

async function transcribeUserImages(imageUris: string[]) {
  const glyphMap = useGlyphMapStore.getState().glyphMap;

  try {
    const result = await transcribeImages(
      imageUris,
      glyphMap,
      DEFAULT_DECIPHER_CONFIG
    );

    console.log(`Transcribed ${result.surfaces.length} surfaces`);
    result.surfaces.forEach((surface) => {
      console.log(`Confidence: ${surface.confidence}`);
      console.log(`Text: ${surface.transcribedText}`);
    });
  } catch (error) {
    console.error("Transcription failed:", error);
  }
}
```

## API Contract

The engine calls the backend `/api/decipher` endpoint.

### Request Format

```typescript
POST /api/decipher

{
  images: [
    {
      base64: "data:image/jpeg;base64,...",
      orientation: 0,              // degrees: 0, 90, 180, 270
      dominantColor: "#RRGGBB",
      index: 0
    }
  ],
  config: {
    enableProblemZoneDetection: true,
    enableStructuralAnalysis: true,
    flagLowConfidence: true
  }
}
```

### Response Format

```typescript
{
  data: {
    surfaces: [
      {
        id: "surface_...",
        imageIndex: 0,
        dominantColor: "#RRGGBB",
        transcribedText: "The handwritten text here",
        confidence: "high|medium|low|flag",
        tokens: [
          {
            id: "token_...",
            text: "The",
            confidence: "high",
            position: { x: 10, y: 20, width: 30, height: 15 },
            glyphIds: []
          }
        ],
        problemZones: [
          {
            id: "zone_...",
            imageIndex: 0,
            boundingBox: { x: 100, y: 100, width: 50, height: 50 },
            reason: "blurred|crowded|smudged",
            confidence: "medium"
          }
        ],
        structuralNotations: [
          {
            id: "notation_...",
            type: "arrow|circle|underline|bracket|box|line",
            content: "→",
            position: { x: 200, y: 200 },
            significance: "critical|supporting|decorative"
          }
        ],
        failureModes: [],
        metadata: {
          imageSize: { width: 1920, height: 1440 },
          detectedOrientation: 0,
          processingTime: 245
        }
      }
    ],
    spatialRelations: [],
    flaggedItems: [],
    overallConfidence: "high",
    metadata: {
      totalImagesProcessed: 1,
      totalTokens: 42,
      processingStartTime: "2026-03-19T...",
      processingEndTime: "2026-03-19T...",
      elapsedMs: 2450
    }
  }
}
```

**Note:** All images and sensitive data go through the backend. The frontend never makes direct API calls to Claude or other AI providers.

## Type Reference

### Core Types

```typescript
// Confidence level for accuracy
enum ConfidenceLevel {
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
  FLAG = "flag"
}

// Result from transcribing images
interface TranscriptionResult {
  id: string;
  surfaces: Surface[];              // One per image
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

// One image's transcription
interface Surface {
  id: string;
  imageIndex: number;
  dominantColor?: string;
  transcribedText: string;
  confidence: ConfidenceLevel;
  problemZones: ProblemZone[];
  structuralNotations: StructuralNotation[];
  failureModes: FailureMode[];
  tokens: TranscriptionToken[];
  metadata: {
    imageSize: { width: number; height: number };
    detectedOrientation: number;    // 0, 90, 180, 270
    processingTime: number;
  };
}

// User's persistent glyph map
interface GlyphMap {
  id: string;
  userId: string;
  glyphs: Record<string, GlyphEntry>;  // glyphId → entry
  version: number;
  lastUpdated: Date;
  totalCorrections: number;
}

// Single glyph entry
interface GlyphEntry {
  id: string;
  glyphImageBase64: string;
  character: string;
  variants: string[];
  confidence: ConfidenceLevel;
  correctionCount: number;
  lastCorrected: Date | null;
}

// User's correction of transcription
interface CorrectionEntry {
  id: string;
  originalText: string;
  correctedText: string;
  glyphIds: string[];
  timestamp: Date;
  confidence: ConfidenceLevel;
  surfaceId: string;
}

// Config for transcription
interface DecipherConfig {
  maxImagesPerBatch: number;        // Default: 4
  imageCompressionQuality: number;  // 0–1, default: 0.8
  maxImageSizeBytes: number;        // Default: 1MB
  enableGlyphMapCorrection: boolean;
  enableProblemZoneDetection: boolean;
  enableStructuralAnalysis: boolean;
  confidenceThreshold: ConfidenceLevel;
  autoFlagLowConfidence: boolean;
  requestTimeout: number;           // milliseconds
}
```

See `src/decipher/types.ts` for complete type definitions.

## Dependencies

Already included in `package.json`:
- `expo-image-picker` — Capture and gallery selection
- `expo-camera` — Camera access
- `@gorhom/bottom-sheet` — Correction UI
- `zustand` — State management
- `@react-native-async-storage/async-storage` — Persistent storage
- `lucide-react-native` — Icons
- `@react-native-safe-area-context` — Safe area support

## Storage

### AsyncStorage Keys

- `@decipher_glyph_map` — Serialized glyph map (JSON)
- `@decipher_corrections` — Array of corrections (JSON)

Clear with:
```tsx
import AsyncStorage from "@react-native-async-storage/async-storage";

await AsyncStorage.multiRemove(["@decipher_glyph_map", "@decipher_corrections"]);
```

## Styling

Uses VibeForge theme colors from `@/theme/colors`:
- Cyan (`#00FFFF`) — Primary accent
- Magenta (`#FF00FF`) — Not used in DecipherKit
- Violet (`#A75FBB`) — Flags
- Dark bg (`#050505`) — Primary background
- Success (`#00C853`) — HIGH confidence
- Warning (`#FFD60A`) — MEDIUM confidence
- Error (`#FF3B30`) — LOW confidence

Consistent with existing app styling patterns.

## Error Handling

```tsx
try {
  const result = await transcribeImages(imageUris, glyphMap);
} catch (error) {
  // Error messages:
  // - "No images provided for transcription"
  // - "Too many images. Maximum N allowed."
  // - "Transcription failed: ..." (backend error)
  // - "Failed to prepare image for API: ..." (preprocessing error)
  // - "Failed to import glyph map: ..." (corrupted data)

  showToast(error.message);
}
```

## Performance Notes

- Image preprocessing (compression, base64) is async and parallelized
- Backend call includes images up to 1MB per image
- Glyph map corrections are applied post-API locally
- Zustand store ensures efficient re-renders
- Bottom sheet uses `@gorhom/bottom-sheet` for smooth animations

## Future Enhancements

1. **Batch processing** — Chain multiple transcription batches
2. **Handwriting style detection** — Identify user's handwriting variations
3. **Vocabulary hints** — Suggest corrections based on context
4. **Ink color analysis** — Distinguish pen colors
5. **Page layout analysis** — Detect columns, tables, structured text
6. **Offline fallback** — Local ML model for low-confidence cases
7. **Syncing** — Cloud-sync glyph maps across devices

## Troubleshooting

### Images not loading
- Check `expo-image-picker` and `expo-camera` permissions in `app.json`
- iOS: Add NSCameraUsageDescription and NSPhotoLibraryUsageDescription
- Android: Check CAMERA and READ_EXTERNAL_STORAGE permissions

### Transcription failing
- Verify backend `/api/decipher` endpoint is accessible
- Check `EXPO_PUBLIC_BACKEND_URL` env variable
- Ensure images are valid and not corrupted
- Check backend logs for detailed error

### Glyph map not persisting
- Verify AsyncStorage is available
- Check app permissions for device storage
- Clear old data: `AsyncStorage.removeItem("@decipher_glyph_map")`

### Type errors
- Ensure imports use the module's `index.ts` exports
- Run `npm run typecheck` to catch issues early
- Check that `expo-image-picker` and `react-native-safe-area-context` are installed

## License

Part of VibeForge Studios — proprietary software.
