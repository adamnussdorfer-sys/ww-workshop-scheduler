---
phase: quick
plan: 1
subsystem: ui-responsive
tags: [mobile, responsive, tailwind, bottom-nav, bottom-sheet, cards]
dependency_graph:
  requires: []
  provides: [mobile-bottom-nav, bottom-sheet-panels, responsive-toolbar, mobile-month-dots, mobile-card-tables]
  affects: [AppShell, Sidebar, WorkshopPanel, CoachRoster, DraftManager, ScheduleCalendar, FilterBar, MonthView]
tech_stack:
  added: []
  patterns: [tailwind-responsive-prefixes, css-custom-properties-for-dynamic-grid, matchMedia-hook]
key_files:
  created:
    - src/components/layout/BottomNav.jsx
  modified:
    - src/components/layout/AppShell.jsx
    - src/components/layout/Sidebar.jsx
    - src/components/panel/WorkshopPanel.jsx
    - src/pages/CoachRoster.jsx
    - src/pages/ScheduleCalendar.jsx
    - src/components/filters/FilterBar.jsx
    - src/components/calendar/MonthView.jsx
    - src/pages/DraftManager.jsx
decisions:
  - AppShell uses CSS custom property --sidebar-w with grid-cols-[var(--sidebar-w)_1fr] for dynamic desktop sidebar width; grid-cols-1 on mobile via responsive prefix
  - BottomNav uses NavLink end prop on root route to prevent always-active match
  - WorkshopPanel and CoachRoster panels share identical bottom-sheet responsive pattern (translate-y mobile, translate-x desktop)
  - FilterBar mobile panel uses absolute-positioned dropdown below the Filters button, width w-56 with max-h to prevent overflow
  - MonthView renders two separate DOM sections (dots div + pills div) with md:hidden/md:flex to keep both implementations clean and independent
  - ScheduleCalendar auto-switches week->day on mobile via useEffect + matchMedia on mount and viewport change
metrics:
  duration: ~6 min
  completed: 2026-03-23
  tasks_completed: 3
  files_modified: 8
  files_created: 1
---

# Quick Task 1: Make the App Responsive — Summary

**One-liner:** Full mobile responsiveness via Tailwind md: breakpoints — BottomNav, bottom-sheet panels, 2-row toolbar, mobile filter button, dot-based MonthView, and card tables for CoachRoster and DraftManager.

## Tasks Completed

| # | Task | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Responsive shell — bottom nav, hide sidebar, bottom sheet panels | 48a820e | BottomNav.jsx (new), AppShell.jsx, Sidebar.jsx, WorkshopPanel.jsx, CoachRoster.jsx |
| 2 | Responsive calendar toolbar, auto-switch week-to-day, mobile month dots | fc54edf | ScheduleCalendar.jsx, FilterBar.jsx, MonthView.jsx |
| 3 | Responsive tables — card layout for DraftManager | c0df635 | DraftManager.jsx |

## What Was Built

### Task 1: Shell Responsiveness
- **BottomNav.jsx** (new): Fixed bottom nav with Calendar/Roster/Drafts NavLinks, hidden on `md+` via `md:hidden`. Uses `env(safe-area-inset-bottom)` for iOS safe area. Active route gets `text-ww-blue font-semibold`.
- **AppShell**: Responsive grid using CSS custom property `--sidebar-w` with `grid-cols-[var(--sidebar-w,64px)_1fr]` on desktop and `grid-cols-1` on mobile. Main content adds bottom padding on mobile to clear the BottomNav.
- **Sidebar**: `hidden md:flex` hides entirely on mobile — BottomNav takes over navigation.
- **WorkshopPanel**: Bottom sheet on mobile (`inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl translate-y`) vs. right slide on desktop (`md:right-0 md:top-0 md:h-screen md:w-[400px] md:translate-x`). Drag handle (`w-10 h-1 rounded-full bg-slate-300`) shown on mobile only.
- **CoachRoster inline panel**: Same bottom sheet treatment applied. Card list added for mobile (`md:hidden divide-y`), table wrapped in `hidden md:block`.

