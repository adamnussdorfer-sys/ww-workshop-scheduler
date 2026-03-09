---
phase: 02-calendar-grid
plan: 01
subsystem: calendar-grid
tags: [react, date-fns, calendar, workshop-card, schedule-view]

# Dependency graph
requires:
  - phase: 01-03
    provides: AppContext with workshops/coaches arrays, date-fns installed, mock data
provides:
  - CalendarGrid component: Mon-Sun column grid with 6AM-10PM time axis and absolutley positioned workshop cards
  - WorkshopCard component: type-colored cards with status dot, time, title, coach/co-coach
  - ScheduleCalendar page: wired to AppContext, renders current week via CalendarGrid
affects: [02-02-header-navigation, 03-workshop-management, 05-conflict-detection]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TYPE_CARD_STYLES and STATUS_DOT_COLORS as static lookup objects — no dynamic Tailwind class interpolation"
    - "getEventPosition() converts ISO timestamps to absolute top/height pixel values using PX_PER_MIN"
    - "coachMap via useMemo(Map) keyed by coach.id for O(1) coach name lookups in WorkshopCard"
    - "Slot lines rendered as 32 divs (one per 30-min slot), hour lines vs half-hour distinguished by border opacity"
    - "Overlapping event offset: left = 2 + idx * 4 so stacked cards remain visually distinct"

key-files:
  created:
    - src/components/calendar/CalendarGrid.jsx
    - src/components/calendar/WorkshopCard.jsx
  modified:
    - src/pages/ScheduleCalendar.jsx

key-decisions:
  - "Static TYPE_CARD_STYLES lookup object (not dynamic interpolation) ensures Tailwind JIT includes all border/bg classes at build time"
  - "CalendarGrid maxHeight capped at 600px with overflow-auto so page remains scrollable without extending viewport"
  - "Cancelled workshops filtered in CalendarGrid (not ScheduleCalendar) to keep filtering colocated with rendering logic"

# Metrics
duration: 4min
completed: 2026-03-06
---

# Phase 2 Plan 01: Calendar Grid Summary

**Weekly calendar grid with 6AM-10PM time axis, 30-min slot lines, and color-coded workshop cards built via CalendarGrid + WorkshopCard components wired to AppContext**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-06T06:11:49Z
- **Completed:** 2026-03-06T06:15:31Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Created `CalendarGrid.jsx` (152 lines): Mon-Sun columns with sticky header row, 6AM-10PM time gutter, 32 slot row lines per column (16 hours x 2 slots/hr), and absolutely positioned workshop event cards computed from ISO timestamps
- Created `WorkshopCard.jsx` (46 lines): type-colored cards using static `TYPE_CARD_STYLES` lookup, `STATUS_DOT_COLORS` for Draft/Published/Cancelled status dots, time formatted via date-fns, coach name and co-coach name from coachMap
- Updated `ScheduleCalendar.jsx`: replaced placeholder with `useApp()` hook, current week computed via `startOfWeek + addDays`, CalendarGrid receives weekDays/workshops/coaches props
- Build succeeds at 287 KB JS bundle with no errors
- All 5 workshop types have distinct color coding (blue, purple, coral, teal, green left border)
- `getEventPosition()` function correctly maps startTime/endTime ISO strings to absolute top/height pixel values at 64px/hour
- Cancelled workshops excluded from calendar display
- Overlapping workshops (conflict pairs) offset horizontally via `idx * 4px` left offset

## Task Commits

Each task was committed atomically:

1. **Task 1: Create CalendarGrid and WorkshopCard components** - `785cff5` (feat)
2. **Task 2: Wire CalendarGrid into ScheduleCalendar page** - `067aabd` (feat)

## Files Created/Modified

- `src/components/calendar/CalendarGrid.jsx` - Grid with time axis, day headers (isToday highlight), slot lines, and positioned WorkshopCard instances; coachMap via useMemo
- `src/components/calendar/WorkshopCard.jsx` - Type-colored event cards with STATUS_DOT_COLORS, time label, title, coach/co-coach name
- `src/pages/ScheduleCalendar.jsx` - Page component using useApp() to get workshops/coaches, computes current weekDays, renders CalendarGrid in scrollable flex layout

## Decisions Made

- Used static `TYPE_CARD_STYLES` and `STATUS_DOT_COLORS` lookup objects (not dynamic string interpolation) to ensure all Tailwind JIT classes are statically analyzable and included in the production CSS bundle.
- Filtered cancelled workshops inside CalendarGrid rather than in ScheduleCalendar — keeps the filtering logic colocated with the rendering concern.
- CalendarGrid body uses `maxHeight: 600px` with `overflow-auto` so the grid is scrollable within the page layout rather than extending the full 1024px height unconditionally.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- ScheduleCalendar page displays weekly grid with all mock workshops from AppContext
- CalendarGrid is ready to receive week navigation props (Plan 02 adds useState + header nav)
- WorkshopCard is ready for click-to-edit interaction (Plan 03 scope)
- Conflict pairs (ws-021/022, ws-033/034, ws-027/028) are both visible on the grid with horizontal offsets
- No blockers

## Self-Check: PASSED

- src/components/calendar/CalendarGrid.jsx: FOUND (152 lines, >= 80 minimum)
- src/components/calendar/WorkshopCard.jsx: FOUND (46 lines, >= 30 minimum)
- src/pages/ScheduleCalendar.jsx: FOUND (21 lines, >= 15 minimum)
- Commit 785cff5 (Task 1): FOUND
- Commit 067aabd (Task 2): FOUND
- npm run build: PASSED (287 KB bundle, no errors)
- GRID_START_HOUR constant: VERIFIED in CalendarGrid.jsx
- getEventPosition function: VERIFIED in CalendarGrid.jsx
- TYPE_CARD_STYLES lookup: VERIFIED in WorkshopCard.jsx
- STATUS_DOT_COLORS lookup: VERIFIED in WorkshopCard.jsx
- coachMap via useMemo: VERIFIED in CalendarGrid.jsx
- isSameDay(parseISO(ws.startTime), day): VERIFIED in CalendarGrid.jsx
- import WorkshopCard in CalendarGrid: VERIFIED
- useApp() in ScheduleCalendar: VERIFIED

---
*Phase: 02-calendar-grid*
*Completed: 2026-03-06*
