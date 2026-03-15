# VibeForge Studio - Black Anvil v2.0

An App Store-safe app builder with authentication, cloud sync, AI APIs, and advanced runtime components.

**Bundle ID:** `com.vibeforge.studio` | **Scheme:** `vibeforgestudio`

## 🧠 VibeForge Cognitive Engine (VCE)

We are building **VibeForge Cognitive Engine** — a production-grade, interruption-native, multi-model orchestration brain for reasoning + building with the user in real time.

**Status:**
- ✅ **Phase 1** — Kernel skeleton (router, runtime, streaming, fusion, models, cost-policy)
- ✅ **Phase 1.5** — Live orchestrator with real model streaming + Engine tab
- ✅ **Phase 2** — Hard engine boundary (EngineClient + MockEngine + RemoteEngine)
- ✅ **App Store Compliance** — Privacy manifest, permission descriptions, AI labeling, GDPR delete, Iron Vault removed
- 🔄 **Phase 3** — State layer (SQLite snapshots, rewind/branching) + persona modules

### Engine Architecture

**Hard Boundary** — UI calls ONLY `engineClient.generate()` and `engineClient.interrupt()`. No provider URLs, no SSE parsing, no API keys in the mobile app. Engine logic is fully encapsulated.

```
UI (vce.tsx)  -->  EngineClient (singleton)
                      |-- MockEngine (simulated streaming for dev)
                      |-- RemoteEngine (SSE to /api/vce/chat)
                              |
                    Backend Orchestrator (/api/vce)
                      |-- Deterministic Router (non-LLM)
                      |-- TaskRuntime (AbortController, priority queues)
                      |-- Specialist Roles (BUILDER, ARCHITECT, CRITIC, REASONER)
                      |-- Fusion (Critic P0 patching, debate rounds)
                      |-- Model Adapters (Anthropic, OpenAI, Gemini via proxy)
                      |-- CostTracker (budget caps, auto-abort)
```

**Non-LLM Routing First** — Deterministic keyword-based router detects intent + scores complexity/risk/uncertainty. Routes to single/duo/fanout **before spending tokens**.

**Interrupt-Native** — Priority-based task execution (HIGH/MED/LOW) with AbortController. User interrupt cancels MED/LOW, preserves HIGH. Upstream fetch abort stops token burn.

**Streaming + Fusion** — SSE transport with keepalive pings. Parallel specialist roles. Critic patches P0 issues. Debate round reconciles contradictions.

**Cost Governance** — Budget per mode: single ($0.05), duo ($0.10), fanout ($0.30). Real-time tracking, auto-abort.

### Engine Files

**Mobile Engine Boundary** — `mobile/src/engine/`
- `types.ts` — Boundary types (the ONLY types UI knows about)
- `EngineClient.ts` — Singleton gateway (mock/remote toggle)
- `adapters/MockEngine.ts` — Simulated streaming for UI dev
- `adapters/RemoteEngine.ts` — Real SSE to orchestrator

**Mobile State** — `mobile/src/lib/state/engine-store.ts` (Zustand)

**Backend Orchestrator** — `backend/src/routes/vce.ts` (SSE endpoint + interrupt)
**Backend Kernel** — `backend/src/lib/vce-*.ts` (router, runtime, streaming, fusion, models, cost-policy)
**Backend Types** — `backend/src/types/vce.ts`

**UI** — `mobile/src/app/(app)/(tabs)/vce.tsx` (Engine tab, Electric Forge neon theme)

## Architecture

- **Mobile**: Expo SDK 53 React Native app with 6 tabs (Projects, Build, Preview, Runs, AI Lab, Settings)
- **Backend**: Hono API server with Prisma/SQLite, Better Auth, file uploads, and AI endpoints
- **Auth**: Email OTP authentication with Better Auth for user accounts and cloud sync
- **Storage**: Vibecode cloud storage for images, videos, audio, and files

## Features

### Authentication
- Email OTP sign-in with beautiful liquid glass auth screens
- Better Auth integration with secure session management
- User accounts with cloud sync for projects and assets

### Projects Tab
Create and manage app projects. Each project belongs to a user, has a name, bundle ID, files, and VF_APP spec. Import zip files to instantly load code and specs into a project.

