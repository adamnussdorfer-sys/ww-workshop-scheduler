---
phase: 06-sidebar-filters-highlight-dim
plan: 02
subsystem: ui
tags: [react, filter, dim-effect, highlight, opacity, tailwind]

# Dependency graph
requires:
  - phase: 06-sidebar-filters-highlight-dim-plan-01
    provides: filterEngine.js (getMatchedWorkshopIds, hasActiveFilters), AppContext filters/setFilters state, Sidebar filter checkboxes
  - phase: 05-context-foundation-toast-system
    provides: AppContext with setFilters, useApp hook
provides:
  - FilterPills.jsx — removable pill strip for all four filter dimensions with Clear all
  - CalendarGrid dim/highlight effect via isFiltered prop and opacity-25 pointer-events-none
  - ScheduleCalendar filter orchestration: filteredIds, anyFilterActive, weekMatchCount, empty state
  - Personalized empty state message for single-coach filter with no matches this week
affects: [07, 08, 09, 10, CalendarGrid consumers]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Filter read side: pure computed values via useMemo (anyFilterActive, filteredIds, weekMatchCount) — no local state copy"
    - "Dim effect: isFiltered prop flows ScheduleCalendar -> CalendarGrid -> WorkshopCard — never mutates workshop array"
    - "Safe prop defaults: filteredIds=new Set(), anyFilterActive=false on CalendarGrid — works without filter context"
    - "Empty state detection: weekMatchCount counts only non-Cancelled workshops in current week matching filteredIds"

key-files:
  created:
    - src/components/filters/FilterPills.jsx
  modified:
    - src/pages/ScheduleCalendar.jsx
    - src/components/calendar/CalendarGrid.jsx
    - src/components/calendar/WorkshopCard.jsx

key-decisions:
  - "weekDays converted to useMemo to avoid stale reference in weekMatchCount useMemo dependency array"
  - "weekMatchCount returns -1 sentinel when no filters active — avoids false empty state trigger"
  - "isFiltered computed in CalendarGrid (not ScheduleCalendar) — keeps filtering logic co-located with rendering"
  - "FilterPills reads filters/coaches from useApp() directly — no prop drilling through ScheduleCalendar"
  - "coachMap built inline in FilterPills (not memoized) — component is leaf, coaches array is stable"

patterns-established:
  - "Dim-not-remove: pass full workshops array always; dim effect is visual only via isFiltered prop"
  - "pointer-events-none on dimmed cards: click passes through to day column slot handler"
  - "Conditional strip: FilterPills returns null when pills array is empty — no wrapper div needed"

requirements-completed: [FILT-05, FILT-07, EMPT-02, EMPT-03]

# Metrics
duration: 3min
completed: 2026-03-09
---

# Phase 6 Plan 02: Sidebar Filters Highlight/Dim Summary

**FilterPills strip with removable pills, CalendarGrid 25% dim effect with pointer-events-none, and personalized empty state for zero-match filter results**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-09T21:46:52Z
- **Completed:** 2026-03-09T21:49:53Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Created FilterPills.jsx that renders dimension-prefixed removable pills (Coach:/Type:/Status:/Market:) and a Clear all button, returning null when no filters are active
- Wired ScheduleCalendar to import filterEngine functions and compute anyFilterActive/filteredIds/weekMatchCount via useMemo, with empty state displaying personalized message for single-coach filters
- Updated CalendarGrid to accept filteredIds and anyFilterActive props (with safe defaults) and compute isFiltered per-card
- Updated WorkshopCard to dim non-matching cards to opacity-25 with pointer-events-none so clicks pass through to the day column slot handler

## Task Commits

Each task was committed atomically:

1. **Task 1: Create FilterPills component and wire ScheduleCalendar filter orchestration** - `c789686` (feat)
2. **Task 2: Add isFiltered dim effect to CalendarGrid and WorkshopCard** - `4f61f57` (feat)

## Files Created/Modified

- `src/components/filters/FilterPills.jsx` - Removable pill strip for all four filter dimensions; reads filters/coaches from useApp(); returns null when empty
- `src/pages/ScheduleCalendar.jsx` - Added filterEngine imports, anyFilterActive/filteredIds/weekMatchCount computed values, FilterPills conditional render, empty state JSX, filteredIds/anyFilterActive props to CalendarGrid
- `src/components/calendar/CalendarGrid.jsx` - Added filteredIds/anyFilterActive props with safe defaults; computes isFiltered per workshop card and passes to WorkshopCard
- `src/components/calendar/WorkshopCard.jsx` - Added isFiltered=false prop; appends opacity-25 pointer-events-none to card className when isFiltered is true

## Decisions Made

- `weekDays` converted from plain array to `useMemo` — the value was referenced in `weekMatchCount`'s dependency array, which requires a stable reference to avoid infinite re-renders
- `weekMatchCount` returns `-1` sentinel when `anyFilterActive` is false — prevents the empty state from appearing incorrectly when no filters are applied
- `isFiltered` is computed inside CalendarGrid's render loop (not in ScheduleCalendar) — keeps the dim logic co-located with card rendering and avoids threading a derived array down
- FilterPills reads from `useApp()` directly — eliminates prop drilling and keeps the component self-contained

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] weekDays converted to useMemo for stable reference**
- **Found during:** Task 1 (ScheduleCalendar filter orchestration)
- **Issue:** Plan's code placed weekMatchCount useMemo above weekDays, which was defined as a plain `Array.from(...)` after it — this would cause a ReferenceError at runtime
- **Fix:** Wrapped weekDays computation in useMemo so it has a stable reference and the weekMatchCount dependency array is valid; restructured component to define weekDays before the filter computed values
- **Files modified:** src/pages/ScheduleCalendar.jsx
- **Verification:** npm run build succeeds with no errors
- **Committed in:** c789686 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — ordering/reference bug)
**Impact on plan:** Essential fix for runtime correctness. No scope creep.

## Issues Encountered

None beyond the ordering fix documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Complete filter pipeline is operational: Sidebar writes -> AppContext holds -> filterEngine computes -> CalendarGrid dims -> FilterPills displays -> empty state shows
- All four filter dimensions (coach, type, status, market) are fully wired end-to-end
- Filters persist across week navigation (weekDays recomputes on currentWeekStart change, filteredIds/anyFilterActive recompute on filters change)
- Ready for Phase 6 Plan 03 if applicable, or Phase 7

## Self-Check: PASSED

- FOUND: src/components/filters/FilterPills.jsx
- FOUND: src/pages/ScheduleCalendar.jsx
- FOUND: src/components/calendar/CalendarGrid.jsx
- FOUND: src/components/calendar/WorkshopCard.jsx
- FOUND: .planning/phases/06-sidebar-filters-highlight-dim/06-02-SUMMARY.md
- FOUND commit: c789686 (Task 1)
- FOUND commit: 4f61f57 (Task 2)

---
*Phase: 06-sidebar-filters-highlight-dim*
*Completed: 2026-03-09*
