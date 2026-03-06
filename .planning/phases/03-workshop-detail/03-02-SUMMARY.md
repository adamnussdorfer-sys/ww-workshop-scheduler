---
phase: 03-workshop-detail
plan: 02
subsystem: ui
tags: [react, tailwind, panel, form, sparkline, state-management]

# Dependency graph
requires:
  - phase: 03-workshop-detail
    plan: 01
    provides: WorkshopPanel shell with isOpen/onClose/children props
  - phase: 01-foundation
    provides: AppContext with setWorkshops for state mutation
provides:
  - WorkshopForm.jsx with all 9 editable fields, status badge, sparkline, conflict stub, and action buttons wired to setWorkshops
  - AttendanceSparkline.jsx SVG polyline component for 5-point attendance data
  - Updated WorkshopPanel.jsx rendering WorkshopForm directly with key-based remount
affects:
  - 03-03 (create mode uses same WorkshopForm with slotContext and mode=create)
  - 04 (conflict detection will supply non-empty conflicts array to WorkshopForm)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - key={workshop?.id ?? 'create'} on WorkshopForm forces remount when switching workshops (avoids stale draft state)
    - initDraft factory function centralizes view/create mode initialization
    - fromDatetimeLocal/toDatetimeLocal helpers convert between ISO and datetime-local input format
    - Conflict warnings stub accepts conflicts prop (empty array for now) for Phase 4 integration
    - STATUS_BADGE_STYLES lookup object keeps badge color logic clean

key-files:
  created:
    - src/components/panel/WorkshopForm.jsx
    - src/components/panel/AttendanceSparkline.jsx
  modified:
    - src/components/panel/WorkshopPanel.jsx
    - src/pages/ScheduleCalendar.jsx

key-decisions:
  - "key={workshop?.id ?? 'create'} on WorkshopForm forces full remount when switching workshops, resetting local draft state cleanly"
  - "initDraft helper centralizes view (spread workshop) vs create (empty defaults with slotContext) mode logic"
  - "Conflict warnings stub accepts conflicts=[] prop ready for Phase 4 — no extra refactoring needed then"
  - "Remove from Schedule sets status to Cancelled (not delete from array) — matches CalendarGrid filter and preserves history"
  - "WorkshopForm rendered only when isOpen is true to avoid null workshop reference when panel is closed"

patterns-established:
  - "Controlled form pattern: local draft state with updateField(field, value) updater"
  - "ISO <-> datetime-local conversion helpers: toDatetimeLocal/fromDatetimeLocal"
  - "Status badge: STATUS_BADGE_STYLES lookup object keyed by status string"

requirements-completed: [PANEL-02, PANEL-03, PANEL-04, PANEL-05, PANEL-06]

# Metrics
duration: 2min
completed: 2026-03-06
---

# Phase 3 Plan 02: Workshop Form and Panel Integration Summary

**Editable workshop form with all 9 fields, status badge, SVG attendance sparkline, conflict warnings stub, and three action buttons (Save Draft, Remove, Publish) wired to global setWorkshops state**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-06T17:32:05Z
- **Completed:** 2026-03-06T17:33:42Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Created AttendanceSparkline.jsx: SVG polyline with endpoint circle, overflow-visible for dot clipping, returns null for fewer than 2 data points
- Created WorkshopForm.jsx: 9 field groups (title, date/time with start/end inputs, timezone read-only, coach select, co-coach select with None option, type select, description textarea, recurrence select, markets checkboxes)
- Status badge at top with Draft=yellow, Published=green, Cancelled=slate color mapping
- Attendance sparkline section visible only for Published workshops with attendance data
- Conflict warnings stub renders AlertTriangle icon + list when conflicts array is non-empty (empty for now, Phase 4 supplies data)
- Three action buttons: Save Draft (update or create), Remove from Schedule (set Cancelled), Publish (set Published) — all call setWorkshops and onClose
- Updated WorkshopPanel to render WorkshopForm directly with key prop for remount on workshop switch
- Updated WorkshopPanel to have dynamic title (New Workshop vs workshop.title vs Workshop Details)
- Updated ScheduleCalendar to pass workshop, coaches, mode, slotContext props to WorkshopPanel

## Task Commits

Each task was committed atomically:

1. **Task 1: Create WorkshopForm with all fields, sparkline, status badge, and conflict stub** - `31dd347` (feat)
2. **Task 2: Wire action buttons and integrate WorkshopForm into WorkshopPanel** - `596e861` (feat)

## Files Created/Modified
- `src/components/panel/AttendanceSparkline.jsx` - SVG polyline sparkline for 5-point attendance data with endpoint circle
- `src/components/panel/WorkshopForm.jsx` - Full editable form with controlled inputs, status badge, sparkline, conflict stub, and action buttons wired to setWorkshops
- `src/components/panel/WorkshopPanel.jsx` - Updated shell rendering WorkshopForm with workshop/coaches/mode/slotContext props, dynamic title, key-based remount
- `src/pages/ScheduleCalendar.jsx` - Passes full props (workshop, coaches, mode, slotContext) to WorkshopPanel

## Decisions Made
- Used `key={workshop?.id ?? 'create'}` on WorkshopForm — cleanest solution for stale draft state, avoids useEffect dependency complexity
- `initDraft` function centralizes both view and create mode initialization in one place
- `fromDatetimeLocal`/`toDatetimeLocal` helpers handle the ISO <-> `<input type="datetime-local">` format conversion
- Conflict stub kept as a prop (`conflicts=[]`) so Phase 4 simply passes the array without any refactoring
- Remove from Schedule soft-deletes (Cancelled status) rather than hard-deletes — consistent with CalendarGrid Cancelled filter already in place

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Panel form is fully functional: click any workshop card to see all editable fields, status badge, and attendance sparkline for published workshops
- Save Draft, Remove from Schedule, and Publish all mutate global workshops state via setWorkshops
- Form correctly remounts when switching between workshop cards via key prop
- Plan 03-03 can now implement create mode (slot click opens panel with mode=create and slotContext)
- Plan 04 conflict detection can pass conflicts array to WorkshopForm without any changes needed to the form
- No blockers

## Self-Check: PASSED

- FOUND: src/components/panel/WorkshopForm.jsx
- FOUND: src/components/panel/AttendanceSparkline.jsx
- FOUND: src/components/panel/WorkshopPanel.jsx (updated)
- FOUND: src/pages/ScheduleCalendar.jsx (updated)
- FOUND commit 31dd347: Task 1
- FOUND commit 596e861: Task 2

---
*Phase: 03-workshop-detail*
*Completed: 2026-03-06*
