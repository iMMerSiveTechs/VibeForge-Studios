# Private Repository Audit — Full Report
**Date:** 2026-03-20 | **Requested by:** VibeForge Studios | **CC:** JayTee

---

# 1. ChurnWise

## What Is It
Subscription tracking and management mobile app. Targets budget-conscious consumers juggling multiple subscriptions (Netflix, Spotify, gym, etc.). Promises spending projections, trial tracking, renewal alerts, and a watchlist. Bundle ID: `com.churnwise.app`.

## Core Architecture
- **Stack:** React Native 0.79.5 + Expo SDK 53, expo-router 5.1.5, TypeScript (strict), React Context API, localStorage (web only)
- **Backend:** None — fully offline/local
- **Auth:** None
- **DB:** localStorage only — no AsyncStorage for native platforms

## Features Inventory
| Feature | Status |
|---------|--------|
| Dashboard (monthly spend, forecast, renewals) | ✅ Complete |
| Subscription list (filter, sort) | ✅ Complete |
| Subscription CRUD (context layer) | ✅ Complete |
| Subscription card (badges, action sheet) | ✅ Complete |
| Paywall screen (UI only) | ✅ Complete |
| Toast notifications | ✅ Complete |
| Glass card / Button components | ✅ Complete |
| Activity logging (context layer) | ✅ Complete |
| Watchlist (context layer) | ✅ Complete |
| **Subscription form (add/edit)** | ❌ Stub — "Coming Soon" |
| **Watchlist screen** | ❌ Stub |
| **Insights screen** | ❌ Stub |
| **Settings screen** | ❌ Stub |
| **Search** | ❌ Stub (UI shown, non-functional) |
| **12-month chart** | ❌ Stub placeholder |
| **Undo delete** | ❌ Stub ("coming soon" callback) |
| **Notifications** | ❌ Not implemented |
| **Dark/light/auto theme** | ❌ Hardcoded dark only |

**3 of 5 tabs are stubs. The subscription form is a stub. Users cannot add subscriptions — the app is effectively non-functional.**

## Monetization
- **Strategy:** Freemium — Free tier (5 subs, 10 watchlist items), Pro unlock
- **Pricing in paywall:** $4.99/mo, $29.99/yr, $99.99 lifetime
- **Implementation: 🔴 NOT IMPLEMENTED** — No RevenueCat, no Stripe, no IAP SDK. `unlockPro()` just sets a localStorage flag. Any user can "unlock Pro" for free by tapping any plan.
- No Terms of Service or Privacy Policy despite being referenced in paywall

## Marketing/Launch
- EAS build config present (dev/preview/production profiles)
- No App Store screenshots, landing page, privacy policy, marketing copy, or launch checklist
- **Not remotely close to launch.**

## Tech Stack Assessment
- ✅ Expo SDK 53 + expo-router — solid modern choice
- ✅ TypeScript strict mode
- 🔴 **Storage is web-only** — `StorageService` uses `localStorage`. No `@react-native-async-storage/async-storage` in deps. On iOS/Android, all data operations silently return `null`. The app is effectively web-only despite being a React Native project.
- 🔴 `Colors.ts` is dead code (never imported, Expo template leftover)
- 🔴 Weak ID generation (`Date.now() + Math.random()`)

## Theme/UI
- Glassmorphism design system with centralized `Theme` object — well-crafted
- Dark space/nebula aesthetic: `#0b0e12` background, accent blues, cyans, nebula pinks
- Hardcoded dark only (`userInterfaceStyle: "dark"`)
- No custom fonts loaded despite `expo-font` in deps

## Code Quality
- TypeScript strict: ✅
- No ESLint config ❌
- No Prettier config ❌
- Zero test files ❌
- Dead code: `Colors.ts`, `WatchlistContext` (screen is stub), `expo-font` (never used)
- Some `any` usage where typed alternatives exist

---

# 2. CEREBRA

## What Is It
AI-powered personal assistant mobile/web app. Version `0.11.0-beta`. Combines AI chat (on-device WebLLM + server fallback), universal TV remote control, macOS system cleaner, document scanning, voice memos, task management, and a modular plugin system — all behind a SaaS subscription.

**Target User:** Power users / tech enthusiasts wanting a single AI-first app for chat, device control, productivity, and creative tools.

