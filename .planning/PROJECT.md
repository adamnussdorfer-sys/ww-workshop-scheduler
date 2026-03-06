# WW Workshop Scheduler

## What This Is

A high-fidelity prototype of a workshop scheduling platform for WeightWatchers' virtual coaching team. Used by coordinators (Kathleen, Sophie) to draft, validate, and publish weekly workshop schedules for ~68 virtual coaches. Demo-ready UI with fake data — no backend needed.

## Core Value

Coordinators can see the full weekly workshop schedule at a glance, spot conflicts immediately, and publish changes with confidence.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Weekly calendar view with workshop event cards
- [ ] Workshop detail side panel (view/edit/create)
- [ ] Real-time conflict detection (double-booking, saturation, buffer violations, availability)
- [ ] Coach availability overlay on calendar
- [ ] Sidebar filters (coach, type, status, market)
- [ ] Coach Roster page with detail panels
- [ ] Draft Manager page with batch publish workflow
- [ ] Realistic mock data (~20 coaches, ~40-50 workshops)
- [ ] WeightWatchers brand colors and professional design

### Out of Scope

- Backend / API integration — prototype uses local state and mock JSON
- Mobile responsive — optimize for desktop 1440px+
- Real authentication — hardcoded user (Kathleen Toth)
- Real notifications — badge count only, no delivery
- Accessibility audit — not required for prototype
- Automated testing — prototype phase

## Context

- Coordinators currently manage schedules manually; this replaces that workflow
- ~68 virtual coaches, mix of Coach Creators (full-time) and Legacy Coaches
- Workshop types include Weekly Connection, All In series, Special Events, Coaching Corner, Movement/Fitness
- Popular time slots (9 AM, 10 AM, 12 PM) often have 4-5 concurrent workshops
- Conflict detection is the critical business logic — coaches get double-booked today
- Existing codebase is a fresh Vite + React 19 scaffold (default template only)

## Constraints

- **Tech stack**: React 18+ (Vite), Tailwind CSS, date-fns, Lucide React — no other frameworks
- **No backend**: All data in React state and local mock JSON files
- **Design**: WeightWatchers brand palette (navy #1A2332, blue #0066CC, coral #E85D4A, etc.)
- **Typography**: Inter or system font stack, 14px base
- **Viewport**: Desktop-optimized, minimum 1280px wide
- **UI feel**: Calm, professional — think Linear/Notion Calendar/Calendly

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Build on existing Vite scaffold | Already initialized with React 19, saves setup time | — Pending |
| Tailwind CSS over custom CSS | Spec requirement, rapid prototyping | — Pending |
| Local state over state library | Prototype scope, no persistence needed | — Pending |
| Fake data with intentional conflicts | Demo must showcase conflict detection UI | — Pending |

---
*Last updated: 2026-03-05 after initialization*
