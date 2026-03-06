# Roadmap: WW Workshop Scheduler

## Overview

Start from a bare Vite scaffold and build a high-fidelity workshop scheduling prototype. The work proceeds in natural layers: foundation and data first, then the core calendar view, then workshop interaction (detail panel and creation), then the critical conflict detection engine, then discovery tools (filters and availability overlay), then the two supporting pages (Coach Roster and Draft Manager), and finally polish and keyboard shortcuts. Each phase delivers something independently verifiable.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - App shell, navigation, brand design system, and all mock data
- [x] **Phase 2: Calendar Grid** - Weekly calendar grid with workshop event cards rendered from mock data (completed 2026-03-06)
- [x] **Phase 3: Workshop Detail** - Right-side detail panel (view/edit) and click-to-create workflow (completed 2026-03-06)
- [ ] **Phase 4: Conflict Detection** - Conflict detection engine with visual warnings on calendar and panel
- [ ] **Phase 5: Filters & Availability** - Sidebar filters and coach availability overlay on calendar
- [ ] **Phase 6: Coach Roster** - Coach Roster page with table view and detail panel
- [ ] **Phase 7: Draft Manager & Polish** - Draft Manager page, batch publish, micro-interactions, and keyboard shortcuts

## Phase Details

### Phase 1: Foundation
**Goal**: The app shell exists with correct layout, navigation, brand styling, and realistic mock data loaded
**Depends on**: Nothing (first phase)
**Requirements**: LAYOUT-01, LAYOUT-02, LAYOUT-03, LAYOUT-04, LAYOUT-05, DATA-01, DATA-02, DATA-03, DATA-04
**Success Criteria** (what must be TRUE):
  1. App renders with left sidebar (240px), top bar showing "Kathleen Toth" and notification bell, and a main content area
  2. Three navigation items are visible and navigable: Schedule Calendar, Coach Roster, Draft Manager
  3. Brand colors (navy, blue, coral) and Inter/system font at 14px base are applied consistently throughout the shell
  4. Mock data is loadable: 15-20 coaches with availability and 40-50 workshops with realistic types, times, coaches, and attendance data exist in the app's state
  5. At least 2-3 intentional coach double-booking conflicts exist in the mock data (visible to developers inspecting state)
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Install dependencies, configure Tailwind v4 with WW brand tokens, clean scaffold
- [x] 01-02-PLAN.md — Build app shell (sidebar, top bar, content area), React Router, navigation
- [x] 01-03-PLAN.md — Create mock data (18 coaches, 45 workshops, 3 intentional conflicts)

### Phase 2: Calendar Grid
**Goal**: Coordinators can see the full weekly workshop schedule at a glance on the calendar
**Depends on**: Phase 1
**Requirements**: CAL-01, CAL-02, CAL-03, CAL-04, CAL-05, CARD-01, CARD-02, CARD-03
**Success Criteria** (what must be TRUE):
  1. A Mon-Sun grid with 30-minute rows from 6:00 AM to 10:00 PM ET is visible as the default Schedule Calendar view
  2. Workshop events appear as color-coded blocks at the correct time position on the grid, showing time, title, coach name, and co-coach
  3. Each card has a visible status indicator: yellow dot for Draft, green dot for Published
  4. Workshop type color coding is applied: Weekly=blue, All In=purple, Special Event=coral, Coaching Corner=teal, Movement=green
  5. The coordinator can navigate to previous/next weeks using arrows and jump to the current week with a "Today" button; the header shows the correct week date range
**Plans**: 2 plans

Plans:
- [x] 02-01-PLAN.md — CalendarGrid + WorkshopCard components with type colors, status dots, coach info; wired into ScheduleCalendar with current week
- [x] 02-02-PLAN.md — Week navigation (prev/next arrows, Today button), view toggle tabs (Day/Week/Month), and week header date range display

### Phase 3: Workshop Detail
**Goal**: Coordinators can open any workshop to view and edit its details, and create new workshops by clicking empty time slots
**Depends on**: Phase 2
**Requirements**: PANEL-01, PANEL-02, PANEL-03, PANEL-04, PANEL-05, PANEL-06, CREATE-01, CREATE-02
**Success Criteria** (what must be TRUE):
  1. Clicking a workshop card opens a 400px panel that slides in from the right (200ms ease)
  2. The panel shows all editable fields: title, date/time with timezone, coach dropdown, co-coach dropdown, type, description, recurrence, and market checkboxes (US/CA/UK/ANZ)
  3. The coach dropdown shows available coaches in green and unavailable coaches grayed out with a reason
  4. The panel shows a status badge and an attendance sparkline (last 5 weeks) for published workshops
  5. Clicking an empty calendar time slot opens the panel in create mode with date and time pre-filled
  6. Save Draft, Remove from Schedule, and Publish action buttons are present and functional (updating app state)
**Plans**: 3 plans

Plans:
- [x] 03-01-PLAN.md — Build slide-in panel shell with open/close animation, close-on-Escape, overlay backdrop, and wire card click to open panel
- [x] 03-02-PLAN.md — Build panel form with all editable fields, status badge, attendance sparkline, conflict stub, and action buttons wired to state
- [x] 03-03-PLAN.md — Implement click-to-create on empty time slots (pre-fills date/time) and coach availability-aware dropdown

