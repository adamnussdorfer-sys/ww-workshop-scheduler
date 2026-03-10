---
phase: 10-availability-overlay
plan: 01
subsystem: ui
tags: [react, tailwind, calendar, overlay, date-fns, lucide-react]

# Dependency graph
requires:
  - phase: 09-draft-manager-page
    provides: AppContext with filters state (filters.coaches array)
  - phase: 06-sidebar-filters-highlight-dim
    provides: filter state in AppContext used for coach-scoped overlay
provides:
  - availabilityBands.js pure utility with getAvailabilityBands, COACH_OVERLAY_COLORS, and shared grid constants
  - toggleable Availability button in ScheduleCalendar nav bar
  - semi-transparent colored coach availability bands rendered in CalendarGrid day columns
affects:
  - future calendar phases that modify CalendarGrid or ScheduleCalendar

# Tech tracking
tech-stack:
  added: []
  patterns:
    - constants extracted to utility module and re-imported into component to avoid duplication (GRID_START_HOUR/PX_PER_HOUR now owned by availabilityBands.js)
    - static Tailwind class array for per-coach color assignment (COACH_OVERLAY_COLORS) — same JIT-safe pattern as TYPE_CARD_STYLES in WorkshopCard.jsx
    - pointer-events-none absolute overlay bands below workshop cards (z-index: 0) — mirrors saturation bar pattern
    - useMemo short-circuit (returns empty Map when showOverlay===false) to avoid 126-band computation on every render
    - stable coachIndex color mapping: compute all bands then filter to active coach set, preserving index across filter changes

key-files:
  created:
    - src/utils/availabilityBands.js
  modified:
    - src/pages/ScheduleCalendar.jsx
    - src/components/calendar/CalendarGrid.jsx

key-decisions:
  - "Grid constants (GRID_START_HOUR, GRID_END_HOUR, PX_PER_HOUR, PX_PER_MIN, GRID_HEIGHT) extracted to availabilityBands.js and imported back into CalendarGrid — eliminates duplication risk identified in RESEARCH.md Pitfall 3"
  - "Stable coachIndex approach: pass full coaches array to getAvailabilityBands then filter bands by coachFilterSet — preserves consistent coach-to-color mapping regardless of active filter state"
  - "showOverlay state lives in ScheduleCalendar (not AppContext) — overlay is calendar-view-local, no cross-page persistence needed"
  - "Eye/EyeOff icon toggle on Availability button — consistent with lucide-react icons already used in nav bar"

patterns-established:
  - "Overlay bands pattern: absolute positioned, pointer-events-none, z-index 0, rendered before workshop cards in DOM order"
  - "Filter-scoped overlay: useApp() in CalendarGrid to access filters.coaches when overlay needs to respect filter state"

requirements-completed: [OVER-01, OVER-02]

# Metrics
duration: 2min
completed: 2026-03-10
---

# Phase 10 Plan 01: Availability Overlay Summary

**Toggleable coach availability overlay with semi-transparent per-coach colored bands in CalendarGrid day columns, filter-scoped to active coaches, using pointer-events-none so workshop card clicks pass through**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-10T04:04:28Z
- **Completed:** 2026-03-10T04:06:35Z
- **Tasks:** 2
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments
- Created `availabilityBands.js` pure utility exporting `getAvailabilityBands`, `COACH_OVERLAY_COLORS` (12-color static Tailwind array), and all shared grid constants
- Added Availability toggle button in ScheduleCalendar nav bar with Eye/EyeOff icon and active/inactive Tailwind styling
- Rendered per-coach availability bands in CalendarGrid using `pointer-events-none` absolute divs at z-index 0, placed before workshop cards in DOM order
- Coach filter integration: when `filters.coaches` is active, only those coaches' bands render (stable coachIndex preserved for consistent coloring)
- Inactive coaches (coach-014, coach-017) correctly excluded via `status === 'inactive'` check in utility
- `npx vite build` succeeds with no errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create availability bands utility and add overlay toggle to ScheduleCalendar** - `b610244` (feat)
2. **Task 2: Render availability bands in CalendarGrid day columns** - `71225c1` (feat)

## Files Created/Modified
- `src/utils/availabilityBands.js` - Pure utility: getAvailabilityBands(coaches, day) -> band[], COACH_OVERLAY_COLORS palette, shared grid constants (GRID_START_HOUR, GRID_END_HOUR, PX_PER_HOUR, PX_PER_MIN, GRID_HEIGHT)
- `src/pages/ScheduleCalendar.jsx` - Added Eye/EyeOff imports, showOverlay state, Availability toggle button, showOverlay prop passed to CalendarGrid
- `src/components/calendar/CalendarGrid.jsx` - Replaced local grid constants with imports from availabilityBands.js, added useApp for filters, added availabilityBands useMemo, rendered overlay band divs per day column

## Decisions Made
- Grid constants extracted to `availabilityBands.js` and imported back into `CalendarGrid.jsx` — eliminates the constant duplication risk flagged in RESEARCH.md Pitfall 3. CalendarGrid's local constant declarations were removed entirely.
- Stable coachIndex approach for consistent color mapping: `getAvailabilityBands` receives the full coaches array (preserving natural indices for color assignment), then the result is filtered by `coachFilterSet` in the useMemo — so toggling coach filters doesn't shift the color assigned to any coach.
- `showOverlay` state lives in ScheduleCalendar page component, not AppContext — the overlay is calendar-view-local with no cross-page relevance.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 10 complete. Both requirements (OVER-01, OVER-02) satisfied.
- No blockers or concerns.
- The `availabilityBands.js` utility and shared grid constants are ready for any future phase that needs time-to-pixel math or availability data.

---
*Phase: 10-availability-overlay*
*Completed: 2026-03-10*

## Self-Check: PASSED

- FOUND: src/utils/availabilityBands.js
- FOUND: src/pages/ScheduleCalendar.jsx
- FOUND: src/components/calendar/CalendarGrid.jsx
- FOUND: .planning/phases/10-availability-overlay/10-01-SUMMARY.md
- FOUND: commit b610244 (Task 1)
- FOUND: commit 71225c1 (Task 2)