## Core Architecture
- **Stack:** React Native 0.79.5 + Expo SDK 53, Expo Router v5, TypeScript
- **Backend:** Python FastAPI (0.110.1) with Uvicorn
- **DB:** MongoDB (pymongo/motor) with in-memory fallback
- **Auth:** HMAC signature-based + Expo SecureStore for API keys
- **Payments:** Stripe (checkout sessions, webhooks, customer portal)
- **AI:** WebLLM (on-device Llama-3.2-1B), OpenAI API (server fallback)
- **State:** AsyncStorage-heavy, React Context

## Features Inventory
### ✅ Complete
- AI Chat with typing indicator, error handling, retry queue, quota gating
- WebLLM on-device AI (Llama-3.2-1B, WebGPU/WASM, abort/timeout)
- Provider cascade: WebLLM → Server → Offline with UI badges
- Theme system: 4 modes (dark, light, lite, midnight), 4 accent colors, persisted
- Stripe billing: checkout sessions, webhooks, setup intents, customer portal
- 6 pricing tiers: Free ($0) → Enterprise ($50/seat) with module includes
- Entitlements with retry, 24h cache, offline fallback
- Quota system with daily resets, soft/hard limits, server sync
- Universal Remote: Roku (SSDP discovery, ECP), Samsung Tizen, LG webOS, Vizio
- macOS Cleaner: profile-based scanning, diff preview, safe mode, scheduling
- Module slot system with catalog, cooldowns, plan limits
- Waitlist with token confirmation, GDPR deletion
- i18n: 6 languages (en/es/hi/uk/ru/zh-CN)
- Learning engine: preference profiles, memory, system prompt building
- HMAC security with canonical signing, clock skew, nonce
- Status dashboard, secure key gate, answer feedback, toast system

### 🟡 Partial
- Home screen (wired but reads from empty stores)
- Wallet (read-only mock shell)
- Realm generation (creates fake glTF stubs, no real ML)
- Voice memo, cleaner remote UI, notifications (routes exist, depth unclear)

### 🔴 Stub
- XR/AR Panel (route listed, no file)
- SmartMarket/Affiliate (route listed, no file)
- License/DMCA (route listed, no file)
- Crypto wallet (config present, zero implementation)
- Backend chat endpoint returns `"pong"` or `f"ack: {last[:64]}"` — mock only

## Monetization
- **Strategy:** Stripe Web Checkout with Freemium Tiers
- **6 tiers:** Free → Basic ($10) → Plus ($19) → Pro ($30) → Max ($50) → Enterprise ($50/seat)
- **Implementation: Mostly Complete** — Stripe checkout, webhooks, customer portal, entitlements, quota gating all work
- ⚠️ No RevenueCat or Apple IAP — deliberately web checkout ("Apple-safe")
- ⚠️ Price IDs from env vars — none are set (will throw ValueError at runtime)

## Marketing/Launch
- `app.json`: name is "frontend", slug is "frontend" — **not branded as Cerebra**
- No bundle ID set
- Some screenshot PNGs exist at repo root
- No landing page, no marketing docs
- README is empty (`# Here are your Instructions`)
- Privacy policy: 3 sentences. Terms exist.
- **Launch readiness: LOW**

## Tech Stack Assessment
- ✅ Expo SDK 53 + FastAPI — appropriate choices
- ✅ WebLLM for on-device AI — forward-thinking
- 🔴 `openai` package in frontend deps — API key leak risk
- 🔴 `.env.local` committed (HMAC secret, ports, AI keys)
- 🔴 Backend duplicates several frontend API routes — maintenance burden
- 🔴 `dev.db` committed to repo
- 🟡 Zustand declared but barely used (AsyncStorage dominates)

## Theme/UI
- "Nebula" theme: 4 modes, 4 accents, gradient text, glass surfaces
- Obsidian ICE variant for premium feel
- Custom component library: Glass, Neon, Ice button variants
- Well-structured but complex — ~35 theme-related files

## Code Quality
- TypeScript strict: ✅
- No ESLint config ❌
- Empty test directory (`tests/__init__.py` only) ❌
- README completely empty ❌
- Some TODO comments scattered in code

---

# 3. emergent-rebuild (Nemura / ImmersiveX)

## What Is It
"Nemura | ImmersiveX Platform" — an AI-powered immersive entertainment and creation platform for XR experiences. Combines AI assistant (Cerebra), 3D world builder, creator marketplace, live streaming, social hub, events system, and virtual currency economy.

