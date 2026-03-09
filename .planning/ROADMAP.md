# Roadmap: WW Workshop Scheduler

## Overview

High-fidelity workshop scheduling prototype built in natural layers. v1.0 delivered the core calendar, detail panel, and conflict detection. Remaining phases add discovery tools, supporting pages, and polish.

## Milestones

- ✅ **v1.0 Core Scheduling Prototype** — Phases 1-4 (shipped 2026-03-09)
- 📋 **v1.1 Discovery & Polish** — Phases 5-7 (planned)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

<details>
<summary>✅ v1.0 Core Scheduling Prototype (Phases 1-4) — SHIPPED 2026-03-09</summary>

- [x] **Phase 1: Foundation** (3/3 plans) — completed 2026-03-06
- [x] **Phase 2: Calendar Grid** (2/2 plans) — completed 2026-03-06
- [x] **Phase 3: Workshop Detail** (3/3 plans) — completed 2026-03-06
- [x] **Phase 4: Conflict Detection** (2/2 plans) — completed 2026-03-09

See: `.planning/milestones/v1.0-ROADMAP.md` for full phase details.

</details>

### 📋 v1.1 Discovery & Polish (Planned)

- [ ] **Phase 5: Filters & Availability** - Sidebar filters and coach availability overlay on calendar
- [ ] **Phase 6: Coach Roster** - Coach Roster page with table view and detail panel
- [ ] **Phase 7: Draft Manager & Polish** - Draft Manager page, batch publish, micro-interactions, and keyboard shortcuts

## Phase Details

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

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 3/3 | Complete | 2026-03-06 |
| 2. Calendar Grid | v1.0 | 2/2 | Complete | 2026-03-06 |
| 3. Workshop Detail | v1.0 | 3/3 | Complete | 2026-03-06 |
| 4. Conflict Detection | v1.0 | 2/2 | Complete | 2026-03-09 |
| 5. Filters & Availability | v1.1 | 0/2 | Not started | - |
| 6. Coach Roster | v1.1 | 0/2 | Not started | - |
| 7. Draft Manager & Polish | v1.1 | 0/3 | Not started | - |
