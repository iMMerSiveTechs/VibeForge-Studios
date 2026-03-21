# 25-Step Execution Plan — Ship or Die
**Created:** Fri 2026-03-20 10:36 PM PDT
**Priority:** Revenue-first. Everything else follows money.
**Constraint:** Zero budget. Free tools only. Time is the only currency.

---

## Phase 1: STOP THE BLEEDING (Steps 1-5) — Tonight/Tomorrow
*Get the house in order so we can build on solid ground.*

### Step 1: Rotate the Anthropic API key ⏱️ 10 min
- [ ] Go to console.anthropic.com → regenerate key
- [ ] In Terminal: edit ~/.openclaw/openclaw.json with new key
- [ ] Restart gateway: `openclaw gateway restart`
- **Why now:** Day 3 of exposure. Do it before bed tonight. Non-negotiable.

### Step 2: Set Gemini + xAI API keys ⏱️ 15 min
- [ ] Gemini: https://aistudio.google.com → Get API Key → Create
- [ ] xAI: https://console.x.ai → API Keys → Create
- [ ] In Terminal: add both to ~/.zshrc (export GEMINI_API_KEY=... / export XAI_API_KEY=...)
- [ ] `source ~/.zshrc`
- **Why now:** Unlocks Nano Banana Pro (image gen) + X Search (content monitoring). Both free.

### Step 3: Commit everything to git ⏱️ 15 min
- [ ] Create .gitignore (memory/, .openclaw/, MEMORY.md, USER.md, .env, secrets)
- [ ] `git add` code changes only (settings.tsx, package.json, command-center/, DecipherKit/)
- [ ] Commit + push
- **Why now:** 27+ files uncommitted. One crash = lost work.

### Step 4: Test VibeForge backend ⏱️ 30 min
- [ ] `cd backend && bun run dev`
- [ ] Hit localhost:3000 from browser — does it respond?
- [ ] Test one API endpoint
- [ ] Report: works / broken / what's missing
- **Why now:** JayTee can't answer if it's blocking. I need to find out.

### Step 5: Fill IDENTITY.md ⏱️ 5 min
- [ ] Pick a name, vibe, emoji for the main agent
- [ ] Save it
- **Why now:** Last blank required file. Completes the workspace.

---

## Phase 2: PACKAGE THE PRODUCT (Steps 6-12) — This Weekend
*Turn what we built into something sellable.*

### Step 6: Document the "3-Day Build" journey ⏱️ 1 hour
- [ ] Write a narrative: Day 1 (setup), Day 2 (scale up), Day 3 (full stack)
- [ ] Include: what was built, what it cost ($0 except API), what it can do
- [ ] Save to command-center/the-build-story.md
- **Why:** This IS the marketing. Raw, real, documented.

### Step 7: Create the Exec Agent Pack v1.0 ⏱️ 2 hours
- [ ] Clean up CEO/CTO/COO/CFO SOUL.md files
- [ ] Add AGENTS.md with clear instructions per role
- [ ] Create install script (copies files to ~/.openclaw/workspace-{role}/)
- [ ] Write README with "Deploy in 5 minutes" instructions
- [ ] Package as a ClawHub-publishable skill
- **Why:** This is the #1 sellable product. Package it NOW.

### Step 8: Create a landing page ⏱️ 1 hour
- [ ] Simple HTML page: "AI Exec Team for Solo Founders"
- [ ] What it is, what it does, how to get it
- [ ] Email capture (free tier: Buttondown, Mailchimp, or ConvertKit free)
- [ ] Deploy to Vercel (free) or GitHub Pages (free)
- **Why:** Need a URL to point content to. Can't sell without a storefront.

### Step 9: Write 3 X threads ⏱️ 45 min
- Thread 1: "I built a Fortune 500-style AI exec team in 3 days. Here's exactly how."
- Thread 2: "Google Antigravity vs my setup. Here's what they don't have."
- Thread 3: "I'm a solo founder on disability income building with AI agents. AMA."
- **Why:** Content is free distribution. These three threads cover product, competitive positioning, and personal story.

### Step 10: Record 2 TikTok clips ⏱️ 30 min
- Clip 1: Screen recording of the agent fleet in action (webchat, iMessage, cron running)
- Clip 2: "I asked my AI CEO to analyze my business. Here's what it said."
- **Why:** TikTok is the fastest free reach channel right now.

### Step 11: Set up Brave API key ⏱️ 5 min
- [ ] https://brave.com/search/api/ → free tier (2000 queries/month)
- [ ] Add to OpenClaw config
- **Why:** Unlocks web_search for all agents. Currently broken without it.

### Step 12: Publish exec agent pack to ClawHub ⏱️ 30 min
- [ ] `clawhub publish ./exec-agent-pack --slug exec-team --name "AI Exec Team" --version 1.0.0`
- [ ] Free listing — gets discovered by other OpenClaw users
- **Why:** First distribution channel. Zero cost.

---

## Phase 3: ACTIVATE THE AGENTS (Steps 13-17) — Next Week
*Make the exec team actually DO things.*

