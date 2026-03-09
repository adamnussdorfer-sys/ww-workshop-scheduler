---
phase: 01-foundation
plan: 02
subsystem: ui
tags: [react, react-router, tailwind, lucide-react, layout, navigation, context]

# Dependency graph
requires:
  - phase: 01-01
    provides: Tailwind v4 with WW brand tokens (bg-ww-navy, bg-surface, text-ww-navy, etc.) and Inter font
provides:
  - CSS Grid app shell: 240px/64px collapsible sidebar + 56px topbar + scrollable content area
  - React Router v7 routing: /, /roster, /drafts mapped to page components
  - AppContext with coaches/workshops state ready for data in Plan 03
  - Sidebar with ww-navy background, NavItems with active-state highlighting, collapse toggle
  - TopBar with Kathleen Toth user info and Bell notification badge
affects: [02-schedule-view, 03-workshop-management, 04-coach-management, 05-conflict-detection, 06-publishing, 07-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CSS Grid for app shell layout with dynamic sidebar column width via inline style (Tailwind JIT cannot handle runtime values)"
    - "React Router v7 NavLink with isActive callback for sidebar active-state highlighting"
    - "Sidebar collapse state managed in AppShell, passed down as prop to Sidebar"
    - "AppContext pattern: createContext in context file, useState in App.jsx, Provider wraps AppShell"

key-files:
  created:
    - src/context/AppContext.jsx
    - src/components/layout/AppShell.jsx
    - src/components/layout/Sidebar.jsx
    - src/components/layout/TopBar.jsx
    - src/components/nav/NavItem.jsx
    - src/pages/ScheduleCalendar.jsx
    - src/pages/CoachRoster.jsx
    - src/pages/DraftManager.jsx
  modified:
    - src/main.jsx
    - src/App.jsx

key-decisions:
  - "Sidebar collapse state lives in AppShell (parent) not Sidebar — AppShell owns the grid column width"
  - "NavItem uses end={to === '/'} to prevent Schedule Calendar from matching all routes"
  - "Import from react-router not react-router-dom — React Router v7 uses unified package"

patterns-established:
  - "Layout: AppShell owns CSS Grid structure, Sidebar and TopBar are grid children"
  - "Navigation: NavItem wraps React Router NavLink with collapsed prop for icon-only mode"
  - "Context: AppContext.jsx exports both AppContext and useApp hook with provider guard"

requirements-completed: [LAYOUT-01, LAYOUT-02, LAYOUT-03]

# Metrics
duration: 1min
completed: 2026-03-06
---

# Phase 1 Plan 02: App Shell Layout and Navigation Summary

**CSS Grid app shell with collapsible ww-navy sidebar (240px/64px), 56px topbar, React Router v7 routing three pages, and AppContext ready for data**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-06T04:06:34Z
- **Completed:** 2026-03-06T04:07:52Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Built complete CSS Grid app shell with sidebar, topbar, and scrollable content area
- Wired React Router v7 with three navigable routes (/, /roster, /drafts)
- Sidebar collapses from 240px to 64px (icon-only mode) with toggle button
- TopBar shows "Kathleen Toth", "KT" avatar circle, and Bell icon with "3" notification badge
- AppContext provides coaches/workshops state ready for real data in Plan 03
- Build passes cleanly: 1746 modules transformed, no errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create AppContext, layout components, and page placeholders** - `f9fe19f` (feat)
2. **Task 2: Wire React Router and AppContext into App and main entry** - `5322196` (feat)

## Files Created/Modified
- `src/context/AppContext.jsx` - React context with useApp hook (throws if outside provider)
- `src/components/layout/AppShell.jsx` - CSS Grid wrapper managing sidebarCollapsed state
- `src/components/layout/Sidebar.jsx` - ww-navy sidebar with NavItems and collapse toggle (PanelLeftClose/PanelLeftOpen)
- `src/components/layout/TopBar.jsx` - 56px topbar with Bell badge and Kathleen Toth user info
- `src/components/nav/NavItem.jsx` - NavLink wrapper with isActive active-state and collapsed icon-only mode
- `src/pages/ScheduleCalendar.jsx` - Schedule Calendar placeholder
- `src/pages/CoachRoster.jsx` - Coach Roster placeholder
- `src/pages/DraftManager.jsx` - Draft Manager placeholder
- `src/main.jsx` - Added BrowserRouter from react-router wrapping App
- `src/App.jsx` - Rewrote to use AppContext.Provider, AppShell, and Routes

## Decisions Made
- Sidebar collapse state lives in AppShell (not Sidebar) because AppShell owns the CSS Grid column width — state must live where it is consumed.
- NavItem uses `end={to === '/'}` to ensure the Schedule Calendar nav item only matches the exact root path, preventing it from being highlighted on /roster and /drafts.
- Import from `react-router` (not `react-router-dom`) — React Router v7 ships as a unified package with a single entry point.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- App shell complete; all future phases can render content within the established grid layout
- AppContext initialized with empty coaches/workshops arrays — Plan 03 will populate with mock data
- React Router routes established; phase-specific pages can be built out in their respective plans
- No blockers

## Self-Check: PASSED

- src/context/AppContext.jsx: FOUND
- src/components/layout/AppShell.jsx: FOUND
- src/components/layout/Sidebar.jsx: FOUND
- src/components/layout/TopBar.jsx: FOUND
- src/components/nav/NavItem.jsx: FOUND
- src/pages/ScheduleCalendar.jsx: FOUND
- src/pages/CoachRoster.jsx: FOUND
- src/pages/DraftManager.jsx: FOUND
- src/main.jsx: FOUND (modified)
- src/App.jsx: FOUND (modified)
- Commit f9fe19f (Task 1): FOUND
- Commit 5322196 (Task 2): FOUND
- npm run build: PASSED (1746 modules, no errors)

---
*Phase: 01-foundation*
*Completed: 2026-03-06*
