# Roadmap: WW Workshop Scheduler

## Overview

High-fidelity workshop scheduling prototype built in natural layers. v1.0 delivered the core calendar, detail panel, and conflict detection. v1.1 adds filtering, secondary pages, and polish to make the prototype feel like a complete product demo.

## Milestones

- v1.0 Core Scheduling Prototype — Phases 1-4 (shipped 2026-03-09)
- v1.1 Interactive Polish — Phases 5-11 (active)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

<details>
<summary>v1.0 Core Scheduling Prototype (Phases 1-4) — SHIPPED 2026-03-09</summary>

- [x] **Phase 1: Foundation** (3/3 plans) — completed 2026-03-06
- [x] **Phase 2: Calendar Grid** (2/2 plans) — completed 2026-03-06
- [x] **Phase 3: Workshop Detail** (3/3 plans) — completed 2026-03-06
- [x] **Phase 4: Conflict Detection** (2/2 plans) — completed 2026-03-09

See: `.planning/milestones/v1.0-ROADMAP.md` for full phase details.

</details>

### v1.1 Interactive Polish (Active)

- [x] **Phase 5: Context Foundation + Toast System** - Cross-cutting state infrastructure and toast notifications (completed 2026-03-09)
- [x] **Phase 6: Sidebar Filters + Highlight/Dim** - Coach, type, status, and market filters with visual dim mode (completed 2026-03-09)
- [x] **Phase 7: Keyboard Shortcuts** - Week navigation, panel control, and create-workshop shortcuts (completed 2026-03-09)
- [x] **Phase 8: Coach Roster Page** - Sortable coach table with slide-in detail panel (completed 2026-03-09)
- [x] **Phase 9: Draft Manager Page** - Batch workshop selection, conflict-aware publish flow (completed 2026-03-10)
- [x] **Phase 10: Availability Overlay** - Semi-transparent coach availability lanes on the calendar grid (completed 2026-03-10)
- [x] **Phase 11: Micro-interactions + Empty States** - Hover animations, panel easing, conflict pulse, and empty state messages (completed 2026-03-10)

## Phase Details

### Phase 5: Context Foundation + Toast System
**Goal**: Every page can fire toast notifications and read from a filter-aware context shape
**Depends on**: Phase 4
**Requirements**: INTR-01
**Success Criteria** (what must be TRUE):
  1. After saving a workshop in the detail panel, a toast notification slides in at the bottom-right and auto-dismisses after 3-4 seconds
  2. After creating a new workshop, a toast appears confirming the action with the workshop name
  3. Toast notifications stack cleanly when multiple actions fire in quick succession without overlapping or obscuring page content
  4. Navigating between pages (Schedule, Roster, Draft Manager) does not cause toasts from the previous page to disappear mid-display
**Plans**: 1 plan
Plans:
- [ ] 05-01-PLAN.md — Install sonner, extend context with filters + memoization, wire toast into all action handlers

### Phase 6: Sidebar Filters + Highlight/Dim
**Goal**: Coordinators can narrow the calendar to specific coaches, types, statuses, or markets with visual feedback
**Depends on**: Phase 5
**Requirements**: FILT-01, FILT-02, FILT-03, FILT-04, FILT-05, FILT-06, FILT-07, FILT-08, EMPT-02, EMPT-03
**Success Criteria** (what must be TRUE):
  1. Selecting one or more coaches, types, statuses, or markets in the sidebar immediately dims non-matching workshop cards to ~25% opacity while matching cards remain fully visible
  2. Active filters appear as removable pills above the calendar grid — each pill labels what is filtered (e.g., "Coach: Sarah M.") and clicking X on it removes that filter
  3. A single "Clear all" button removes every active filter and restores all cards to full opacity
  4. Active filter state survives week navigation — filters applied on Monday's week remain applied after clicking the next-week arrow
  5. When filters produce zero matching workshops, the grid shows a "No matching workshops" message with a "Clear filters" call to action; when a single coach is filtered with no workshops, the message is personalized ("No workshops for [Name] this week")
**Plans**: 2 plans
Plans:
- [x] 06-01-PLAN.md — Create filterEngine.js utility and wire sidebar filter controls
- [ ] 06-02-PLAN.md — FilterPills strip, CalendarGrid dim effect, and empty state for zero matches

### Phase 7: Keyboard Shortcuts
**Goal**: Coordinators can navigate and act without reaching for the mouse
**Depends on**: Phase 5
**Requirements**: INTR-02, INTR-03, INTR-04, INTR-05
**Success Criteria** (what must be TRUE):
  1. Pressing the left or right arrow key navigates to the previous or next week on the calendar
  2. Pressing T jumps the calendar to the current week (same behavior as the Today button)
  3. Pressing Escape closes the open workshop detail panel; pressing Escape with no panel open does nothing
  4. Escape does not fire when the cursor is inside a text input or textarea in the detail panel
  5. Pressing N opens the create-workshop flow with the next available time slot pre-filled