### Task 2: Calendar Responsiveness
- **ScheduleCalendar toolbar**: Wraps to 2 rows on mobile — Row 1: Today+arrows+date (full width); Row 2: FilterBar+view tabs+Create (full width). Date text uses shortened format on mobile. Create button shows only Plus icon on mobile.
- **Week tab hidden on mobile**: `hidden md:block` on the Week tab button; `useEffect` with `matchMedia('(max-width: 767px)')` auto-switches from week to day view when mobile viewport detected.
- **FilterBar**: Desktop shows 4 individual FilterDropdowns. Mobile shows a single `SlidersHorizontal` "Filters" button that opens an absolute-positioned panel with `MobileFilterSection` components (inline checkbox lists, no dropdown).
- **MonthView**: Mobile cells show colored dot row (`flex flex-row flex-wrap gap-1`); desktop cells show text pills stacked vertically. Cell min-height reduced to `80px` on mobile from `120px` on desktop. Overflow "+N more" link desktop-only.

### Task 3: Table Responsiveness
- **DraftManager**: Desktop table wrapped in `hidden md:block`. Mobile card list (`md:hidden`) with select-all header + per-card checkboxes, title, conflict icon, coach+time, type pill.

## Decisions Made

1. **AppShell grid approach**: CSS custom property `--sidebar-w` with Tailwind `grid-cols-[var(--sidebar-w,64px)_1fr]` handles the dynamic sidebar width for desktop while `grid-cols-1` (default) provides mobile layout — no JavaScript resize listener needed.

2. **Bottom sheet transform pattern**: `translate-y-full` (closed, mobile) / `translate-y-0` (open, mobile) / `md:translate-y-0 md:translate-x-full` (closed, desktop) / `md:translate-x-0` (open, desktop) — both axes controlled via a single conditional class string.

3. **MonthView dual DOM**: Two separate `<div>` blocks (one `flex md:hidden`, one `hidden md:flex`) rather than complex single-element responsive classes — cleaner, easier to maintain independently.

4. **FilterBar mobile panel**: Absolute-positioned dropdown (not a modal/drawer) placed relative to the Filters button — simpler implementation that works within the toolbar layout without z-index conflicts.

5. **Auto week->day switch**: `useEffect` with `matchMedia` checks on mount and listens for viewport changes — handles both initial load on mobile and resizing between viewports.

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written, with one minor simplification:

**AppShell simplification:** Plan suggested several approaches for the responsive grid. Used CSS custom property approach (`--sidebar-w`) directly on the grid element without an extra style tag or wrapper div — simpler than the `app-shell` class + `<style>` tag approach initially considered. Same outcome, cleaner markup.

**CoachRoster card layout done in Task 1:** Plan specified card layout in Task 3, but since the CoachRoster file was already being modified for the bottom sheet panel (Task 1e), the card layout (Task 3a) was implemented simultaneously to avoid a second pass over the same file. No behavioral difference.

## Self-Check

### Files Exist
- `src/components/layout/BottomNav.jsx` — FOUND
- `src/components/layout/AppShell.jsx` — FOUND (modified)
- `src/components/layout/Sidebar.jsx` — FOUND (modified)
- `src/components/panel/WorkshopPanel.jsx` — FOUND (modified)
- `src/pages/CoachRoster.jsx` — FOUND (modified)
- `src/pages/ScheduleCalendar.jsx` — FOUND (modified)
- `src/components/filters/FilterBar.jsx` — FOUND (modified)
- `src/components/calendar/MonthView.jsx` — FOUND (modified)
- `src/pages/DraftManager.jsx` — FOUND (modified)

### Build Status
`npm run build` — PASSED (zero errors, all 3 task commits)

### Commits Exist
- 48a820e — Task 1: responsive shell
- fc54edf — Task 2: calendar responsiveness
- c0df635 — Task 3: DraftManager cards

## Self-Check: PASSED