### Phase 4: Conflict Detection
**Goal**: Conflicts are immediately visible on the calendar and in the detail panel so coordinators can spot problems at a glance
**Depends on**: Phase 3
**Requirements**: CONFLICT-01, CONFLICT-02, CONFLICT-03, CONFLICT-04, CONFLICT-05
**Success Criteria** (what must be TRUE):
  1. Workshops where a coach is double-booked show a red border and warning icon on their calendar cards
  2. Time slots with 4 or more concurrent workshops show an amber saturation bar with the count
  3. A workshop detail panel shows a red alert box at the top listing all active conflicts (double-booking, buffer violation, availability conflict) when the workshop has conflicts
  4. The intentional mock data conflicts are visually flagged on the calendar without any coordinator action
  5. Conflicts display as warnings only — saving and publishing workshops with conflicts is not blocked
**Plans**: 2 plans

Plans:
- [ ] 04-01-PLAN.md — TDD: Build conflict detection engine (buildConflictMap + getSaturatedSlots) with tests
- [ ] 04-02-PLAN.md — Wire conflict results into calendar cards (rings, icons, saturation bars) and detail panel (alert box)

### Phase 5: Filters & Availability
**Goal**: Coordinators can narrow the calendar view by coach, type, status, or market, and overlay coach availability on the grid
**Depends on**: Phase 4
**Requirements**: FILTER-01, FILTER-02, FILTER-03, FILTER-04, FILTER-05, AVAIL-01, AVAIL-02, AVAIL-03
**Success Criteria** (what must be TRUE):
  1. Selecting a coach in the sidebar filter highlights that coach's workshops and dims all others
  2. Type checkboxes, status filter (Draft/Published/All), and market filter (US/CA/UK/ANZ) all correctly filter the visible workshops
  3. A "Clear all filters" link resets all filter state and shows all workshops
  4. A "Show Availability" toggle in the toolbar layers a color-coded availability tint (green=available, gray=unavailable) onto calendar cells without replacing workshop cards
**Plans**: TBD

Plans:
- [ ] 05-01: Build sidebar filter components — coach multi-select, type checkboxes, status radio, market checkboxes, and clear link — wired to filter state
- [ ] 05-02: Apply filter state to calendar rendering (highlight/dim workshops) and build availability overlay (toggle + colored cell tinting)

### Phase 6: Coach Roster
**Goal**: Coordinators can review the full coach list and inspect any coach's details, schedule, and availability
**Depends on**: Phase 5
**Requirements**: ROSTER-01, ROSTER-02, ROSTER-03
**Success Criteria** (what must be TRUE):
  1. The Coach Roster page shows a table with all 15-20 coaches including their photo/initials, name, type badge (Coach Creator/Legacy), workshops this week, average attendance with trend arrow, and status
  2. Clicking a coach row opens a detail panel showing the coach's name, type, email, mini weekly schedule, availability blocks, and performance summary cards
  3. "Edit Availability" and "View Full Schedule" buttons are present on the coach detail panel
**Plans**: TBD

Plans:
- [ ] 06-01: Build Coach Roster page with sortable table, coach type badges, attendance trend arrows, and row selection
- [ ] 06-02: Build coach detail panel with mini weekly schedule grid, availability block display, performance cards, and action buttons

### Phase 7: Draft Manager & Polish
**Goal**: Coordinators can review and batch-publish draft workshops, and the app feels polished with smooth interactions and keyboard shortcuts
**Depends on**: Phase 6
**Requirements**: DRAFT-01, DRAFT-02, DRAFT-03, DRAFT-04, UX-01, UX-02, UX-03, UX-04, UX-05, UX-06, KEY-01, KEY-02
**Success Criteria** (what must be TRUE):
  1. The Draft Manager page lists draft batches with change counts, conflict count badges, and status; the Review Changes view shows all workshops with new/modified/cancelled indicators
  2. Conflicts are called out at the top of the Draft Manager with a "Resolve Conflicts" button; the "Publish All" button shows a confirmation modal and success toast on confirm
  3. The side panel slides in and out with a 200ms ease animation; workshop cards have a hover lift effect; conflict warnings pulse with a subtle red glow
  4. Status changes (Draft → Published) animate with color transitions; toast notifications slide in from top-right
  5. Empty states display correctly: dashed border on empty calendar cells with "+ Add workshop" on hover; "No coaches available" and "No scheduling conflicts" messages where applicable
  6. Left/Right arrow keys navigate weeks; T jumps to today; Esc closes the open panel; N opens the create panel for a new workshop
**Plans**: TBD

Plans:
- [ ] 07-01: Build Draft Manager page — batch list, Review Changes view, conflict summary, Publish All with confirmation modal and success toast
- [ ] 07-02: Add micro-interactions — panel slide animation, card hover lift, conflict pulse, status color transitions, toast notifications, empty states
- [ ] 07-03: Implement keyboard shortcuts — week navigation (arrows), today (T), close panel (Esc), new workshop (N)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | Complete    | 2026-03-06 |
| 2. Calendar Grid | 2/2 | Complete    | 2026-03-06 |
| 3. Workshop Detail | 3/3 | Complete    | 2026-03-06 |
| 4. Conflict Detection | 1/2 | In Progress|  |
| 5. Filters & Availability | 0/2 | Not started | - |
| 6. Coach Roster | 0/2 | Not started | - |
| 7. Draft Manager & Polish | 0/3 | Not started | - |
