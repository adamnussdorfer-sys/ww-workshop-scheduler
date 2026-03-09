# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-09)

**Core value:** Coordinators can see the full weekly workshop schedule at a glance, spot conflicts immediately, and publish changes with confidence.
**Current focus:** v1.1 Interactive Polish — Phase 8: Coach Roster Page

## Current Position

Phase: 8 (Coach Roster Page)
Plan: 1 of 1 complete
Status: Phase 8 complete — Plan 01 done
Last activity: 2026-03-09 — Phase 8 Plan 01 complete (CoachDetailPanel, CoachRoster with sortable table + slide-in panel)

```
Progress: [########------------] 4/7 phases complete (Phase 8 done)
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

### Pending Todos

- Verify workshops.js includes status: "draft" | "published" field before Phase 9 (DRAF-01 through DRAF-05)
- Coach availability data shape confirmed: availability[].day/start/end — verified from coaches.js in Phase 8

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-03-09
Stopped at: Phase 8 Plan 01 complete. CoachDetailPanel display component + CoachRoster sortable/searchable table with slide-in panel. Next: Phase 9 (Draft Manager).
Resume file: None
