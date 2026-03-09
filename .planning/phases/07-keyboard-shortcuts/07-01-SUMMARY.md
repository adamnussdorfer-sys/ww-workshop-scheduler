---
phase: 07-keyboard-shortcuts
plan: 01
subsystem: ui
tags: [react, keyboard-shortcuts, hooks, date-fns, useCallback, useEffect, AbortController]

# Dependency graph
requires:
  - phase: 06-sidebar-filters-highlight-dim
    provides: ScheduleCalendar with workshops/filters context and all panel callbacks (prevWeek, nextWeek, goToToday, closePanel, openCreate, isPanelOpen)
provides:
  - useKeyboardShortcuts hook with ArrowLeft/Right, T, Escape, N global shortcuts
  - findNextAvailableSlot utility returning next open 30-min calendar slot
  - Centralized keyboard handling — WorkshopPanel is now a pure presentational component
affects: [future calendar phases, any component that adds keyboard interactions]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "AbortController-based event listener cleanup (document.addEventListener + signal)"
    - "Input guard pattern: check e.target.tagName before firing global shortcuts"
    - "useCallback wrapping for setState-based functions passed as effect deps"
    - "Centralized keyboard hook — single listener, all shortcuts in one switch"

key-files:
  created:
    - src/hooks/useKeyboardShortcuts.js
    - src/utils/slotFinder.js
  modified:
    - src/pages/ScheduleCalendar.jsx
    - src/components/panel/WorkshopPanel.jsx

key-decisions:
  - "prevWeek/nextWeek/goToToday wrapped in useCallback with empty deps — React guarantees setState setter identity stability"
  - "openNewWithNextSlot defined before useKeyboardShortcuts call — const declarations are not hoisted"
  - "slotFinder scans from Monday of current week (not today) to cover all 7 days uniformly"
  - "findNextAvailableSlot always uses current real time as reference, not displayed week — ensures future slot"

patterns-established:
  - "Keyboard shortcuts hook pattern: single document listener, AbortController cleanup, input guard, switch on e.key"
  - "Input guard: check tagName (INPUT/TEXTAREA/SELECT) + isContentEditable before any shortcut action"

requirements-completed: [INTR-02, INTR-03, INTR-04, INTR-05]

# Metrics
duration: 4min
completed: 2026-03-09
---

# Phase 7 Plan 01: Keyboard Shortcuts Summary

**Global keyboard shortcuts (ArrowLeft/Right week nav, T for today, Escape to close panel, N to open create with next available slot) via centralized useKeyboardShortcuts hook with AbortController cleanup and input guard**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-09T22:33:08Z
- **Completed:** 2026-03-09T22:37:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Created `useKeyboardShortcuts` hook: single document keydown listener, AbortController cleanup, input guard preventing shortcuts in form fields
- Created `findNextAvailableSlot` utility: scans 7-day grid (6:00-22:00, 30-min slots) from Monday of current week, rounds current time up to next 30-min boundary
- Wired hook into ScheduleCalendar with all 5 handlers; prevWeek/nextWeek/goToToday wrapped in useCallback for stable effect deps
- Removed inline Escape useEffect from WorkshopPanel — no more double-listener risk; panel is now a pure presentational component

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useKeyboardShortcuts hook and slotFinder utility** - `9047566` (feat)
2. **Task 2: Wire hook into ScheduleCalendar and remove WorkshopPanel inline Escape listener** - `26ee2f4` (feat)

**Plan metadata:** (docs commit to follow)

## Files Created/Modified
- `src/hooks/useKeyboardShortcuts.js` - Centralized keyboard shortcut hook; single keydown listener with AbortController, input guard, switch on e.key
- `src/utils/slotFinder.js` - findNextAvailableSlot utility; scans occupied slots Set, returns { date, hour, minute } matching openCreate signature
- `src/pages/ScheduleCalendar.jsx` - Added imports, useCallback wrappers for nav functions, openNewWithNextSlot callback, useKeyboardShortcuts mount
- `src/components/panel/WorkshopPanel.jsx` - Removed useEffect Escape listener; removed useEffect import

## Decisions Made
- `prevWeek`, `nextWeek`, `goToToday` wrapped in `useCallback` with empty deps — `setCurrentWeekStart` is a React setState setter with guaranteed identity stability
- `openNewWithNextSlot` and nav callbacks must be defined BEFORE `useKeyboardShortcuts` call — `const` declarations are not hoisted (auto-fixed ordering bug during Task 2)
- `slotFinder` uses `startOfWeek(now, { weekStartsOn: 1 })` as the scan origin, scanning forward 7 days regardless of displayed week — ensures next available slot is always in the future

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed hook call order — prevWeek/nextWeek/goToToday defined after useKeyboardShortcuts call**
- **Found during:** Task 2 (Wire hook into ScheduleCalendar)
- **Issue:** Plan instructed adding openNewWithNextSlot and useKeyboardShortcuts call before weekDays useMemo, but prevWeek/nextWeek/goToToday were still placed after (after weekDays, headerText, isCurrentWeek). const declarations are not hoisted, so the hook call would reference undefined variables.
- **Fix:** Moved prevWeek/nextWeek/goToToday useCallback definitions immediately after openCreate (before openNewWithNextSlot and useKeyboardShortcuts), establishing correct declaration order
- **Files modified:** src/pages/ScheduleCalendar.jsx
- **Verification:** Build passes cleanly; hook receives defined function references
- **Committed in:** 26ee2f4 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug)
**Impact on plan:** Necessary correctness fix — undefined variable references would cause runtime errors. No scope creep.

## Issues Encountered
None beyond the ordering bug documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 4 keyboard shortcuts (ArrowLeft/Right, T, Escape, N) are functional
- App builds cleanly with no errors
- WorkshopPanel is a pure presentational component — no keyboard side effects
- Ready for Phase 8 or any subsequent phase

---
*Phase: 07-keyboard-shortcuts*
*Completed: 2026-03-09*

## Self-Check: PASSED

- src/hooks/useKeyboardShortcuts.js: FOUND
- src/utils/slotFinder.js: FOUND
- .planning/phases/07-keyboard-shortcuts/07-01-SUMMARY.md: FOUND
- Commit 9047566: FOUND
- Commit 26ee2f4: FOUND
