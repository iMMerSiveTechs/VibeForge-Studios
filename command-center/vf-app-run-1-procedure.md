# VF_APP Run 1 Procedure

## 1. Backend Startup

```bash
cd backend
bun install
bunx prisma generate
bunx prisma db push
```

Create `backend/.env` if it does not exist:

```
BETTER_AUTH_SECRET=<any-random-string-32-chars-minimum>
DATABASE_URL=file:./dev.db
BACKEND_URL=http://localhost:3000
PORT=3000
```

Start the server:

```bash
bun run dev
```

Verify:

```bash
curl http://localhost:3000/health
```

Expected: `{"status":"ok"}`

---

## 2. Mobile Startup

```bash
cd mobile
bun install
bun run start
```

Connect via Expo Go on device, or press `i` for iOS simulator / `a` for Android emulator.

---

## 3. Env / Backend URL Check

The mobile app must know where the backend lives.

Check `mobile/src/` for a config or constants file that sets `BACKEND_URL` or `API_URL`. It should point to:

- **Simulator/emulator:** `http://localhost:3000`
- **Physical device on same LAN:** `http://<your-mac-ip>:3000`

If the mobile app uses an ENV tab (per `CLAUDE.md`), set `BACKEND_URL` there.

---

## 4. Auth / Sign-In Requirement

The backend uses **better-auth**. All `/api/generate` calls require an authenticated session.

Before submitting the canonical prompt:
1. Open the app
2. Create an account or sign in
3. Confirm you have a valid session (e.g., `/api/me` returns your user, or the app shows you logged in)

If auth is broken or unimplemented in the current mobile UI, this blocks Run 1.

---

## 5. Project Requirement

`POST /api/generate` requires a `projectId`.

Before submitting the canonical prompt:
1. Create a project in the app (or via API: `POST /api/projects` if the UI supports it)
2. Note the `projectId`

If project creation is broken or missing from the current mobile UI, this blocks Run 1.

---

## 6. AI Provider Key / Settings Requirement

The generate route checks for an API key in this order:
1. Explicit `apiKey` field in the request body
2. Fallback with provider keys from user Settings (`/api/settings`)

The default model in generate.ts is `claude-sonnet-4-5`.

Before submitting the canonical prompt:
1. Go to the app's Settings / ENV tab
2. Add an AI provider key (Anthropic, OpenAI, or Gemini depending on model choice)
3. Confirm the key is saved via `GET /api/settings`

If no key is configured and the backend has no `OPENAI_API_KEY` in `.env`, generation will fail.

---

## 7. Exact Submission Path for the Canonical Prompt

The canonical prompt lives in:
`command-center/vf-app-canonical-test-prompt.md`

Submission path:

1. Open the app
2. Navigate to the project created in step 5
3. Enter the canonical prompt text (the section after the `---` separator in the prompt file):

> Generate a valid VF_APP-compatible result for the current VibeForge Studio preview system.
>
> Build a simple todo app preview that works in the existing VF_APP Preview tab.
>
> *(full prompt text from canonical-test-prompt.md)*

4. Submit / tap Generate
5. The app calls `POST /api/generate` with `{ projectId, prompt }`
6. Backend calls the AI provider, parses the response, updates `project.vfAppSpec`

If the mobile UI does not have a prompt input → generation screen for an existing project, use curl as fallback:

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: <your-session-cookie>" \
  -d '{
    "projectId": "<your-project-id>",
    "prompt": "<canonical prompt text>",
    "apiKey": "<your-provider-key>"
  }'
```

---

## 8. Exact Preview-Check Path in the Mobile App

After generation completes:

1. The project record should now have a populated `vfAppSpec` field
2. Navigate to the project's **Preview** tab in the mobile app
3. The Preview tab reads `vfAppSpec` and renders it using the VF_APP engine (`mobile/src/engine/`)

Check:
- Does the preview screen load?
- Does it show "Todo Test" as the title?
- Are the two seeded todos visible (Buy milk, Ship build)?
- Can you add a new todo?
- Can you toggle a todo complete/incomplete?
- Does the UI visibly update?

---

## 9. Pass / Fail Criteria for Run 1

### PASS

All of these are true:
1. `POST /api/generate` completes without blocker-level error
2. Project record is updated with a valid, renderable `vfAppSpec`
3. Preview tab loads the generated result
4. Main preview screen renders
5. A new todo can be added
6. A todo can be toggled complete/incomplete
7. UI visibly updates correctly
8. No hidden manual fixes were required

### FAIL

Any of these:
- Generation request fails
- Project does not receive a usable `vfAppSpec`
- Preview tab cannot render the result
- Required interaction does not work
- Manual repair was required
- Scope drifted from the canonical test

Log the result in `command-center/vf-app-preview-validation-log.md`, Run 1 row.

---

## 10. Most Likely Pre-Run Blockers

| # | Blocker | How to check | Fix |
|---|---------|-------------|-----|
| 1 | **No `backend/.env` file** | `cat backend/.env` | Create it per step 1 |
| 2 | **No `node_modules` in backend or mobile** | `ls backend/node_modules` / `ls mobile/node_modules` | `bun install` in each |
| 3 | **No Prisma client generated / no DB** | Backend crashes on startup | `bunx prisma generate && bunx prisma db push` in `backend/` |
| 4 | **No AI provider key configured** | Generation returns error about missing key | Add key via Settings/ENV tab or pass `apiKey` in request |
| 5 | **Auth not working / no session** | `/api/me` returns 401 | Fix auth flow or create account first |
| 6 | **No project exists** | No `projectId` to pass to generate | Create a project in the app first |
| 7 | **Mobile can't reach backend** | Network error in app | Check `BACKEND_URL` matches actual backend address |
| 8 | **VF_APP engine can't render the AI output** | Preview tab blank or errors | This is a Generation Failure or Preview Failure — log it, don't patch it |
| 9 | **Wrong model / provider mismatch** | API returns auth error | Ensure the API key matches the model provider (Anthropic key for claude-sonnet, OpenAI key for gpt-*) |
| 10 | **Backend port conflict** | Server won't start | Check nothing else is on port 3000 |
