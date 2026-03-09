# WW Workshop Scheduler

## What This Is

A high-fidelity prototype of a workshop scheduling platform for WeightWatchers' virtual coaching team. Coordinators (Kathleen, Sophie) use it to draft, validate, and publish weekly workshop schedules for ~68 virtual coaches. Features a weekly calendar grid with conflict detection, workshop detail panel with editing, and click-to-create workflow. Demo-ready UI with mock data — no backend needed.

## Core Value

Coordinators can see the full weekly workshop schedule at a glance, spot conflicts immediately, and publish changes with confidence.

## Requirements

### Validated

- ✓ App shell with collapsible sidebar, top bar, 3-page routing — v1.0
- ✓ WW brand design system (navy/blue/coral, Inter font, 14px base) — v1.0
- ✓ Weekly calendar grid (Mon-Sun, 6AM-10PM, 30-min) with workshop cards — v1.0
- ✓ Workshop type color coding and status dots — v1.0
- ✓ Week navigation (prev/next arrows, Today button) — v1.0
- ✓ Slide-in detail panel with 9 editable fields and action buttons — v1.0
- ✓ Click-to-create on empty time slots with pre-filled date/time — v1.0
- ✓ Coach availability-aware dropdown (green/gray with reason) — v1.0
- ✓ Conflict detection: double-booking, buffer violations, availability, saturation — v1.0
- ✓ Visual conflict indicators: card rings, AlertTriangle icons, saturation bars, panel alerts — v1.0
- ✓ Realistic mock data: 18 coaches, 48 workshops, 3 intentional conflicts — v1.0

### Active

- [ ] Sidebar filters (coach, type, status, market) with highlight/dim
- [ ] Coach availability overlay on calendar grid
- [ ] Coach Roster page with sortable table and detail panel
- [ ] Draft Manager page with batch publish and confirmation modal
- [ ] Micro-interactions (hover lift, status transitions, toast notifications)
- [ ] Keyboard shortcuts (arrows for weeks, T/Esc/N)
- [ ] Empty states with contextual actions

### Out of Scope

- Backend / API integration — prototype uses local state and mock JSON
- Mobile responsive — optimize for desktop 1440px+
- Real authentication — hardcoded user (Kathleen Toth)
- Real notifications — badge count only, no delivery
- Accessibility audit — not required for prototype
- Automated testing — prototype phase (vitest used only for conflict engine)
- Real-time collaboration — single-user prototype
- Coach self-service portal — coordinator tool only

## Context

Shipped v1.0 with 2,629 LOC (JSX/JS/CSS) across 4 phases.
Tech stack: React 19, Vite 8, Tailwind CSS v4, date-fns, Lucide React, vitest.
16 passing tests for conflict detection engine.
All mock workshop dates dynamically anchored to current week via date-fns.

## Constraints

- **Tech stack**: React 19 (Vite 8), Tailwind CSS v4, date-fns, Lucide React — no other frameworks
- **No backend**: All data in React state and local mock JS files
- **Design**: WeightWatchers brand palette (navy #1A2332, blue #0066CC, coral #E85D4A)
- **Typography**: Inter font (self-hosted via @fontsource), 14px base
- **Viewport**: Desktop-optimized, minimum 1280px wide
- **UI feel**: Calm, professional — think Linear/Notion Calendar/Calendly

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Build on existing Vite scaffold | Already initialized with React 19, saves setup time | ✓ Good |
| Tailwind CSS v4 with CSS-first @theme | Spec requirement, rapid prototyping, no config file needed | ✓ Good |
| Local state over state library | Prototype scope, no persistence needed | ✓ Good — useState sufficient for all state |
| Mock data with intentional conflicts | Demo must showcase conflict detection UI | ✓ Good — 3 conflicts detected automatically |
| Dynamic week anchoring via date-fns | Avoids stale hardcoded dates | ✓ Good — workshops always on current week |
| Static lookup objects for Tailwind classes | Prevents JIT purging of dynamic classes | ✓ Good — used for TYPE_CARD_STYLES, STATUS_DOT_COLORS, CONFLICT_RING |
| Always-mounted panel with translate-x | Enables smooth exit animation | ✓ Good |
| TDD for conflict engine | Complex business logic benefits from test-first | ✓ Good — 16 tests, caught GRID_START_HOUR bug |
| O(n^2) pairwise conflict detection | Adequate for mock data scale (~48 workshops) | ✓ Good — no performance issues |
| Panel state in ScheduleCalendar | UI state collocated with the page that owns it | ✓ Good — clean prop threading |

---
*Last updated: 2026-03-09 after v1.0 milestone*
