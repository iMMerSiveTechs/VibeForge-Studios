# VibeForge Studios LLC — Ecosystem Website PRD

## Project Overview
Premium cinematic marketing + ecosystem site for VibeForge Studios LLC.
**NOT a web app** — landing/waitlist site with legal pages, per-product theming, and contact form.

## Architecture
- **Frontend**: React SPA + react-router-dom + react-helmet-async + TailwindCSS
- **Backend**: FastAPI + MongoDB
- **Theming**: CSS variables via `[data-theme]` attribute on `<html>` — 4 themes: studio (default), habit, studioapp, desk
- **Logo**: `/public/brand/vibeforge-logo.png` (VibeForge Studios neon forge logo)

## Routes Implemented
| Route | Status | Theme |
|-------|--------|-------|
| `/` | DONE | studio |
| `/products` | DONE | studio |
| `/products/habit` | DONE | habit |
| `/products/studio` | DONE | studioapp |
| `/products/desk` | DONE | desk |
| `/about` | DONE | studio |
| `/support` | DONE | studio |
| `/privacy` | DONE | studio |
| `/terms` | DONE | studio |
| `/habit/privacy` | DONE | habit |
| `/habit/terms` | DONE | habit |

## Backend Endpoints
| Endpoint | Method | Status |
|----------|--------|--------|
| `/api/` | GET | DONE |
| `/api/waitlist` | POST | DONE |
| `/api/waitlist/count` | GET | DONE |
| `/api/support` | POST | DONE |

## Features Implemented
- [x] Multi-page routing (11 routes)
- [x] Global nav with Products dropdown + "Join Waitlist" CTA
- [x] Global Footer with all legal links + Google Doc links + Nemurium attribution
- [x] WaitlistModal: email + product selector + optional goal (habit only) + honeypot
- [x] Per-page inline waitlist forms (Habit, Studio, Desk pages)
- [x] Duplicate detection on waitlist (friendly message)
- [x] Rate limiting (15 req/hr waitlist, 10 req/hr support per IP)
- [x] Support contact form with DB persistence
- [x] Home: hero + ecosystem tiles + pipeline + principles + CTA
- [x] Products hub: product cards with theme accent strips
- [x] Habit page: hero with chips, features, pricing (Core/Pro/Elite), Subscription Agreement, trust block, FAQ (12), waitlist
- [x] Studio App page: deliverables, modules, audience, FAQ (10), waitlist
- [x] Desk page: tile gallery mock (matching app screenshots), Scan to Desk, modules, 8 themes + 6 design packs, FAQ (12), waitlist
- [x] About page: mission, ecosystem, principles, privacy stance
- [x] Support page: contact form + FAQ (6) + legal links
- [x] Privacy page (/privacy): website privacy policy
- [x] Terms page (/terms): website terms of service
- [x] Habit Privacy (/habit/privacy): full policy + "View source document" link
- [x] Habit Terms (/habit/terms): full terms + "View source document" link
- [x] App Store + Google Play buttons (disabled/Coming Soon)
- [x] SEO meta tags via react-helmet-async per route
- [x] sitemap.xml + robots.txt
- [x] CSS variable theme system (4 themes)
- [x] Responsive design (mobile-first)
- [x] Data-testid on all interactive elements

## CSS Theme Tokens
```
[data-theme="studio"]     — Neon Forge: black void + cyan→violet→magenta
[data-theme="habit"]      — Dark Premium Cyan Glass: navy + cyan accents
[data-theme="studioapp"]  — Technical Neon Pipeline: black + cyan→magenta
[data-theme="desk"]       — Midnight Terminal Modular: navy + forest green + yellow
```

## Legal Links
- Habit Terms Google Doc: https://docs.google.com/document/d/17meUk5SNoVh0jY6mzxd24Rcmmw15SqVMRWYqJAc201Q/edit?usp=drivesdk
- Habit Privacy Google Doc: https://docs.google.com/document/d/19yeXgkDZ2WP4N3SpKb7wyOb3Ar4_SJhLPdzJpW_TlWs/edit?usp=drivesdk

## Contact
Support email: immersivetechs@icloud.com
Governing law: California, USA

## User Personas
1. **Indie founder** — building mobile apps, wants Studio App early access
2. **High-performer** — wants identity-first habit tracking, waitlists for Habit
3. **Systems thinker** — wants modular productivity desk tool, joins Desk waitlist
4. **Legal/compliance reviewer** — checks privacy/terms pages

## What's Been Implemented (February 2026)
- Full MVP: all 11 routes, waitlist DB, support DB, per-product theming, legal pages
- Testing: 100% backend, 95% frontend — all core flows pass

## Prioritized Backlog (P0/P1/P2)

### P1 — Next Phase
- Add waitlist admin endpoint (view all signups) — useful for monitoring
- OG images: per-product Open Graph images (currently default meta only)
- JSON-LD schema injection (removed due to react-helmet-async v2 incompatibility — can be added via index.html static script instead)
- Email confirmation on waitlist signup (SendGrid/Resend integration)

### P2 — Future
- Add 4th product page when new product launches (use existing product page template)
- Waitlist count display ("X founders waiting") 
- Founder email blast system when products launch
- Admin dashboard for viewing waitlist + support messages
- Google Analytics / privacy-respecting analytics integration
