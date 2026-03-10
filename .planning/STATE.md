# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-09)

**Core value:** Coordinators can see the full weekly workshop schedule at a glance, spot conflicts immediately, and publish changes with confidence.
**Current focus:** Phase 12: Day and Month Calendar Views (Complete)

## Current Position

Phase: 12 (Day and Month Calendar Views)
Plan: 2 of 2 complete
Status: Phase 12 complete — All three calendar views (Day, Week, Month) fully functional
Last activity: 2026-03-10 — Phase 12 Plan 02 complete (MonthView.jsx with pills, overflow, conflict dots, drill-to-day)

```
Progress: [####################] 2/2 plans complete (Phase 12 done)
```

## Performance Metrics

**Velocity (v1.0 baseline):**
- Total plans completed: 10
- Total execution time: ~25 min
- Average duration: ~2.5 min/plan

**By Phase (v1.0):**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 3 | 7 min | 2.3 min |
| 02-calendar-grid | 2 | 7 min | 3.5 min |
| 03-workshop-detail | 3 | 6 min | 2.0 min |
| 04-conflict-detection | 2 | 5 min | 2.5 min |

**v1.1 execution (in progress):**

| Phase | Plan | Duration | Files | Date |
|-------|------|----------|-------|------|
| 05-context-foundation-toast-system | 01 | 2 min | 3 | 2026-03-09 |
| 06-sidebar-filters-highlight-dim | 01 | 5 min | 2 | 2026-03-09 |
| 06-sidebar-filters-highlight-dim | 02 | 3 min | 4 | 2026-03-09 |
| 07-keyboard-shortcuts | 01 | 4 min | 4 | 2026-03-09 |
| 08-coach-roster-page | 01 | 3 min | 2 | 2026-03-09 |
| 09-draft-manager-page | 01 | 2 min | 1 | 2026-03-09 |
| 10-availability-overlay | 01 | 2 min | 3 | 2026-03-10 |
| 11-micro-interactions-empty-states | 01 | 2 min | 4 | 2026-03-10 |
| 12-day-and-month-calendar-views | 01 | 2 min | 4 | 2026-03-10 |
| 12-day-and-month-calendar-views | 02 | 2 min | 2 | 2026-03-10 |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
All v1.0 decisions have been reviewed and marked with outcomes.

**v1.1 architectural decisions (from research):**
- Filter state lives in AppContext (not Sidebar or page-level) — Sidebar is a writer, pages are readers
- Toast via context + single ToastStack in App.jsx above router — prevents duplicate stacks
- Centralized useKeyboardShortcuts hook with ref pattern — prevents listener leaks and Esc conflicts
- filterEngine.js as pure utility — reusable across CalendarGrid, CoachRoster, DraftManager without coupling
- DraftManager reads workshops from useApp() + useMemo — never local state copy (prevents stale data)

**Phase 5 Plan 01 decisions:**
- Import toast directly from sonner in WorkshopForm (not via context threading) — idiomatic, avoids prop drilling
- Toaster placed as sibling before AppShell inside AppContext.Provider (outside Routes) — critical for navigation survival
- Plain toast() calls (not toast.success/error) — WW brand blue/coral does not match sonner richColors green/red
- setCoaches/setWorkshops/setFilters omitted from useMemo deps — React guarantees setState identity stability
- toast re-exported on context value — allows useApp() import path, zero behavioral cost

**Phase 6 Plan 01 decisions:**
- FilterSection defined as module-level function (not inline) for readability without a separate file
- nav changed from flex-1 to shrink-0 so filter container owns remaining flex-1 scroll space
- Show all 18 coaches including inactive — coordinators may need to verify inactive coaches have no assignments
- Coach section uses max-h-48 scrollable, other sections max-h-32 — proportional to item counts
- [Phase 06-sidebar-filters-highlight-dim]: weekDays converted to useMemo for stable reference in weekMatchCount dependency array
- [Phase 06-sidebar-filters-highlight-dim]: weekMatchCount returns -1 sentinel when no filters active to prevent false empty state
- [Phase 06-sidebar-filters-highlight-dim]: FilterPills reads from useApp() directly — no prop drilling through ScheduleCalendar

