# AI API Endpoints

This backend provides comprehensive AI API endpoints powered by OpenAI services.

## Environment Variables

Add to your `.env` file:

```
OPENAI_API_KEY=sk-...
```

## Endpoints

### 1. Chat Completion (Text Generation)

**POST** `/api/ai/chat`

Generate text using GPT-5.2 with optional streaming support.

**Request:**
```json
{
  "prompt": "Explain quantum computing in simple terms",
  "stream": false,
  "model": "gpt-5.2",
  "temperature": 0.7,
  "maxTokens": 500
}
```

**Response (non-streaming):**
```json
{
  "data": {
    "text": "Quantum computing is..."
  }
}
```

**Response (streaming):**
Server-Sent Events (SSE) with:
```
event: message
data: {"text":"chunk"}

event: done
data: {"done":true}
```

**cURL Example:**
```bash
curl -X POST "$BACKEND_URL/api/ai/chat" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Say hello"}'
```

---

### 2. Image Generation

**POST** `/api/ai/image/generate`

Generate images using DALL-E 3.

**Request:**
```json
{
  "prompt": "A futuristic city at sunset",
  "size": "1024x1024",
  "n": 1,
  "quality": "auto"
}
```

**Response:**
```json
{
  "data": {
    "url": "https://oaidalleapiprodscus.blob.core.windows.net/...",
    "images": ["https://..."]
  }
}
```

**Supported Sizes:**
- `256x256`
- `512x512`
- `1024x1024`
- `1792x1024`
- `1024x1792`

**Quality Options:**
- `low`
- `medium`
- `high`
- `auto` (default)

**cURL Example:**
```bash
curl -X POST "$BACKEND_URL/api/ai/image/generate" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A cute robot"}'
```

---

### 3. Image Analysis (Vision)

**POST** `/api/ai/image/analyze`

Analyze images using GPT-5.2 vision capabilities.

**Request:**
```json
{
  "image": "data:image/png;base64,iVBORw0KG...",
  "prompt": "What objects are in this image?",
  "model": "gpt-5.2",
  "maxTokens": 300
}
```

**Response:**
```json
{
  "data": {
    "text": "The image contains a laptop, coffee cup, and notebook..."
  }
}
```

**cURL Example:**
```bash
curl -X POST "$BACKEND_URL/api/ai/image/analyze" \
  -H "Content-Type: application/json" \
  -d '{"image": "data:image/png;base64,...", "prompt": "Describe this image"}'
```

---

### 4. Audio Transcription

**POST** `/api/ai/audio/transcribe`

Transcribe audio files to text using GPT-4o-transcribe.

**Request:**
Form-data with audio file:
```
file: (audio file - mp3, wav, m4a, webm)
```

**Response:**
```json
{
  "data": {
    "text": "Hello, this is a transcription of the audio..."
  }
}
```

**Supported Formats:**
- audio/mpeg (mp3)
- audio/wav
- audio/m4a
- audio/webm

**cURL Example:**
```bash
curl -X POST "$BACKEND_URL/api/ai/audio/transcribe" \
  -F "file=@audio.mp3"
```

---

### 5. Text-to-Speech

**POST** `/api/ai/audio/speech`

Convert text to speech using TTS-1.

**Request:**
```json
{
  "text": "Hello, welcome to our application!",
  "voice": "alloy",
  "model": "tts-1",
  "speed": 1.0,
  "format": "mp3"
}
```

**Response:**
Binary audio file with appropriate Content-Type header.

**Voice Options:**
- `alloy` (default)
- `echo`
- `fable`
- `onyx`
- `nova`
- `shimmer`

**Format Options:**
- `mp3` (default)
- `opus`
- `aac`
- `flac`

**Model Options:**
- `tts-1` (default, faster)
- `tts-1-hd` (higher quality)

**cURL Example:**
```bash
curl -X POST "$BACKEND_URL/api/ai/audio/speech" \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world"}' \
  --output speech.mp3
```

---

## Error Handling

All endpoints return errors in this format:

```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

**Common Error Codes:**
- `AI_GENERATION_FAILED` - Text generation failed
- `IMAGE_GENERATION_FAILED` - Image generation failed
- `IMAGE_ANALYSIS_FAILED` - Vision analysis failed
- `TRANSCRIPTION_FAILED` - Audio transcription failed
- `SPEECH_GENERATION_FAILED` - TTS generation failed
- `MISSING_FILE` - No file provided for upload
- `INVALID_FILE_TYPE` - Unsupported file type

---

## TypeScript Types

Import types from `/backend/src/types/ai.ts`:

```typescript
import {
  ChatRequest,
  ChatResponse,
  ImageGenerateRequest,
  ImageGenerateResponse,
  ImageAnalyzeRequest,
  ImageAnalyzeResponse,
  AudioTranscribeResponse,
  AudioSpeechRequest,
  AIErrorResponse
} from './types/ai';
```

---

## Testing

All endpoints have been tested and verified working:

1. Chat completion with streaming
2. Image generation with DALL-E 3
3. Text-to-speech audio generation
4. Vision analysis (requires image data)
5. Audio transcription (requires audio file)

See test results in implementation commit.
