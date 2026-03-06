# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-05)

**Core value:** Coordinators can see the full weekly workshop schedule at a glance, spot conflicts immediately, and publish changes with confidence.
**Current focus:** Phase 2 — Calendar Grid

## Current Position

Phase: 2 of 7 (Calendar Grid)
Plan: 2 of 3 in current phase
Status: In progress
Last activity: 2026-03-06 — Completed 02-02: Week navigation controls and view toggle tabs

Progress: [████░░░░░░] 24%

## Performance Metrics

**Velocity:**
- Total plans completed: 5
- Average duration: 2.6 min
- Total execution time: 0.22 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 3 | 7 min | 2.3 min |
| 02-calendar-grid | 2 | 7 min | 3.5 min |

**Recent Trend:**
- Last 5 plans: 01-01 (2 min), 01-02 (1 min), 01-03 (4 min), 02-01 (4 min), 02-02 (3 min)
- Trend: -

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Init]: Build on existing Vite + React 19 scaffold (already initialized)
- [Init]: Tailwind CSS for styling, no CSS-in-JS
- [Init]: Local React state only, no state library
- [Init]: Mock data with intentional conflicts to showcase conflict detection UI
- [01-01]: Tailwind v4 CSS-first config via @theme directive — no tailwind.config.js
- [01-01]: Inter font via @fontsource/inter (self-hosted, no CDN dependency)
- [01-01]: BrowserRouter deferred to Plan 02 — design system plan kept focused
- [01-02]: Sidebar collapse state lives in AppShell (not Sidebar) — AppShell owns CSS Grid column width
- [01-02]: NavItem uses end={to === '/'} to prevent root route matching all child paths
- [01-02]: Import from react-router (not react-router-dom) — React Router v7 unified package
- [01-03]: date-fns startOfWeek/addDays/setHours/setMinutes for dynamic week anchoring — avoids stale hardcoded dates
- [01-03]: Conflicts at exact coach IDs/times specified (coach-005 Tue, coach-008 Thu, coach-012 Wed) — required by Phase 4 conflict detection
- [02-01]: Static TYPE_CARD_STYLES lookup object (not dynamic interpolation) ensures Tailwind JIT includes all border/bg classes at build time
- [02-01]: Cancelled workshops filtered inside CalendarGrid, not ScheduleCalendar — filtering colocated with rendering concern
- [02-01]: CalendarGrid maxHeight 600px with overflow-auto — grid scrollable within page layout
- [02-02]: All date-fns week functions use weekStartsOn: 1 — Monday-first anchoring throughout
- [02-02]: Today button uses HTML disabled + opacity-50/cursor-default CSS — no extra state branch needed
- [02-02]: View toggle container uses ml-auto to right-align tabs in navigation bar

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-03-06
Stopped at: Completed 02-02-PLAN.md — Week navigation controls and view toggle tabs added, proceed to 02-03
Resume file: None
