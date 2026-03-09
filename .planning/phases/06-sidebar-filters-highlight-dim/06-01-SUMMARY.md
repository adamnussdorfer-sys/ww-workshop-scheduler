---
phase: 06-sidebar-filters-highlight-dim
plan: "01"
subsystem: filter-engine-sidebar
tags: [filters, sidebar, pure-utility, AppContext]
dependency_graph:
  requires: [05-01]
  provides: [filterEngine, sidebar-filter-ui]
  affects: [ScheduleCalendar, AppContext-filters]
tech_stack:
  added: []
  patterns: [OR-within-AND-across filter logic, accordion sub-component pattern, functional-setState]
key_files:
  created:
    - src/utils/filterEngine.js
  modified:
    - src/components/layout/Sidebar.jsx
decisions:
  - "FilterSection defined as a module-level function (not inline) for readability without introducing a separate file"
  - "nav changed from flex-1 to shrink-0 so the filter container can own the remaining flex-1 scroll space"
  - "Show all 18 coaches including inactive — coordinators need to verify inactive coaches have no stale assignments"
  - "Coach section uses max-h-48 scrollable, other sections max-h-32 — proportional to item counts"
metrics:
  duration: "~5 min"
  completed: "2026-03-09"
  tasks_completed: 2
  files_created: 1
  files_modified: 1
---

# Phase 6 Plan 01: Filter Engine + Sidebar Controls Summary

Pure filter-matching utility (filterEngine.js) and four collapsible sidebar filter sections wired to AppContext state.

## What Was Built

### filterEngine.js

Pure JS utility with two exports:

- `getMatchedWorkshopIds(workshops, filters)` — Returns a `Set<string>` of workshop IDs matching all active filter dimensions. Logic is OR-within-dimension, AND-across-dimensions. Empty dimension means "no filter on this axis". Coach matching covers both primary (`ws.coachId`) and co-coach (`ws.coCoachId`) roles.

- `hasActiveFilters(filters)` — Returns `true` when any dimension array is non-empty. Used downstream to apply dim/highlight effect.

### Sidebar.jsx — Filter Controls

Four collapsible accordion sections added below nav items, visible only on the Schedule Calendar route (`/`) when sidebar is expanded:

| Section | Items | Scrollable |
|---------|-------|------------|
| Coach   | All 18 coaches (incl. inactive) | Yes (max-h-48) |
| Type    | 5 workshop types | No (max-h-32) |
| Status  | 3 statuses | No (max-h-32) |
| Market  | 4 markets (US/CA/UK/ANZ) | No (max-h-32) |

Each `FilterSection` renders:
- Header: title (white/60 uppercase 10px) + active count badge (ww-blue) + chevron toggle
- Body: checkboxes with `accent-ww-blue`, label text `white/80 text-xs`
- Local `useState(isOpen)` for accordion state

`toggleFilter(dimension, value)` uses functional `setFilters(prev => ...)` to safely toggle values in/out of each dimension array.

`showFilters` computed as `location.pathname === '/' && !collapsed`.

## Verification Passed

- filterEngine.js node test: matched `['1','2']`, `hasActiveFilters` true/false ✓
- `npm run build` — 0 errors, 340.58 kB JS bundle ✓

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Task | Hash | Description |
|------|------|-------------|
| 1 | 5abc4e5 | feat(06-01): create filterEngine.js pure utility |
| 2 | 4562499 | feat(06-01): add four collapsible filter sections to Sidebar |

## Self-Check: PASSED

- filterEngine.js: FOUND
- Sidebar.jsx: FOUND
- 06-01-SUMMARY.md: FOUND
- Commit 5abc4e5: FOUND
- Commit 4562499: FOUND