**Smart Zip Import + AI Analysis:**
- Upload any app's zip file (Expo, React Native, web apps, etc.)
- Auto-detects existing VF_APP specs in the zip
- If no spec found, an "ANALYZE WITH AI" button appears on the project detail screen
- One tap triggers AI analysis: the backend reads all extracted source files, filters out noise (node_modules, binaries, lock files), builds a token-budgeted source bundle, and sends it to your configured AI provider
- AI generates a complete VF_APP spec recreating the app's screens, navigation, and logic
- After analysis, the Preview tab shows an interactive version of the imported app
- Use the Build tab to make AI-powered changes afterward

### Build Tab (Generator)
Select a project, choose an AI provider (Claude/OpenAI/Gemini), write a prompt, and generate app specs. The AI response is parsed for VF_APP (preview runtime spec) and VF_PACK (exportable code files).

### Preview Tab (VF_APP Runtime)
Renders generated apps interactively using native components from a JSON spec.

**Supported Node Types:**
- Layout: section, card, row, divider, spacer
- Text: text, metric
- Inputs: input, textarea, toggle
- Lists: list, gallery
- Media: image, video, audio, camera
- Maps: map with markers
- Charts: line, bar, pie charts
- Buttons: with actions (nav, set, append, remove, toast)

No code execution - App Store safe.

### Runs Tab
View all AI generation runs with cost tracking, token usage, and export to CSV.

### AI Lab Tab
Test and experiment with AI APIs:
- Chat with GPT-5.2 (streaming)
- Generate images with DALL-E 3
- Analyze images with GPT-5.2 Vision
- Transcribe audio with Whisper
- Text-to-speech with OpenAI TTS

### Settings Tab
Configure API keys for Claude, OpenAI, and Gemini. Set default models and pricing rates.

**Model Picker:**
- All models for each provider are shown (no hidden/advanced toggle needed)
- Each model chip shows tier badge (FAST / SMART / MAX) and REC indicator for recommended models
- Backend model catalog (`backend/src/lib/model-catalog.ts`) is the single source of truth — add new models there and they appear everywhere instantly
- Forge Engine Drawer also shows full model list for per-role overrides (BUILDER / CRITIC / REASONER)

**Account Management:**
- **Sign Out** — Signs out of the current session
- **Delete Account & Data** — Permanently deletes account and all associated data (GDPR-compliant, cascade delete)
- API keys are stored securely on the server, never in the app itself

## VF_APP Spec Format
```json
{
  "name": "My App",
  "start": "home",
  "screens": {
    "home": {
      "title": "Home",
      "body": [
        { "type": "text", "variant": "h1", "value": "Welcome" },
        { "type": "button", "label": "Go", "action": { "type": "nav", "to": "detail" } }
      ]
    }
  }
}
```

## Backend API

### Authentication
- `POST /api/auth/email-otp/send-verification-otp` - Send OTP to email
- `POST /api/auth/email-otp/verify-email` - Verify OTP and create session
- `GET /api/auth/get-session` - Get current session

### Projects
- `GET /api/projects` - List user's projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/upload-zip` - Upload and extract zip files
- `POST /api/projects/:id/analyze-zip` - AI analysis of extracted zip files → generates VF_APP spec

### File Uploads
- `POST /api/upload` - Upload file to cloud storage
- `GET /api/files` - List user's uploaded files
- `DELETE /api/files/:id` - Delete uploaded file

### AI APIs
- `POST /api/ai/chat` - Text generation with GPT-5.2 (streaming support)
- `POST /api/ai/image/generate` - Image generation with DALL-E 3
- `POST /api/ai/image/analyze` - Image analysis with GPT-5.2 Vision
- `POST /api/ai/audio/transcribe` - Audio transcription with Whisper
- `POST /api/ai/audio/speech` - Text-to-speech with OpenAI TTS

### Other
- `GET/POST /api/runs` - AI generation run tracking
- `GET/PUT /api/settings` - Key-value settings
- `POST /api/generate` - AI generation with spec parsing
- `GET /api/me` - Get current user
- `DELETE /api/me` - Delete account and all data (GDPR)

## Theme
Black Anvil dark theme with neon cyan, green, and magenta accents. Monospace typography throughout.
