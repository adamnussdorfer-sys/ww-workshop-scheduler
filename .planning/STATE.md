# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-05)

**Core value:** Coordinators can see the full weekly workshop schedule at a glance, spot conflicts immediately, and publish changes with confidence.
**Current focus:** Phase 4 — Conflict Detection

## Current Position

Phase: 4 of 7 (Conflict Detection) — IN PROGRESS
Plan: 2 of 3 in current phase (04-02 complete, awaiting Task 3 human-verify)
Status: Active
Last activity: 2026-03-06 — Completed 04-02: Conflict visualization UI (rings, icons, saturation bars, panel alert)

Progress: [███████░░░] 47%

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
| 03-workshop-detail | 3 | 6 min | 2.0 min |
| 04-conflict-detection | 2 of 3 | 5 min | 2.5 min |

**Recent Trend:**
- Last 5 plans: 03-01 (2 min), 03-02 (2 min), 03-03 (2 min), 04-01 (3 min), 04-02 (2 min)
- Trend: stable

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
- [03-02]: key={workshop?.id ?? 'create'} on WorkshopForm forces remount when switching workshops — cleanest stale draft fix
- [03-02]: initDraft factory centralizes view/create mode initialization in one place
- [03-02]: Conflict stub accepts conflicts=[] prop — Phase 4 can pass array without WorkshopForm refactoring
- [03-02]: Remove from Schedule soft-deletes (Cancelled status) consistent with CalendarGrid filter already in place
- [03-03]: onSlotClick guard (e.target !== e.currentTarget) prevents card clicks triggering create mode — defense-in-depth
- [03-03]: Inactive status checked first in getCoachAvailability before day availability check
- [03-03]: workshopDate parsed from draft.startTime at render time — availability recomputes instantly when start time changes
- [03-03]: Co-Coach dropdown filters out draft.coachId — a coach cannot co-coach their own session
- [04-01]: O(n^2) pairwise loop for double-booking — adequate for mock data scale, no optimization needed
- [04-01]: addConflict helper updates ringColor eagerly on insert — avoids second pass to derive ringColor
- [04-01]: getSaturatedSlots iterates 32 fixed slots (GRID_START_HOUR=7, 32 half-hour slots to 23:00)
- [04-01]: ConflictResult shape established: { conflicts, ringColor: 'red'|'orange'|null, hasConflicts }
- [Phase 04-conflict-detection]: 04-02: CONFLICT_RING static lookup prevents Tailwind JIT purging conflict ring classes (same pattern as TYPE_CARD_STYLES)
- [Phase 04-conflict-detection]: 04-02: Saturation bars use pointer-events-none so workshop card clicks pass through
- [Phase 04-conflict-detection]: 04-02: conflictMap.get(selectedWorkshopId)?.conflicts derived at render time — no separate conflict UI state

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-03-06
Stopped at: Completed 04-02-PLAN.md tasks 1-2 — Conflict visualization UI built. Task 3 awaits human-verify checkpoint (visual inspection at http://localhost:5173).
Resume file: None