### Step 13: Test CEO agent ⏱️ 30 min
- [ ] Send a task: "Review the state of all iMMerSiveTechs projects and give me a strategic recommendation"
- [ ] Grade the output
- [ ] Refine SOUL.md based on results
- **Why:** Proving the product works starts with proving it works for you.

### Step 14: Test CTO agent ⏱️ 30 min
- [ ] Send: "Review the VibeForge Studio codebase and identify the top 3 technical risks"
- [ ] Grade output
- [ ] Refine
- **Why:** CTO needs to be useful for code/architecture decisions.

### Step 15: Test COO agent ⏱️ 30 min
- [ ] Send: "Design a daily operations workflow for a solo founder using OpenClaw"
- [ ] Grade output
- [ ] Refine
- **Why:** COO should design the systems that save JayTee time.

### Step 16: Test CFO agent ⏱️ 30 min
- [ ] Send: "Audit my current costs (API usage, subscriptions, tools) and recommend cuts"
- [ ] Grade output
- [ ] Refine
- **Why:** CFO should help manage the financial constraint.

### Step 17: Install engineering skills for CTO ⏱️ 15 min
- [ ] `clawhub install code-review`
- [ ] `clawhub install architecture`
- [ ] Wire into CTO agent's workspace
- **Why:** CTO needs tools to do code review and architecture decisions.

---

## Phase 4: REVENUE PATH (Steps 18-22) — Week 2
*First dollar.*

### Step 18: Price the exec agent pack ⏱️ 30 min
- [ ] Research: what do OpenClaw/AI agent configs sell for?
- [ ] Options: $29 one-time, $9/mo subscription, free + premium
- [ ] Decision: pick one, ship it
- **Why:** Can't make money without a price.

### Step 19: Set up payment processing ⏱️ 30 min
- [ ] Gumroad (free to start, they take %) or LemonSqueezy (same model)
- [ ] Create product listing
- [ ] Connect to landing page
- **Why:** Zero-cost payment infrastructure. They take a cut, you take the rest.

### Step 20: Launch on X ⏱️ 30 min
- [ ] Post the threads from Step 9
- [ ] Pin the best one
- [ ] Link to landing page in bio
- [ ] Engage with every reply for 48 hours
- **Why:** First public launch. Free distribution.

### Step 21: Post on relevant communities ⏱️ 1 hour
- [ ] OpenClaw Discord
- [ ] r/ClaudeAI, r/LocalLLaMA, r/SideProject, r/EntrepreneurRideAlong
- [ ] Indie Hackers
- [ ] Hacker News (Show HN)
- **Why:** These communities are full of your target user — solo founders using AI.

### Step 22: Set up DecipherKit for TestFlight ⏱️ 1 hour
- [ ] Create eas.json config
- [ ] `eas build --platform ios`
- [ ] `eas submit --platform ios`
- [ ] Invite 5-10 beta testers
- **Why:** Second product ready to validate. Unique concept, zero competition.

---

## Phase 5: COMPOUND (Steps 23-25) — Week 3-4
*Stack the wins.*

### Step 23: Build the daily workflow system ⏱️ 2 hours
- [ ] Morning: CEO agent sends strategic brief via iMessage
- [ ] Morning: COO agent sends prioritized task list
- [ ] Midday: CTO agent sends code review of any new work
- [ ] Evening: CFO agent sends daily cost report
- [ ] Night: Main agent writes daily memory log
- [ ] All automated via cron
- **Why:** This is the "operating system for founders" — and it's content gold.

### Step 24: Launch "Building in Public" series ⏱️ ongoing
- [ ] Daily X post: one thing learned, one thing built, one number
- [ ] Weekly TikTok: recap of the week's progress
- [ ] Monthly email: to growing list from landing page
- **Why:** Compound audience growth. Every post = potential customer.

### Step 25: Evaluate and iterate ⏱️ 1 hour
- [ ] What sold? What didn't? What do people ask about?
- [ ] Refine the exec agent pack based on feedback
- [ ] Identify product #2 to ship (DecipherKit? VibeForge? CerebraSpark?)
- [ ] Update this plan for the next 25 steps
- **Why:** Plans without reflection are just wishful thinking.

---

## Timeline Summary

| Phase | When | Focus | Key Deliverable |
|---|---|---|---|
| 1: Stop the Bleeding | Tonight/Tomorrow | Security, git, backend test | Clean, safe foundation |
| 2: Package the Product | This Weekend | Exec pack, landing page, content | Sellable product + 3 threads |
| 3: Activate the Agents | Next Week | Test all 4 exec agents | Proven, refined agent team |
| 4: Revenue Path | Week 2 | Price, payment, launch | First dollar |
| 5: Compound | Week 3-4 | Workflow automation, content series | Growing audience + recurring value |

## Cost: $0
Everything uses free tiers: ClawHub, Vercel/GitHub Pages, Gumroad/LemonSqueezy, Brave Search, Gemini API, xAI API, X, TikTok, Reddit, Discord.

## Revenue Target
- Week 2: First sale ($29-49)
- Month 1: $200-500 (10-20 sales)
- Month 2: Iterate based on what worked

---

*"The product is the workflow. The story is the marketing. The execution is the moat."*
