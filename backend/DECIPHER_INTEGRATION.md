# DecipherKit Backend Integration Guide

## What Was Created

Three new files have been added to the backend to support DecipherKit handwriting transcription:

### 1. `src/lib/decipher-prompt.ts`
Contains the DecipherKit system prompt template and TypeScript type definitions for request/response structures.

**Exports:**
- `buildDecipherSystemPrompt(glyphMap)` — Injects the glyph map into the system prompt
- Type definitions:
  - `GlyphMap` — Writer's glyph map object
  - `DecipherConfig` — Optional configuration for transcription behavior
  - `TranscriptionResult` — Response structure from Claude Vision API
  - `CorrectionEntry` — Correction data for the `/correct` endpoint

### 2. `src/routes/decipher.ts`
Implements two API endpoints for handwriting transcription.

**Endpoints:**

#### `POST /api/decipher/transcribe`
Transcribes handwritten notes from images using Claude Vision API with the personalized Glyph Map.

Request:
```json
{
  "images": ["base64_encoded_image_1", "base64_encoded_image_2"],
  "glyphMap": { ... your glyph map object ... },
  "config": {
    "highConfidenceThreshold": 0.9,
    "enableCrossImageSynthesis": true,
    "maxFlaggedItems": 10
  }
}
```

Response:
```json
{
  "data": {
    "images_analyzed": 2,
    "surfaces": [
      {
        "id": "surface-1",
        "type": "sticky_note",
        "color": "green",
        "orientation": "upright",
        "attachments": [],
        "transcription": {
          "text": "Claude Code",
          "confidence": "HIGH",
          "confidence_score": 0.97
        },
        "structural_notation": [],
        "spatial_relations": []
      }
    ],
    "cross_image_synthesis": [],
    "flagged_items": [],
    "glyph_map_corrections_applied": []
  }
}
```

Features:
- Validates up to 4 images, each max 5MB base64
- Uses Claude Sonnet 4.5 Vision API
- Applies personalized glyph map corrections
- Returns structured transcription with confidence scores
- Handles rate limits, API failures, validation errors gracefully

#### `POST /api/decipher/correct`
Applies corrections to transcription results (stores in-memory; future: per-user DB storage).

Request:
```json
{
  "corrections": [
    { "original": "teh", "corrected": "the", "rule": "common_typo" },
    { "original": "a", "corrected": "u", "context": "word_start" }
  ]
}
```

Response:
```json
{
  "data": {
    "applied": 2,
    "updatedMap": { ... updated glyph map ... }
  }
}
```

#### `GET /api/decipher/health`
Health check endpoint that reports DecipherKit configuration status.

### 3. Updated `src/env.ts`
Added `ANTHROPIC_API_KEY` to the environment schema (optional, but required at runtime for `/transcribe`).

**Required Environment Variable:**
```bash
ANTHROPIC_API_KEY=sk-ant-...
```

## Integration Steps

### Step 1: Register the route in `src/index.ts`

Add these two lines to the imports section:
```typescript
import { decipherRoutes } from './routes/decipher';
```

Add this line in the routes mounting section (around line 90-102):
```typescript
app.route('/api/decipher', decipherRoutes);
```

Example location in index.ts (after other routes):
```typescript
// Routes
app.route("/api/sample", sampleRouter);
app.route("/api/projects", projectsRouter);
app.route("/api/decipher", decipherRoutes);  // ← Add here
```

### Step 2: Set environment variable

Add to your `.env` file:
```
ANTHROPIC_API_KEY=your-anthropic-api-key-here
```

### Step 3: Test the routes

```bash
# Health check (no auth required for MVP)
curl http://localhost:3000/api/decipher/health

# Transcribe (requires ANTHROPIC_API_KEY)
curl -X POST http://localhost:3000/api/decipher/transcribe \
  -H "Content-Type: application/json" \
  -d '{
    "images": ["base64..."],
    "glyphMap": { "known_vocabulary": ["Claude", "Code"] }
  }'
```

## API Contract Patterns

All endpoints follow the backend's standard envelope pattern:
- **Success:** `{ data: ... }`
- **Error:** `{ error: { message, code } }` with HTTP status code

Error codes:
- `MISSING_ANTHROPIC_KEY` (500) — ANTHROPIC_API_KEY not configured
- `INVALID_API_KEY` (401) — API key is invalid
- `IMAGE_TOO_LARGE` (400) — Image exceeds 5MB
- `RATE_LIMIT_EXCEEDED` (429) — Anthropic API rate limit hit
- `TRANSCRIPTION_FAILED` (400) — General transcription error

## Model & Versions

- **Claude Model:** `claude-sonnet-4-5-20250514` (Vision-capable)
- **Max tokens:** 4096
- **Supported image formats:** JPEG, PNG, GIF, WebP (via base64)
- **Max images per request:** 4
- **Max image size:** 5MB each

## Future Enhancements

1. **Per-user glyph maps:** Store in Prisma database with User relation
2. **Correction history:** Track applied corrections per user for model refinement
3. **Streaming responses:** For long transcriptions, stream JSON chunks with Server-Sent Events
4. **Batch processing:** Queue multiple image sets for async processing
5. **Glyph map versioning:** Track map changes and allow reverting to previous versions

## Files Modified/Created

✅ Created: `/backend/src/routes/decipher.ts` (9058 bytes)
✅ Created: `/backend/src/lib/decipher-prompt.ts` (5770 bytes)
✅ Modified: `/backend/src/env.ts` (added ANTHROPIC_API_KEY schema)

## Code Review Checklist

- [x] Follows existing Hono route patterns (zValidator, error handling, response envelope)
- [x] Uses `{ data: ... }` response envelope per API contract
- [x] Proper TypeScript strict mode (all types explicit)
- [x] Validates input (max 4 images, 5MB each)
- [x] Handles API errors gracefully with specific error codes
- [x] Uses backend's env validation pattern
- [x] No sensitive data logged or exposed
- [x] Follows existing naming conventions (camelCase for functions, SCREAMING_SNAKE_CASE for constants)
