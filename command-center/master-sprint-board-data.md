# Master Sprint Board — Data Extract
**Source:** Cowork session, Sat 2026-03-21 1:22 AM PDT
**Cross-referenced by:** Main agent (Forge)

---

## Ship Lanes (Ready or Near-Ready)

| Project | Score | Status | Blocker |
|---|---|---|---|
| SyncSimp | 7/10 | Needs metadata only (privacy policy, screenshots, icon) | JayTee: App Store creds + RevenueCat |
| RDM-app | 7/10 | 35+ features, RevenueCat. Needs SQLite→PostgreSQL, key rotation | Tech debt cleanup (3-4 weeks) |

## Build Lanes (Active, Not Ship-Ready)

| Project | Score | Key Issue |
|---|---|---|
| VibeForge Studios | 6/10 | Platform play. ~~27 uncommitted files~~ FIXED. ~~Decipher path broken~~ VERIFIED OK. |
| JobForge / EstimateOS | 5/10 | Pricing engine works. Needs name decision + AI backend + Stripe |
| ChurnWise | — | Core flow broken (can't add subscriptions). Paywall is localStorage flag |
| CEREBRA / CerebraSpark | 5/10 | Stripe billing works but chat is mock. App.json branded wrong |
| Habbit | 4/10 | 745 LOC core logic, stuck in zip. Needs Expo migration |

## Research / Strategy

| Project | Status |
|---|---|
| Nemurium | 4 duplicate repos. Fake investor page = legal risk. Strong brand vision. |
| VibeForge Vault | Concept — workflow hub / cognitive archive |
| VibeForge Display | Concept — macOS display utility |

## Creative

| Project | Status |
|---|---|
| Rough Diamonds Music | Active creative output. App side = RDM-app |

## NEW intel from Cowork I didn't have:

1. **SyncSimp is 7/10 and closest to App Store** — I wasn't tracking this. Code audit passed Dec 2025. Only needs metadata.
2. **RDM-app has 35+ features** — more substantial than I realized
3. **JobForge has a working pricing engine** — didn't know this
4. **CEREBRA has working Stripe billing** — didn't know this either
5. **Habbit has 745 LOC of solid core logic** — was dismissing it as empty
6. **Nemurium fake investor page = legal risk** — needs immediate attention
7. **Cross-cutting: 0 test suites across 14 repos, 5+ leaked API keys**
8. **THE-50 items referenced** — Cowork has a 50-item priority list I don't have access to

## Corrections to my earlier audit:
- I said ChurnWise/CerebraSpark/Habit were "empty shells" — WRONG. They have real code.
- I said "no product definitions" — WRONG. Cowork has deeper context on all of them.
- SyncSimp wasn't even on my radar as a ship candidate. It should be #1 or #2.

## Priority Stack Debate

**Cowork's order:** SyncSimp → RDM-app → VibeForge → JobForge
**CEO Agent's order:** Exec Agent Pack → DecipherKit → Consulting
**My recommendation:** Both are right for different reasons.
- Cowork's order is based on EXISTING code readiness
- CEO's order is based on SPEED to first dollar with zero additional build

**Resolution:** Ship the exec agent pack THIS WEEK (already packaged, $0 build cost). SIMULTANEOUSLY prep SyncSimp for App Store (JayTee provides metadata). They're not competing priorities — one is digital product, one is App Store.

---

*Saved: Sat 2026-03-21 1:22 AM PDT*
