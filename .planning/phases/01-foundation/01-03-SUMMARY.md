---
phase: 01-foundation
plan: 03
subsystem: data
tags: [react, date-fns, mock-data, coaches, workshops, context]

# Dependency graph
requires:
  - phase: 01-02
    provides: AppContext with coaches/workshops useState ready for data, App.jsx with empty arrays
provides:
  - 18 coach objects with all required fields (id, name, type, email, initials, timezone, status, employment, availability, avgAttendance, workshopsThisWeek, attendanceTrend)
  - 47 workshops spread Mon-Sun dynamically anchored to current week via date-fns
  - 3 documented intentional scheduling conflicts for Phase 4 conflict detection demo
  - Mock data loaded into AppContext on app startup via useState initialization
affects: [02-schedule-view, 03-workshop-management, 04-coach-management, 05-conflict-detection, 06-publishing, 07-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dynamic week anchoring via date-fns startOfWeek+addDays+setHours+setMinutes so workshop times are always relative to current week"
    - "Mock data as static ES module arrays imported directly into App.jsx useState initializers"
    - "Intentional conflicts documented in comment block at top of workshops.js for Phase 4 reference"

key-files:
  created:
    - src/data/coaches.js
    - src/data/workshops.js
  modified:
    - src/App.jsx

key-decisions:
  - "Used date-fns helpers (startOfWeek/addDays/setHours/setMinutes) to anchor workshop times to current week dynamically — avoids hardcoded dates becoming stale"
  - "Conflicts placed at exact coach IDs and time offsets specified by plan (coach-005 Tue 10:00-11:00 vs 10:30-11:30, coach-008 Thu 14:00-15:00 vs 14:30-15:30, coach-012 Wed 11:00-12:00 vs 12:05-13:00)"

patterns-established:
  - "Data layer: src/data/ holds static mock arrays; App.jsx imports and uses as useState initial values"
  - "Foreign keys: workshops reference coaches via coachId string matching coach id field"
  - "Attendance: Published workshops get 5-element integer arrays, Draft/Cancelled get null"

requirements-completed: [DATA-01, DATA-02, DATA-03, DATA-04]

# Metrics
duration: 4min
completed: 2026-03-06
---

# Phase 1 Plan 03: Mock Data Files Summary

**18 coaches and 47 workshops with realistic WW content, dynamic week anchoring via date-fns, 3 documented scheduling conflicts for conflict detection demo, wired into AppContext**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-06T04:10:08Z
- **Completed:** 2026-03-06T04:14:10Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created 18 coach objects spanning 4 US timezones, 2 coach types (11 Coach Creator, 7 Legacy Coach), 3 employment statuses, and realistic availability windows
- Created 47 workshops distributed Mon-Sun with all 5 workshop types, dynamically anchored to the current week via date-fns
- Embedded 3 intentional scheduling conflicts (Conflict A: coach-005 Tuesday overlap, Conflict B: coach-008 Thursday overlap, Conflict C: coach-012 Wednesday buffer violation) as test cases for Phase 4 conflict detection
- Wired both data files into App.jsx via useState initialization — all components using useApp() receive populated data on startup
- Build succeeded at 261 KB JS bundle, no errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create coach and workshop mock data files** - `d1b0eb4` (feat)
2. **Task 2: Wire mock data into App state via AppContext** - `8adc903` (feat)

## Files Created/Modified
- `src/data/coaches.js` - 18 coach objects: 11 Coach Creator, 7 Legacy Coach; 4 US timezones; active/inactive/employment mix; availability arrays per coach
- `src/data/workshops.js` - 47 workshop objects: 5 types; Mon-Sun coverage; getWeekDay helper for dynamic date anchoring; 3 intentional conflicts documented in header comment
- `src/App.jsx` - Added imports from data files, changed useState initializers from empty arrays to imported mock data

## Decisions Made
- Used date-fns `startOfWeek` + `addDays` + `setHours` + `setMinutes` to anchor workshop times to the current week dynamically, so the demo always shows workshops in the "current" view regardless of when the app is opened.
- Placed the exact coach IDs and time offsets specified in the plan for the 3 intentional conflicts — these are hard requirements for Phase 4's conflict detection engine to detect.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All mock data available via `useApp()` throughout the component tree
- ScheduleCalendar page can now render real workshops from AppContext
- CoachRoster page can render real coach data from AppContext
- 3 intentional conflicts ready for Phase 4 conflict detection engine
- No blockers

## Self-Check: PASSED

- src/data/coaches.js: FOUND (18 coaches)
- src/data/workshops.js: FOUND (47 workshops)
- src/App.jsx: FOUND (modified with data imports)
- Commit d1b0eb4 (Task 1): FOUND
- Commit 8adc903 (Task 2): FOUND
- npm run build: PASSED (261 KB bundle, no errors)
- Conflict A (coach-005, ws-021/ws-022): VERIFIED
- Conflict B (coach-008, ws-033/ws-034): VERIFIED
- Conflict C (coach-012, ws-027/ws-028): VERIFIED

---
*Phase: 01-foundation*
*Completed: 2026-03-06*