**Plans**: 1 plan
Plans:
- [ ] 07-01-PLAN.md — Create useKeyboardShortcuts hook + slotFinder utility, wire into ScheduleCalendar, remove WorkshopPanel inline Escape listener

### Phase 8: Coach Roster Page
**Goal**: Coordinators can review the full coach list, sort it, search it, and inspect any coach's details
**Depends on**: Phase 6
**Requirements**: ROST-01, ROST-02, ROST-03, ROST-04, ROST-05, ROST-06
**Success Criteria** (what must be TRUE):
  1. The Coach Roster page displays all 18 coaches in a table with columns for name, workshop count for the current week, and availability status badge
  2. Clicking a column header sorts the table by that column; clicking it again toggles between ascending and descending order
  3. Typing in the search field filters the table to coaches whose names match the input — the table updates immediately with each keystroke
  4. Clicking a coach row opens a slide-in detail panel showing that coach's name, status badge, and relevant details
**Plans**: 1 plan
Plans:
- [ ] 08-01-PLAN.md — Sortable/searchable coach table + CoachDetailPanel slide-in panel

### Phase 9: Draft Manager Page
**Goal**: Coordinators can select draft workshops in bulk and publish them with conflict-aware confirmation
**Depends on**: Phase 5
**Requirements**: DRAF-01, DRAF-02, DRAF-03, DRAF-04, DRAF-05
**Success Criteria** (what must be TRUE):
  1. The Draft Manager page lists all draft workshops in a table with checkbox selection per row and a select-all checkbox in the header
  2. Selecting one or more workshops and clicking Publish opens a confirmation modal stating exactly how many workshops will be published
  3. When selected workshops include conflicts, the Publish button displays a conflict count badge (e.g., "Publish (2 conflicts)") before the modal opens
  4. The confirmation modal warns about conflicts and offers both "Cancel" and "Publish anyway" options when conflicts are present
  5. After confirming publish, the selected workshops disappear from the draft list and a toast notification confirms the action
**Plans**: 1 plan
Plans:
- [ ] 09-01-PLAN.md — DraftManager table with checkbox selection, conflict-aware publish button, confirmation modal, and toast feedback

### Phase 10: Availability Overlay
**Goal**: Coordinators can see when each coach is available directly on the calendar grid
**Depends on**: Phase 6
**Requirements**: OVER-01, OVER-02
**Success Criteria** (what must be TRUE):
  1. A toggle control in the calendar navigation bar enables and disables the availability overlay
  2. When the overlay is on, semi-transparent colored bands appear behind workshop cards in each day column showing each coach's available hours — bands do not obscure or interfere with clicking workshop cards
**Plans**: 1 plan
Plans:
- [x] 10-01-PLAN.md — Toggle button, availability bands utility, and colored band rendering in CalendarGrid

### Phase 11: Micro-interactions + Empty States
**Goal**: Every interactive element responds to user action with smooth, purposeful animation and every empty context has a clear message and path forward
**Depends on**: Phase 9
**Requirements**: INTR-06, INTR-07, INTR-08, EMPT-01
**Success Criteria** (what must be TRUE):
  1. Hovering over a workshop card lifts it 2px with a shadow elevation increase — the effect is smooth (no janky reflow) and does not expand the card's click target
  2. Opening and closing the workshop detail panel uses cubic-bezier easing that feels snappy on open and graceful on close
  3. Workshop cards with active conflicts display a subtly pulsing status dot on a 2-second cycle that draws the eye without being distracting
  4. A calendar week with no workshops scheduled shows a "No workshops scheduled" message and a "Create Workshop" call to action in place of the empty grid
**Plans**: 1 plan
Plans:
- [ ] 11-01-PLAN.md — CSS tokens, card hover lift, conflict pulse, panel easing, and empty week state

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 3/3 | Complete | 2026-03-06 |
| 2. Calendar Grid | v1.0 | 2/2 | Complete | 2026-03-06 |
| 3. Workshop Detail | v1.0 | 3/3 | Complete | 2026-03-06 |
| 4. Conflict Detection | v1.0 | 2/2 | Complete | 2026-03-09 |
| 5. Context Foundation + Toast System | v1.1 | 1/1 | Complete | 2026-03-09 |
| 6. Sidebar Filters + Highlight/Dim | 2/2 | Complete    | 2026-03-09 | - |
| 7. Keyboard Shortcuts | 1/1 | Complete    | 2026-03-09 | - |
| 8. Coach Roster Page | 1/1 | Complete    | 2026-03-09 | - |
| 9. Draft Manager Page | 1/1 | Complete    | 2026-03-10 | - |
| 10. Availability Overlay | v1.1 | Complete    | 2026-03-10 | 2026-03-10 |
| 11. Micro-interactions + Empty States | 1/1 | Complete   | 2026-03-10 | - |