**Target User:** VR/AR/XR creators and consumers.

## Core Architecture
- **Stack:** Next.js 15.2.4, React 18, TypeScript, Three.js + R3F
- **UI:** shadcn/ui + Radix UI + Tailwind CSS 3.4
- **Backend (duplicate):** Python FastAPI + Motor (MongoDB)
- **DB:** MongoDB (local, `mongodb://localhost:27017`)
- **Auth:** None — returns hardcoded mock user
- **AI:** Direct API calls to OpenAI, Anthropic, Google

### 🚩 THREE SEPARATE APPS IN ONE REPO:
1. `nemura-app/` — The real Next.js app
2. `backend/` — FastAPI server duplicating the Next.js API routes
3. `frontend/` — Abandoned CRA scaffold ("Building something incredible")

## Features Inventory
| Feature | Status |
|---------|--------|
| Cerebra AI Chat (multi-model) | 🟡 Partial — falls back to mock without keys |
| AI Personas (4 personas) | ✅ Complete |
| 3D World Builder | 🟡 Partial — add/delete/transform, no load/import |
| Marketplace | ❌ Stub — 4 hardcoded items, purchase does nothing |
| Live Streams | ❌ Stub — no WebRTC |
| Events | ❌ Stub — references undefined `<Live>` component (will crash) |
| Social Hub | ❌ Stub |
| Token Bank | 🟡 Partial — API returns mock data |
| NMC Wallet | 🟡 Partial — client-side localStorage, no server validation |
| Voice Packs | 🟡 Partial — mock profiles, no audio playback |
| Navigation | ✅ Complete |
| Dashboard | ✅ Complete (all hardcoded data) |
| Settings | 🟡 Partial — Profile + API keys work, rest "coming soon" |

## Monetization
- **Strategy:** NMC virtual currency ($12-$45 items) + marketplace ($15.99-$39.99) + event tickets ($9.99-$29.99)
- **Implementation: 🔴 NOT IMPLEMENTED** — Payment route says `// Mock payment data - in production this would integrate with Stripe`. No payment SDK. Wallet is client-side localStorage only.

## Marketing/Launch
- No landing page, no marketing docs, no launch checklist
- README is empty
- SEO metadata in layout.tsx
- **Not a native app — no App Store metadata**

## Tech Stack Assessment
- ✅ Next.js 15 + shadcn + Three.js — good choices
- 🔴🔴🔴 **API KEYS COMMITTED IN `.env.local`:**
  - Airtable API key
  - Firebase API key
  - OpenAI API key (`sk-proj-...`)
  - **These keys need to be rotated IMMEDIATELY**
- 🔴 `NEXT_PUBLIC_` prefix on secret keys — exposes API keys to browser
- 🔴 `.next/` build directory committed (100+ build artifacts)
- 🔴 15+ component files dumped at repo root (duplicates)
- 🔴 7 orphaned Swift files at root (no Xcode project)
- 🔴 No authentication — all endpoints open
- 🔴 Massive unused deps (Vercel AI SDK installed but raw fetch used)
- 🔴 Python `requirements.txt` includes pandas, numpy, boto3, cryptography — likely unused

## Theme/UI
- Space/cyberpunk aesthetic: `#0A0E27` background, indigo + cyan + neon pink
- Glassmorphism system with `glass-card` and `cyber-text` classes
- Hardcoded dark mode (`<html className="dark">`)
- DarkModeToggle exists but isn't wired in
- Inter + JetBrains Mono (Google Fonts)

## Code Quality
- TypeScript strict: ✅
- No ESLint config ❌
- No test files ❌
- Committed `.env.local` with real API keys ❌❌❌
- Committed `.next/` build artifacts ❌
- README empty ❌
- Massive file duplication across root, nemura-app, and backend

---

# 4. Nemurium.com

## What Is It
The web-based version of the Nemurium/Nemura ecosystem — an "AI-First Creator Platform for Immersive Worlds." Combines 3D world building (Nemura Engine), digital asset marketplace (Smart Market), AI co-pilot (Cerebra), XR Arcade, creator dashboard with XP system, and audio creation tools (Sonarium).

**Target User:** Digital creators building immersive 3D worlds and selling digital assets.

⚠️ **CRITICAL: FAKE INVESTOR PAGE** — `app/(marketing)/investors/page.tsx` lists fabricated investors (Andreessen Horowitz $15M, Sequoia $8M, Founders Fund $3M, Coinbase Ventures $2M) with fake team members. **Serious credibility and potentially legal risk if published.**