**Phase 7 Plan 01 decisions:**
- prevWeek/nextWeek/goToToday wrapped in useCallback with empty deps — React guarantees setState setter identity stability
- openNewWithNextSlot and nav callbacks must be defined BEFORE useKeyboardShortcuts call — const declarations are not hoisted
- slotFinder uses startOfWeek(now) as scan origin, covering 7 days regardless of displayed week — ensures future slot always returned
- WorkshopPanel Escape useEffect removed — all keyboard handling centralized in useKeyboardShortcuts hook in ScheduleCalendar

**Phase 8 Plan 01 decisions:**
- CoachRoster gets its own inline panel markup (Option A) — avoids modifying shared WorkshopPanel.jsx and risking regressions in ScheduleCalendar
- COACH_STATUS_BADGE defined in both CoachDetailPanel and CoachRoster for self-containment — no shared import needed
- Escape key handled via simple useEffect in CoachRoster — useKeyboardShortcuts is ScheduleCalendar-specific
- No debounce on search input — 18 coaches renders in <1ms; debounce adds perceived lag
- [Phase 09-draft-manager-page]: effectiveSelectedIds intersection pattern prevents stale selection bugs after publish; both tasks committed together as single file
- [Phase 09-draft-manager-page]: ref callback for HTML indeterminate checkbox property — cannot be set via JSX prop, must use DOM property directly

**Phase 10 Plan 01 decisions:**
- Grid constants extracted to availabilityBands.js and imported back into CalendarGrid — eliminates constant duplication/drift risk
- Stable coachIndex approach: pass full coaches array to getAvailabilityBands then filter bands by coachFilterSet — preserves consistent coach-to-color mapping regardless of active filter state
- showOverlay state in ScheduleCalendar (not AppContext) — overlay is calendar-view-local, no cross-page persistence needed
- Eye/EyeOff icon toggle on Availability button — consistent with lucide-react icons already in nav bar

**Phase 11 Plan 01 decisions:**
- @keyframes conflict-pulse must be nested inside @theme block for Tailwind v4 to generate the animate-conflict-pulse utility class
- transition-[transform,box-shadow] replaces transition-all/hover:brightness-95 — GPU-composited, no layout reflow, click target unchanged
- weekWorkshopsCount is a separate memo from weekMatchCount — weekMatchCount uses -1 sentinel; modifying it would break filter empty state
- Filter empty state (anyFilterActive && weekMatchCount === 0) checked before empty-week state — !anyFilterActive guard ensures correct priority

**Phase 12 Plan 01 decisions:**
- currentDate replaces currentWeekStart as canonical state -- weekStart derived via useMemo for backwards compatibility
- useKeyboardShortcuts renamed to generic onPrev/onNext interface -- ScheduleCalendar passes view-mode-aware callbacks
- Availability button conditionally hidden in month view (viewMode !== 'month') per CONTEXT.md
- Day view reuses same grid constants, slot line pattern, and WorkshopCard from CalendarGrid for visual consistency
- drillToDay callback shared between onDayClick (week header) and future month view cell clicks

**Phase 12 Plan 02 decisions:**
- MonthView groups workshops into Map<dateKey, workshop[]> for O(1) per-day lookup instead of filtering per cell
- monthMatchCount uses isSameMonth for broader filter empty state check (entire month, not just visible grid range)
- MonthView always renders grid -- individual empty days naturally show just the date number with no pills

### Pending Todos

- Coach availability data shape confirmed: availability[].day/start/end — verified from coaches.js in Phase 8
- Phase 9 pending todo resolved: workshops.js confirmed title-case status field ('Draft', 'Published', 'Cancelled')

### Roadmap Evolution

- Phase 12 added: Day and month calendar views

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-03-10
Stopped at: Completed 12-02-PLAN.md
Resume file: .planning/phases/12-day-and-month-calendar-views/12-02-SUMMARY.md
