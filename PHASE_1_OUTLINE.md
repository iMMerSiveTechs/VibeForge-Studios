# VibeForge Cognitive Engine — Phase 1 Outline

## Mission
Build a deterministic, interruption-native orchestrator kernel that routes requests, runs specialist roles in parallel when justified, streams results, handles user interrupts, fuses outputs, and snapshots state. No terminal required. iPad-first.

---

## Phase 1: The Kernel (Router + TaskRuntime + Streaming + Fusion)

### 1.1 Deterministic Router
**Goal:** Rule-based intent detection + scoring (no LLM spend to decide spending).

**Inputs:**
- User request text
- Project context (optional)

**Outputs:**
- `intent`: brainstorm | architect | build | debug | optimize | plan | unknown
- `complexity`: 0–100 (lines of code, system design breadth, algorithm depth)
- `risk`: 0–100 (security/correctness/breaking change implications)
- `uncertainty`: 0–100 (ambiguous requirements, edge cases, contradictions)
- `mode`: single | duo | fanout
- `roles`: array of [BUILDER, ARCHITECT, CRITIC, REASONER, VISIONARY, COMPRESSOR]

**Rules (non-LLM):**
```
maxScore = max(complexity, risk, uncertainty)
if maxScore < 35:
  mode = "single"
  roles = [BUILDER, CRITIC]
else if maxScore < 70:
  mode = "duo"
  roles = [BUILDER, ARCHITECT, CRITIC] + REASONER if uncertainty > 50
else:
  mode = "fanout"
  roles = specialty-based (see role selection matrix)

Role selection by intent:
  "build"      → BUILDER + CRITIC + (ARCHITECT if system keywords) + (REASONER if uncertainty > 50)
  "architect"  → ARCHITECT + CRITIC + REASONER
  "brainstorm" → VISIONARY + CRITIC + REASONER (if contradictions)
  "debug"      → BUILDER + CRITIC + REASONER
  "optimize"   → ARCHITECT + CRITIC + (BUILDER if code edits)
  "plan"       → ARCHITECT + REASONER
```

### 1.2 Task Runtime
**Goal:** Manage concurrent specialist calls, streaming, interrupts, and cancellation.

**Task Structure:**
```typescript
interface Task {
  id: string                // uuid
  turnId: string           // links to a user turn
  role: Role              // BUILDER, ARCHITECT, etc.
  priority: "HIGH" | "MED" | "LOW"
  status: "pending" | "running" | "streaming" | "done" | "error" | "cancelled"
  abortController: AbortController
  streamBuffer: string[]
  result: string | null
  error: string | null
}
```

**Lifecycle:**
1. Router creates task list + AbortController per task
2. Tasks queued in priority order
3. On user interrupt → cancel all MED/LOW tasks (HIGH tasks complete)
4. Fusion happens after all HIGH tasks done OR max wait time

### 1.3 Streaming Transport
**Mechanism:** Server-Sent Events (SSE)

**Events:**
- `event: route` → route plan JSON
- `event: delta` → streaming text chunk from a task
- `event: status` → phase label (routing/thinking/streaming/fusing/done/interrupted)
- `event: final` → fused final output JSON
- `:` (comment) → keepalive ping (prevents proxy buffering)

**Keepalive:** Send ping comment every 15s to prevent buffering.

### 1.4 Fusion Logic
**Goal:** Merge outputs from fanout tasks into one coherent final answer.

**Policy:**
1. **Critic patch rule**: If Critic flags P0 severity, re-call Builder to patch before user sees.
2. **Architect reconcile**: If Architect constraints conflict with Builder code, merge.
3. **Debate round**: Only if (fanout ≥ 3 AND contradictionScore > 0.7):
   - One short Reasoner call to reconcile differences
   - Takes max 1000 input tokens
4. **Compressor**: Produces compact snapshot of final output + decision log

### 1.5 Compression + State Snapshot
**Goal:** Keep memory bounded; enable rewind/branching.

**Snapshot JSON:**
```json
{
  "projectId": "...",
  "sessionId": "...",
  "turnId": "...",
  "userInput": "...",
  "routePlan": { "intent": "...", "mode": "...", "roles": [...] },
  "finalOutput": "...",
  "compressedSummary": "...",
  "artifacts": [{ "id": "...", "kind": "code|spec|test|doc", "path": "...", "content": "..." }],
  "createdAt": "..."
}
```

---

## Phase 2: Expo iPad UX (Streaming UI + Interrupt)

**Single-screen iPad app:**
- **Header**: VibeForge logo + status badge (Routing / Thinking / Streaming / Fusing / Done)
- **Main area**: Streaming text display (terminal-like, monospace, neon theme)
- **Input box**: Text field for next prompt, always available (typing mid-stream interrupts)
- **Controls**: STOP button (red neon), Share/Save buttons
- **History sidebar** (optional): Prior turns, branch/rewind actions

