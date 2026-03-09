# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-09)

**Core value:** Coordinators can see the full weekly workshop schedule at a glance, spot conflicts immediately, and publish changes with confidence.
**Current focus:** v1.1 Interactive Polish — Phase 6: Sidebar Filters + Highlight/Dim

## Current Position

Phase: 6 (Sidebar Filters + Highlight/Dim)
Plan: 1 of 3 complete
Status: Phase 6 execution in progress — Plan 01 complete
Last activity: 2026-03-09 — Phase 6 Plan 01 complete (filterEngine.js + Sidebar filter controls)

```
Progress: [####----------------] 2/7 phases (Phase 6 Plan 01 done)
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

### Pending Todos

- Verify coach availability data shape in coaches.js before Phase 10 (OVER-01/OVER-02 depend on availability[].day/start/end fields)
- Verify workshops.js includes status: "draft" | "published" field before Phase 9 (DRAF-01 through DRAF-05)

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-03-09
Stopped at: Phase 6 Plan 01 complete. filterEngine.js and Sidebar filter controls ready. Next: Plan 02 highlight/dim logic in CalendarGrid.
Resume file: None