## Core Architecture
- **Stack:** Next.js 14 (App Router), React 18, TypeScript, Three.js + R3F
- **UI:** Tailwind CSS 3.4 + shadcn/ui + Framer Motion
- **State:** Zustand (12+ stores with persistence)
- **DB:** MongoDB via Prisma
- **Auth:** NextAuth 4 (Email via Resend, Google OAuth, Apple OAuth)
- **Payments:** Stripe (checkout, webhooks, subscriptions)
- **AI:** OpenAI API (gpt-3.5-turbo for Cerebra chat)
- **Storage:** AWS S3 + CloudFront CDN
- **Partial:** Convex (stubs exist alongside real functions)
- **i18n:** 4 locales (en, es, ja, de)

### Scale: **2,016 total files** — massively bloated

## Features Inventory
### ✅ Complete
- Auth (Email/Google/Apple via NextAuth)
- Stripe webhook handler with replay defense
- Waitlist system with admin management
- Pricing page (3 tiers: Free/$12/$49)
- XP system with DB persistence
- Design token system
- SEO (sitemap, robots, structured data)
- PWA manifest
- i18n (4 locales)
- 45+ shadcn/ui components
- World Builder state management (Zustand with undo/redo)

### 🟡 Partial
- World Builder UI (components exist but `WORLDBUILDER_UI: false` — disabled)
- Stripe Checkout (market checkout is real, demo checkout returns fake sessions)
- Cerebra AI Chat (calls OpenAI but falls back to hardcoded mock responses)
- Smart Market / NFT (pages + API routes exist, CRUD incomplete)
- Multiplayer (WebRTC components exist, marked backlog)
- Analytics (logs to console only: `// TODO: store to data warehouse`)
- Creator Dashboard, Affiliate System