**Interrupt behavior:**
- User types → `status: interrupted` event sent → current stream dims + toast "Interrupting…"
- Bus cancels MED/LOW tasks → final output frozen
- New input becomes active turn

---

## Phase 3: Cost Governance

**Per-turn budget:**
- single mode: max 4000 input + 2000 output tokens (OpenAI gpt-4o pricing baseline)
- duo mode: max 6000 input + 3000 output tokens
- fanout mode: max 12000 input + 8000 output tokens

**Abort policy:**
- If model streaming exceeds output token budget → upstream abort (cuts token burn)
- Soft cap: log warning; Hard cap: stop streaming + error response

**Caching policy (Phase 4):**
- Prompt caching for repetitive system prompts (Anthropic/OpenAI support)

---

## Phase 4: Model Matrix (Adapter Interface)

**Capability-based selection (not vendor hardcode):**

```typescript
interface ModelCapability {
  reasoning: boolean
  codeGeneration: boolean
  structuredOutput: boolean
  streaming: boolean
  latency: "instant" | "fast" | "normal" | "slow"
  costClass: "cheap" | "mid" | "expensive"
}

interface ModelAdapter {
  streamText(req: TextRequest, signal: AbortSignal): AsyncIterable<TextChunk>
  structuredOutput(req: StructRequest, schema: JSONSchema): Promise<object>
  estimateCost(req: Request): { inputTokens: number; outputTokens: number }
}
```

**Supported adapters (stubs initially):**
- Anthropic Claude (Opus 4.6, Sonnet, Haiku)
- OpenAI (GPT-4o, 4.5, 4-turbo)
- Gemini (2.0, 1.5 pro)
- xAI Grok (if available)

---

## File Structure (Phase 1 + 2)

```
vibeforge-engine/
├── orchestrator/                    # Cloudflare Worker
│   ├── src/
│   │   ├── index.ts                # main handler
│   │   ├── router.ts               # deterministic router
│   │   ├── task-runtime.ts         # task queue + execution
│   │   ├── streaming.ts            # SSE setup + keepalive
│   │   ├── fusion.ts               # output reconciliation
│   │   ├── models/
│   │   │   ├── adapter.ts          # interface
│   │   │   ├── anthropic.ts        # Claude adapter (stub)
│   │   │   ├── openai.ts           # GPT adapter (stub)
│   │   │   └── gemini.ts           # Gemini adapter (stub)
│   │   └── types.ts
│   ├── wrangler.toml               # Cloudflare config
│   └── package.json
│
├── client/                          # Expo app
│   ├── src/
│   │   ├── app/
│   │   │   ├── _layout.tsx         # root navigator
│   │   │   └── vce-screen.tsx      # streaming UI + input
│   │   ├── lib/
│   │   │   ├── vce-client.ts       # SSE client
│   │   │   ├── theme.ts            # Electric Forge colors
│   │   │   └── state.ts            # local session state
│   │   └── components/
│   │       ├── StreamingTerminal.tsx
│   │       ├── InputComposer.tsx
│   │       ├── StatusBadge.tsx
│   │       └── HistorySidebar.tsx
│   ├── app.json
│   └── package.json
│
└── PHASE_1_OUTLINE.md              # this file
```

---

## Next 3 Moves

1. **Haiku Phase 1 Shell** (this): Output skeleton repo with empty stubs for router, task runtime, streaming, fusion.
2. **Sonnet 4.6 Phase 1 Full Build**: Audit + implement full router logic, task runtime with real AbortController semantics, SSE streaming with keepalive, fusion with Critic patching + debate round stub.
3. **Opus 4.6 Phase 1 + 2 Final**: Wire model adapters, implement Expo iPad UI, test interrupt flow, add cost tracking.

---

## Key Decisions (Locked)

- **Orchestrator target:** Cloudflare Worker (no Node dependencies, fast edge startup)
- **Transport:** SSE (simpler than WebSocket for interrupts, better for long-lived streams)
- **State:** Expo SQLite (local-first, rewind-capable)
- **UI theme:** Electric Forge neon (cyan #95CBDE, magenta #A75FBB, violet #413672, bg #020203)
- **Abort semantics:** Upstream cancellation mandatory (don't just stop client-side streaming)

---

## Assumptions (Override if needed)

- Orchestrator runs on Cloudflare Worker; keys stored in `wrangler.toml` secrets
- Client is single iPad screen (responsive to 1024px+ width, touch-optimized)
- No database on orchestrator; state is ephemeral + client-side snapshots
- Streaming uses `response.body.getReader()` for cross-platform compatibility

---

End Phase 1 outline. Ready for Phase 1 full implementation (Sonnet).
