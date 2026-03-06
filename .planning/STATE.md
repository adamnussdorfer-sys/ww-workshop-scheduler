# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-05)

**Core value:** Coordinators can see the full weekly workshop schedule at a glance, spot conflicts immediately, and publish changes with confidence.
**Current focus:** Phase 3 — Workshop Detail

## Current Position

Phase: 3 of 7 (Workshop Detail)
Plan: 1 of 3 in current phase
Status: In progress
Last activity: 2026-03-06 — Completed 03-01: Workshop panel shell and click wiring

Progress: [████░░░░░░] 27%

## Performance Metrics

**Velocity:**
- Total plans completed: 6
- Average duration: 2.3 min
- Total execution time: 0.23 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 3 | 7 min | 2.3 min |
| 02-calendar-grid | 2 | 7 min | 3.5 min |
| 03-workshop-detail | 1 | 2 min | 2.0 min |

**Recent Trend:**
- Last 5 plans: 01-02 (1 min), 01-03 (4 min), 02-01 (4 min), 02-02 (3 min), 03-01 (2 min)
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
- [03-01]: WorkshopPanel always mounted in DOM (never conditional) so exit animation plays via translate-x-full
- [03-01]: Panel state (selectedWorkshopId, panelMode, slotContext) lives in ScheduleCalendar — UI state, not domain state
- [03-01]: AbortController.abort() for Escape listener cleanup — cleaner than removeEventListener reference
- [03-01]: e.stopPropagation() on WorkshopCard click prevents future slot-click handler (Plan 03-03) from firing

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-03-06
Stopped at: Completed 03-01-PLAN.md — Workshop panel shell and click wiring complete, proceed to 03-02
Resume file: None