### 🔴 Stub
- Convex backend (stubs/convex.ts returns noops)
- Firebase (completely stubbed)
- Contact form (`// TODO: send email`)
- 3D asset pipeline (marked backlog)
- Worker service (referenced in render.yaml, directory doesn't exist)
- 314 Phase directories + 87 Module files — appear auto-generated junk

## Monetization
- **Strategy:** SaaS subscriptions + NMC credits + asset marketplace + creator payouts
- **⚠️ THREE DIFFERENT PRICING STRUCTURES across the codebase — not aligned:**
  - PricingSection: Free / Creator ($12/mo) / Studio ($49/mo)
  - commerce/pricing: Free / Creator ($9.99) / Pro ($29.99) / Enterprise
  - Billing route: Pro ($29/mo) / Founder ($99/mo)
- ✅ Stripe SDK initialized, webhook handler with replay defense
- ✅ Market checkout creates real Stripe sessions
- 🟡 Subscription billing route mixes Convex auth with Stripe (conflicts with NextAuth)
- 🔴 Stripe Connect onboarding flow not found
- `.env.local` has placeholder key: `STRIPE_SECRET_KEY=sk_test_emergent`

## Marketing/Launch
- SEO basics: robots.ts, sitemap.ts (only 4 URLs despite 40+ pages), OpenGraph metadata
- PWA manifest, marketing pages (About, Brand, Press, Legal, Investors)
- Waitlist with admin panel
- Pitch deck referenced at `lib/public/docs/Nemurium-PitchDeck.pdf`
- ❌ No screenshots, no launch checklist
- ⚠️ Investor page contains fabricated data

## Tech Stack Assessment
- ✅ Next.js 14, Three.js + R3F, Zustand, Tailwind + shadcn, Stripe, Prisma — all good choices
- 🔴🔴 **DATABASE CONFLICT:** Prisma schema says `provider = "mongodb"` with `@db.ObjectId`, but `.env.local` has PostgreSQL URL and Docker runs PostgreSQL. **These are incompatible — the app cannot work as configured.**
- 🔴🔴 **BACKEND CONFLICT:** Main app uses Prisma + NextAuth. `convex/` has competing schema, auth, billing. `stubs/convex.ts` stubs everything out. Two incompatible backend architectures.
- 🔴 80+ files with macOS copy-paste names (`README 2.md`, `Dockerfile 2`, `.env 3.local`)
- 🔴 314 Phase directories + 87 Module files (auto-generated bloat)
- 🔴 UI components duplicated in 3 locations
- 🔴 Secrets committed in `.env.local`

## Theme/UI
- Premium dark aesthetic with gold/amber accents
- Glassmorphism with Framer Motion animations
- Well-structured design token system in `lib/brand/tokens.ts`
- Hardcoded dark mode
- 335 component files — many duplicated

## Code Quality
- TypeScript strict: ✅
- ESLint config present: ✅
- Zero test files ❌
- Massive duplication and bloat ❌
- Secrets committed ❌
- Conflicting database and backend architectures ❌
- TODOs scattered throughout

---

# 5. RDM-app (Rough Diamonds Music)

## What Is It
Premium music streaming and social platform for music lovers and independent artists. Positions itself as the anti-Spotify — a "Leica of Audio" with lossless quality, AI-powered discovery (Thompson Sampling recommendation engine), social features (Circles, listening rooms), and an artist economy (Vault, Signals, Orbit tiers, NFC physical goods).

**Bundle ID:** `com.roughdiamondsmusic.app` (iOS), `com.rdm.social` (Android)
**Version:** 1.0.0, build 15

## Core Architecture
- **Stack:** Expo SDK 53 + React Native 0.79.2 + TypeScript
- **Styling:** NativeWind (TailwindCSS for RN) + inline StyleSheet
- **Navigation:** React Navigation 7
- **Audio:** expo-av, expo-audio-fft
- **Backend:** Hono (Bun runtime) + Prisma ORM
- **DB:** SQLite (dev), intended PostgreSQL for prod
- **Auth:** Better Auth (email/password)
- **Payments:** RevenueCat (react-native-purchases)
- **AI:** OpenAI API (GPT-4 for genre detection, chat)
- **Shared contracts:** Zod schemas between frontend/backend

**This is by far the most complete and production-ready codebase of the 5.**

## Features Inventory
### ✅ Complete (extensive list)
- Email/password auth with admin auto-grant
- Audio playback (expo-av, background mode)
- Track library with FlashList and search
- Playlists CRUD (collaborative, smart)
- Queue management (shuffle, repeat, crossfade)
- Track upload with metadata extraction
- Content moderation (admin approve/reject)
- Admin panel (6 screens)
- Analytics & trending
- Follow system
- AI chat assistant (OpenAI)
- Search (multi-entity, debounced)
- Subscription UI (RevenueCat + legacy mock)
- Theme/design system (comprehensive gold/platinum tokens)
- 10+ audio visualizations (frequency bars, orbs, particles)
- Onboarding (taste quiz, welcome flow)
- Edit track (full metadata editing)
- Suno importer (universal scraper)
- Synchronized lyrics (LRC format, tap-to-sync)
- Offline download (expo-file-system cache)
- Deep linking (rdmsocial:// scheme)
- Release builder (export for distributors)
- Duplicate detection
- Sonic Pentagram (5-dimension rating)
- Review feed
- RDM Circles (micro-communities)
- Engagement/gamification (streaks, XP, levels, achievements, leaderboard)
- Stats cards (shareable)
- Track sharing (deep link + preview)

### 🟡 Partial
- Artist onboarding (1 of 15 screens built)
- Social feed (mock data, not connected to backend)
- Discovery (hardcoded mock users)
- NFC/Physical Bridge (demo mode)
- Listening rooms (WebSocket setup, primarily single-user)
- Commerce/payouts (schema exists, no real payment processor)
- AI recommendations (Thompson Sampling documented, light on real usage)
- Audio enhance engine (routes exist, needs native modules)
- Content protection (signed URLs implemented, watermarking conceptual)

### 🔴 Stub
- Spatial Audio / Dolby Atmos (future)
- CarPlay / Apple Watch (Phase 3)
- Desktop apps, DMs, stem player, family plans, blockchain anchor

## Monetization
- **Strategy:** Three-tier subscription + artist economy
- **Tiers:** Noir ($4.99/mo), Luxe ($9.99/mo), Elite ($24.99/mo) + Lifetime ($99.99)
- **RevenueCat: ✅ INTEGRATED** — Well-written wrapper with real API keys, PlansScreen, PaywallBanner, PremiumFeatureGate
- ⚠️ Legacy mock subscription system still coexists alongside RevenueCat — potential confusion
- ⚠️ Integration docs say "mock" even though real RevenueCat client exists

## Marketing/Launch
- app.json properly configured with bundle IDs, version, permissions
- `LAUNCH_CHECKLIST.md` exists — comprehensive but **all items unchecked** ⬜
- `DEPLOY.md`, `DEPLOYMENT.md`, `APP_STORE_PRIVACY_LABEL.md` exist
- 🚨 **`associatedDomains` array contains ~1,600 duplicate entries** of `applinks:suno.com` — bloats build, potential iOS entitlements issues
- No landing page or marketing website
- No App Store screenshots in repo

## Tech Stack Assessment
- ✅ Expo SDK 53, Hono + Bun, Prisma, Better Auth, RevenueCat, NativeWind, FlashList — all excellent choices
- ✅ Shared Zod contracts between frontend/backend — good practice
- 🔴 **SQLite in production** — schema says SQLite but Render deployment. SQLite on server = single writer, no concurrent connections. Must migrate to PostgreSQL.
- 🔴 **93 frontend dependencies** — includes unused packages: `@react-three/fiber` + `three` (no 3D screens), both `date-fns` AND `dayjs`, `openai` in frontend (API key leak risk)
- 🔴 `dev.db` committed with real uploaded audio
- 🔴 `.env` files committed with real RevenueCat keys
- 🔴 Patched dependencies (`react-native@0.79.2.patch`) — upgrade friction

## Theme/UI
- "Elite" luxury design: dark background (#0A0A0F), gold/amber accents (#D4AF37, #FFD700), platinum silver (#E5E5E5)
- Multiple glassmorphism variants (standard, premium, elevated, frosted)
- 10+ audio visualizations — genuinely impressive
- Typography: SF Pro Display (iOS), Roboto (Android) — defined but not explicitly loaded
- Consistent luxury feel across screens

## Code Quality
- TypeScript: ✅ (strict not confirmed)
- Prisma schema: 1,606 lines, 30+ models — enormous and comprehensive
- Shared Zod contracts: ✅
- No test files found ❌
- `.env` committed with real keys ❌
- `dev.db` committed ❌
- 1,600 duplicate associatedDomains entries ❌
- Some dead dependencies ❌

---

# CROSS-REPO SUMMARY

## Maturity Ranking (most → least production-ready)

| Rank | Repo | Score | Key Blocker |
|------|------|-------|-------------|
| 1 | **RDM-app** | 7/10 | SQLite in prod, .env committed, no tests |
| 2 | **CEREBRA** | 5/10 | Mock backend chat, .env committed, app.json not branded |
| 3 | **ChurnWise** | 3/10 | Can't add subscriptions, web-only storage, no monetization |
| 4 | **Nemurium.com** | 2/10 | DB conflict, backend conflict, massive bloat, fake investors |
| 5 | **emergent-rebuild** | 2/10 | 3 apps in 1 repo, no auth, API keys committed, mostly stubs |

## Universal Issues (Every Repo)
1. **❌ No tests** — Zero test files across all 5 repos
2. **❌ Secrets committed** — API keys, Stripe keys, RevenueCat keys in `.env` files (all repos except ChurnWise)
3. **❌ README empty/missing** — 4 of 5 repos have empty READMEs
4. **❌ No CI/CD** — No GitHub Actions, no automated builds or checks
5. **❌ Hardcoded dark mode** — All 5 repos have dark-only UIs despite having theme toggle code

## Immediate Actions Required
1. **ROTATE ALL COMMITTED API KEYS** — emergent-rebuild has OpenAI, Firebase, Airtable keys. CEREBRA has HMAC secrets. RDM has RevenueCat keys. Nemurium has Stripe keys. Do this TODAY.
2. **Add `.env*` to `.gitignore`** across all repos and remove committed env files from git history
3. **RDM-app:** Fix the 1,600 duplicate associatedDomains, migrate to PostgreSQL, remove dev.db from repo
4. **Nemurium.com:** Remove or clearly label fake investor page, resolve MongoDB vs PostgreSQL conflict, clean up 400+ duplicate/junk files
5. **emergent-rebuild:** Delete abandoned `frontend/` CRA scaffold, consolidate to single backend, remove root-level duplicate files
6. **ChurnWise:** Implement AsyncStorage for native platforms, build the subscription form (users literally can't use the app without it)
7. **CEREBRA:** Brand the app.json properly, wire up real chat backend, set Stripe price IDs

---

*Report generated 2026-03-20 by OpenClaw audit system*
