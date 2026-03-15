# Phase 1.5 Brief for Sonnet 4.6

## You are here
Phase 1 **shell** is complete. All types, interfaces, and skeleton code are in place. Now you will implement the **kernel** — wiring real model calls, implementing specialist roles, and testing the interrupt flow.

## Your job (Phase 1.5)

### 1. Audit + Validate Phase 1 Skeleton
- Review `PHASE_1_OUTLINE.md` + `VCE_PHASE1_SUMMARY.md`
- Check each backend module for correctness, type safety, edge cases
- Flag any architectural gaps before we burn tokens on implementation

### 2. Create `/api/vce/chat` Endpoint
**File to create:** `backend/src/routes/vce.ts`

This is the **main orchestration loop**. Pseudo-spec:

```
POST /api/vce/chat
Body: { userInput: string, projectContext?: string }

Flow:
1. Parse + route (Router.route) → intent, complexity, risk, mode, roles
2. Stream route decision via SSE
3. Create tasks (TaskRuntime) for each role
4. For each task:
   - Call real model (AnthropicAdapter.streamText)
   - Stream deltas back to client
5. Wait for HIGH priority tasks
6. Collect results → Fusion.fuse()
7. Stream final output
8. Save snapshot to DB (Phase 3)
```

### 3. Implement Specialist Roles
Each role is a **system prompt + model call**. Implement:

**BUILDER** (primary code generation):
```
System: "You are an expert software engineer. Write production code for..."
Input: user request + route decision
Output: code blocks, specs, implementation details
```

**ARCHITECT** (system design):
```
System: "You are a system architect. Design the architecture for..."
Input: user request (if complexity > 50)
Output: structure, data flow, interfaces
```

**CRITIC** (code review):
```
System: "You are a security-focused code reviewer. Review this code for..."
Input: Builder output
Output: findings (P0/P1/P2 severity) + patch suggestions for P0
```

**REASONER** (contradiction resolution):
```
System: "You are a reasoning specialist. Reconcile these outputs..."
Input: conflicting Builder/Architect outputs
Output: unified approach (only called if contradiction score high)
```

### 4. Wire Critic + P0 Patching
```typescript
// After Builder finishes:
const criticOutput = await callModel(CRITIC_PROMPT, builderOutput);
const findings = parseCriticOutput(criticOutput);

// If P0 issues:
if (findings.some(f => f.severity === "P0")) {
  const patches = await callModel(BUILDER_PATCH_PROMPT, {
    original: builderOutput,
    issues: findings.filter(f => f.severity === "P0"),
  });
  // Apply patches to Builder output
}
```

### 5. Implement Debate Round
**Trigger:** fanout mode AND fanout ≥ 3 AND contradictionScore > 0.7

```typescript
if (routeDecision.mode === "fanout" &&
    taskResults.size >= 3 &&
    contradictionScore > 0.7) {

  const debatePrompt = buildDebatePrompt(taskResults);
  const reconciliation = await callModel(REASONER_PROMPT, debatePrompt);
  // Integrate reconciled output into fusion
}
```

### 6. Test Interrupt Flow
- User types mid-stream → send interrupt signal
- TaskRuntime.interruptTurn(turnId) cancels MED/LOW tasks
- Verify upstream fetch is actually aborted (don't just stop client)
- Verify HIGH tasks continue to completion

### 7. Add State Snapshots (Optional for 1.5)
Save to DB after each turn:
```typescript
const snapshot = fusionOutput.compressedSnapshot;
await db.vceSnapshot.create({
  data: {
    projectId,
    sessionId,
    snapshot: JSON.stringify(snapshot),
  },
});
```

---

## Testing Checklist

- [ ] Single mode: BUILDER only, cost < $0.01
- [ ] Duo mode: BUILDER + ARCHITECT + CRITIC, interrupt cancels nothing
- [ ] Fanout mode: all roles, debate round triggers if contradiction high
- [ ] Interrupt: type while streaming → MED/LOW cancelled, HIGH continues
- [ ] Cost abort: hard cap stops streaming at N tokens
- [ ] Streaming: deltas appear in real time (not buffered)
- [ ] Error recovery: model timeout → graceful fallback

---

## Files You'll Modify/Create

- ✅ `backend/src/routes/vce.ts` — Main orchestrator (create)
- ✅ `backend/src/lib/vce-*.ts` — Integrate + test existing modules
- ✅ `backend/src/index.ts` — Register `/api/vce` routes
- 🔲 `mobile/src/app/vce-screen.tsx` — Connect to endpoint (Phase 2)

---

## Key Constraints

1. **No hallucinated code**: Every file output, every endpoint tested
2. **Type-safe**: strict TS, no `any`
3. **Cost-aware**: Log spending, respect hard caps
4. **Interrupt-first**: Every model call gets AbortSignal
5. **Streaming**: SSE only, proper cleanup + keepalive

---

## What You Get From Phase 1.5

After you finish:
- ✅ Working `/api/vce/chat` endpoint
- ✅ Real model calls (Anthropic streaming)
- ✅ Critic role + P0 patching
- ✅ Debate round (triggered conditionally)
- ✅ Interrupt tested end-to-end
- ✅ Cost tracking + abort working

Then Opus 4.6 connects mobile UI + adds branching/rewind.

---

## Start Here

1. Read `PHASE_1_OUTLINE.md` + this brief
2. Audit `backend/src/lib/vce-*.ts` for bugs/gaps
3. Implement `/api/vce/chat` handler
4. Wire real Anthropic calls
5. Test single → duo → fanout modes
6. Verify interrupt flow
7. Output production code (no TODOs)

You have the skeleton. Build the engine.
