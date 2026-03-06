---
phase: 03-workshop-detail
plan: 03
subsystem: ui
tags: [react, tailwind, calendar, coach-availability, dropdown, click-to-create]

# Dependency graph
requires:
  - phase: 03-workshop-detail
    plan: 02
    provides: WorkshopForm.jsx with slotContext prop ready for create mode
  - phase: 03-workshop-detail
    plan: 01
    provides: Panel state (selectedWorkshopId, panelMode, slotContext) in ScheduleCalendar
provides:
  - CalendarGrid.jsx day column onClick with 30-min snap geometry and scroll offset handling via onSlotClick callback
  - src/utils/coachAvailability.js with getCoachAvailability function checking day availability, time window, and inactive status
  - WorkshopForm.jsx custom Coach and Co-Coach dropdowns with green/grayed availability indicators
  - ScheduleCalendar.jsx openCreate callback wiring slot clicks to panel create mode
affects:
  - 04 (conflict detection can now build on top of openCreate and getCoachAvailability)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Custom div-based dropdown with useRef + mousedown outside-click detection
    - getCoachAvailability utility: day name lookup (lowercase) + time range comparison in total minutes
    - 30-min snap geometry: Math.floor(relY / PX_PER_MIN) -> Math.floor(totalMinutes / 30) * 30
    - Scroll-corrected click geometry: scrollContainer.scrollTop added to relY before computing time slot

key-files:
  created:
    - src/utils/coachAvailability.js
  modified:
    - src/components/calendar/CalendarGrid.jsx
    - src/pages/ScheduleCalendar.jsx
    - src/components/panel/WorkshopForm.jsx

key-decisions:
  - "onSlotClick guard (e.target !== e.currentTarget) prevents workshop card clicks triggering create mode — defense-in-depth with existing stopPropagation on WorkshopCard"
  - "Inactive status checked first in getCoachAvailability before day availability — simplest path for coaches that should never show available"
  - "workshopDate parsed from draft.startTime at render time (not in effect) — availability recomputes instantly when start time changes"
  - "Co-Coach dropdown filters out draft.coachId before mapping — a coach cannot co-coach their own session"

patterns-established:
  - "Availability-aware dropdown: custom button trigger + absolute positioned list + useRef for outside-click detection"
  - "getCoachAvailability(coach, date, startHour, startMinute) returns { available: boolean, reason: string|null }"
  - "openCreate(date, hour, minute) in ScheduleCalendar: setSelectedWorkshopId(null) + setPanelMode('create') + setSlotContext"

requirements-completed: [CREATE-01, CREATE-02]

# Metrics
duration: 2min
completed: 2026-03-06
---

# Phase 3 Plan 03: Click-to-Create and Coach Availability Dropdown Summary

**Click handler on empty calendar time slots with 30-min snap geometry and scroll offset, plus availability-aware coach dropdowns using getCoachAvailability utility with green/grayed status indicators**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-06T17:36:27Z
- **Completed:** 2026-03-06T17:38:28Z
- **Tasks:** 2
- **Files modified:** 3 + 1 created

## Accomplishments
- Added onSlotClick prop to CalendarGrid with 30-minute snap geometry that correctly handles scroll offset via `scrollContainer.scrollTop`
- Added openCreate callback in ScheduleCalendar that sets panelMode=create and stores slotContext with date/hour/minute
- Created src/utils/coachAvailability.js with getCoachAvailability function that checks: inactive status, day of week availability, and time window boundaries (before start / at or after end)
- Replaced both Coach and Co-Coach `<select>` elements in WorkshopForm with custom div-based dropdowns
- Available coaches rendered in green-700 with green dot; unavailable coaches in slate-400 with grayed dot and reason string in parentheses
- Unavailable coaches are visible but clicking them does nothing (early return if not available)
- Co-Coach dropdown excludes the currently selected primary coach from its list
- Single useEffect with document mousedown listener closes both dropdowns on outside click

## Task Commits

Each task was committed atomically:

1. **Task 1: Add click-to-create on empty calendar time slots** - `89feed1` (feat)
2. **Task 2: Build coach availability utility and availability-aware dropdown** - `497fce7` (feat)

## Files Created/Modified
- `src/utils/coachAvailability.js` - getCoachAvailability(coach, date, startHour, startMinute) utility checking inactive status, day availability, and time window
- `src/components/calendar/CalendarGrid.jsx` - Added onSlotClick prop, cursor-pointer class, and 30-min snap onClick handler with scroll offset correction to day columns
- `src/pages/ScheduleCalendar.jsx` - Added openCreate callback and passed onSlotClick={openCreate} to CalendarGrid
- `src/components/panel/WorkshopForm.jsx` - Replaced Coach and Co-Coach selects with custom availability-aware dropdowns; added getCoachAvailability import; added coachDropdownOpen/coCoachDropdownOpen state; added click-outside useEffect

## Decisions Made
- Guard `e.target !== e.currentTarget` in slot click handler: prevents card clicks triggering create mode, defense-in-depth beyond the stopPropagation already on WorkshopCard
- Inactive status checked first in getCoachAvailability: simplest path for permanently unavailable coaches
- workshopDate/Hour/Minute computed from draft.startTime at render time: availability indicators update instantly when the user edits the start time field
- Co-Coach dropdown filters out draft.coachId before rendering: enforces single coach per role constraint at the UI level

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Click-to-create is fully functional: clicking empty calendar areas opens panel in create mode with date and 30-min snapped time pre-filled
- Card clicks still open view mode correctly via e.target guard and existing stopPropagation
- Coach and Co-Coach dropdowns show real availability data from coaches.js
- getCoachAvailability is a pure utility ready for Phase 4 conflict detection to reuse
- Phase 3 complete — all 3 plans done. Phase 4 (conflict detection) can begin.

## Self-Check: PASSED

- FOUND: src/utils/coachAvailability.js
- FOUND: src/components/calendar/CalendarGrid.jsx (contains onSlotClick)
- FOUND: src/pages/ScheduleCalendar.jsx (contains openCreate)
- FOUND: src/components/panel/WorkshopForm.jsx (contains getCoachAvailability)
- FOUND commit 89feed1: Task 1
- FOUND commit 497fce7: Task 2

---
*Phase: 03-workshop-detail*
*Completed: 2026-03-06*
