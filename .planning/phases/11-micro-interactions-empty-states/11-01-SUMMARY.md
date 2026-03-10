---
phase: 11-micro-interactions-empty-states
plan: 01
subsystem: ui
tags: [react, tailwindcss, css-animations, motion-reduce, empty-state, micro-interactions]

# Dependency graph
requires:
  - phase: 06-sidebar-filters-highlight-dim
    provides: anyFilterActive, weekMatchCount, filteredIds — filter state and computed values used here
  - phase: 07-keyboard-shortcuts
    provides: openNewWithNextSlot callback — reused by the Create Workshop CTA button
  - phase: 04-conflict-detection
    provides: hasConflicts, conflicts array on WorkshopCard — conflict pulse gates on this

provides:
  - Card hover lift animation (translate-y-0.5 + shadow-md, 150ms ease-out) in WorkshopCard
  - Conflict AlertTriangle pulse animation (2s opacity cycle, 1 to 0.35) in WorkshopCard
  - Asymmetric panel slide easing (ease-panel-open on enter, ease-panel-close on exit) in WorkshopPanel
  - Custom Tailwind v4 @theme tokens for easing and animation
  - Empty week state with "No workshops scheduled this week." and Create Workshop CTA button
  - All animations respect prefers-reduced-motion via motion-reduce Tailwind variants

affects:
  - v1.1 milestone — this is the final phase of v1.1 Interactive Polish

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "@keyframes nested inside @theme for Tailwind v4 custom animation utilities"
    - "Asymmetric cubic-bezier easing: snappy open (0.32,0.72,0,1) vs graceful close (0.4,0,0.6,1)"
    - "motion-reduce variants on all animated elements for a11y compliance"
    - "Empty state priority ordering: filter empty state first, then no-workshops state, then grid"

key-files:
  created: []
  modified:
    - src/index.css
    - src/components/calendar/WorkshopCard.jsx
    - src/components/panel/WorkshopPanel.jsx
    - src/pages/ScheduleCalendar.jsx

key-decisions:
  - "@keyframes conflict-pulse must be nested inside @theme block for Tailwind v4 to generate animate-conflict-pulse utility"
  - "transition-[transform,box-shadow] replaces transition-all and hover:brightness-95 — GPU-composited, no layout reflow"
  - "weekWorkshopsCount is a separate memo from weekMatchCount — modifying weekMatchCount would risk breaking filter empty state sentinel (-1)"
  - "Filter empty state checked before empty-week state — !anyFilterActive guard prevents wrong state showing when filters active on empty week"

patterns-established:
  - "Tailwind v4 custom animation: define --animate-X var and @keyframes inside @theme, use as animate-X utility class"
  - "Asymmetric transition easing: conditionally apply ease class based on open/close state"
  - "Empty state priority: most specific (filter) first, then general (no workshops), then default (grid)"

requirements-completed: [INTR-06, INTR-07, INTR-08, EMPT-01]

# Metrics
duration: 2min
completed: 2026-03-10
---

# Phase 11 Plan 01: Micro-Interactions and Empty States Summary

**CSS animations for card hover lift (150ms ease-out translateY + shadow), conflict pulse (2s opacity cycle), asymmetric panel easing (cubic-bezier open/close), and empty week state with Create Workshop CTA — completing v1.1 Interactive Polish milestone**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-10T04:24:38Z
- **Completed:** 2026-03-10T04:26:24Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Added three Tailwind v4 custom tokens in `@theme`: `--ease-panel-open`, `--ease-panel-close`, and `--animate-conflict-pulse` with nested `@keyframes` — generates `ease-panel-open`, `ease-panel-close`, and `animate-conflict-pulse` utility classes
- Updated WorkshopCard.jsx with GPU-composited hover lift (`transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-0.5 hover:shadow-md`) and pulsing AlertTriangle icon (`animate-conflict-pulse` on `hasConflicts`) with `motion-reduce` variants on both
- Updated WorkshopPanel.jsx with conditional asymmetric easing — `ease-panel-open` when `isOpen`, `ease-panel-close` when closing — producing snappy entrance and graceful exit
- Added `weekWorkshopsCount` useMemo and empty week state branch in ScheduleCalendar.jsx showing "No workshops scheduled this week." with a "Create Workshop" button that reuses `openNewWithNextSlot`

## Task Commits

Each task was committed atomically:

1. **Task 1: Add CSS tokens, card hover lift, conflict pulse, and panel easing** - `f6f2f97` (feat)
2. **Task 2: Add empty week state with Create Workshop CTA** - `178faed` (feat)

**Plan metadata:** (docs commit to follow)

## Files Created/Modified

- `src/index.css` — Added `--ease-panel-open`, `--ease-panel-close`, `--animate-conflict-pulse` tokens and `@keyframes conflict-pulse` inside `@theme` block
- `src/components/calendar/WorkshopCard.jsx` — Replaced hover:brightness-95/transition-all with GPU-composited hover lift; added conflict pulse animation to AlertTriangle wrapper
- `src/components/panel/WorkshopPanel.jsx` — Replaced `ease-in-out` with conditional `ease-panel-open`/`ease-panel-close` class on slide panel div
- `src/pages/ScheduleCalendar.jsx` — Added `weekWorkshopsCount` useMemo; added third render branch for empty week state

## Decisions Made

- `@keyframes conflict-pulse` must be nested inside `@theme` for Tailwind v4 to generate the `animate-conflict-pulse` utility class — this is the Tailwind v4 custom animation pattern
- `transition-[transform,box-shadow]` replaces `transition-all hover:brightness-95` — scoped to only GPU-composited properties, avoids layout reflow, preserves click target unchanged
- Separate `weekWorkshopsCount` memo from `weekMatchCount` — `weekMatchCount` returns a `-1` sentinel when no filters active; modifying it would break the existing filter empty state logic
- Filter empty state (`anyFilterActive && weekMatchCount === 0`) checked before empty-week state (`!anyFilterActive && weekWorkshopsCount === 0`) — `!anyFilterActive` guard in the second branch ensures correct priority when a filtered week has no results

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All v1.1 Interactive Polish milestone requirements are now complete (INTR-06, INTR-07, INTR-08, EMPT-01, plus prior EMPT-02/03 from phase 06)
- Milestone v1.1 is complete — application has smooth micro-interactions, accessibility-respecting animations, and clear empty state messaging throughout
- No blockers or concerns

---
*Phase: 11-micro-interactions-empty-states*
*Completed: 2026-03-10*
