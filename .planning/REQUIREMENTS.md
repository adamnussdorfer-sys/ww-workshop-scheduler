# Requirements: WW Workshop Scheduler

**Defined:** 2026-03-05
**Core Value:** Coordinators can see the full weekly workshop schedule at a glance, spot conflicts immediately, and publish changes with confidence.

## v1 Requirements

### Layout & Navigation

- [ ] **LAYOUT-01**: App has left sidebar (240px, collapsible) with navigation and filters
- [ ] **LAYOUT-02**: Top bar (56px) shows app name, current user (Kathleen Toth), and notifications bell with badge count
- [ ] **LAYOUT-03**: Three navigable pages: Schedule Calendar, Coach Roster, Draft Manager
- [ ] **LAYOUT-04**: WeightWatchers brand colors applied consistently (navy, blue, coral, success, warning)
- [ ] **LAYOUT-05**: Inter or system font stack, 14px base, generous whitespace

### Calendar Core

- [ ] **CAL-01**: Weekly calendar grid (Mon-Sun columns, 6:00 AM - 10:00 PM ET rows, 30-min increments)
- [ ] **CAL-02**: View toggles: Day | Week | Month (Week default, others simplified)
- [ ] **CAL-03**: Week navigation with left/right arrows and "Today" button
- [ ] **CAL-04**: Header displays "Week of [date range]" with nav arrows
- [ ] **CAL-05**: Workshop events appear as colored blocks on the calendar grid

### Workshop Cards

- [ ] **CARD-01**: Cards show time, title, coach name, co-coach (if applicable)
- [ ] **CARD-02**: Status indicator dot/badge: Draft (yellow), Published (green), Conflict (red pulse)
- [ ] **CARD-03**: Workshop type color coding: Weekly=blue, All In=purple, Special Event=coral, Coaching Corner=teal, Movement/Fitness=green

### Workshop Detail Panel

- [ ] **PANEL-01**: Right-side slide-in panel (400px) opens on workshop card click
- [ ] **PANEL-02**: Shows editable fields: title, date/time with timezone, coach dropdown, co-coach dropdown, type dropdown, description, recurrence, markets (US/CA/UK/ANZ checkboxes)
- [ ] **PANEL-03**: Status badge display (Draft/Published/Cancelled)
- [ ] **PANEL-04**: Attendance sparkline for published workshops (last 5 weeks mini chart)
- [ ] **PANEL-05**: Conflict warnings shown as red alert box at top of panel
- [ ] **PANEL-06**: Action buttons: Save Draft, Remove from Schedule, Publish

### Workshop Creation

- [ ] **CREATE-01**: Click empty time slot opens panel in create mode with date/time pre-filled
- [ ] **CREATE-02**: Coach dropdown shows available coaches (green) vs unavailable (grayed out with reason)

### Conflict Detection

- [ ] **CONFLICT-01**: Coach double-booking: red border + warning icon on overlapping workshops
- [ ] **CONFLICT-02**: Time slot saturation: amber bar when 4+ workshops at same time with count
- [ ] **CONFLICT-03**: Buffer violation: orange warning when coach has <15 min gap between workshops
- [ ] **CONFLICT-04**: Availability conflict: warning when workshop scheduled during coach's unavailable time
- [ ] **CONFLICT-05**: Conflicts are informational (warnings, not blocking)

### Filters

- [ ] **FILTER-01**: Coach multi-select filter highlights selected coach's workshops, dims others
- [ ] **FILTER-02**: Workshop type checkboxes filter by type
- [ ] **FILTER-03**: Status filter: Draft only / Published only / All
- [ ] **FILTER-04**: Market filter: US, Canada, UK, ANZ
- [ ] **FILTER-05**: "Clear all filters" link

### Coach Availability Overlay

- [ ] **AVAIL-01**: Toggle button "Show Availability" in toolbar
- [ ] **AVAIL-02**: Calendar cells color-coded: green=available, gray=unavailable, no tint=no data
- [ ] **AVAIL-03**: Overlay layers on top of regular calendar, doesn't replace it

### Coach Roster

- [ ] **ROSTER-01**: Table view with columns: photo/initials, name, type badge (Coach Creator/Legacy), employment, workshops this week, avg attendance with trend arrow, status
- [ ] **ROSTER-02**: Coach detail panel with name, photo, type, email, mini weekly schedule, availability blocks, performance summary cards
- [ ] **ROSTER-03**: "Edit Availability" and "View Full Schedule" buttons on coach detail

### Draft Manager

- [ ] **DRAFT-01**: List of draft batches showing: name, creator, date, change counts, conflict count badge, status, action buttons
- [ ] **DRAFT-02**: Review Changes view showing all workshops with change type indicators (new/modified/cancelled)
- [ ] **DRAFT-03**: Conflicts highlighted at top with "Resolve Conflicts" button
- [ ] **DRAFT-04**: "Publish All" button with confirmation modal and success toast

### Mock Data

- [ ] **DATA-01**: 15-20 coaches with mix of Coach Creators and Legacy Coaches, each with name, type, email, initials, availability, timezone
- [ ] **DATA-02**: 40-50 workshops across the week with realistic times, types, coaches, co-coaches, mix of Draft/Published
- [ ] **DATA-03**: 2-3 intentional conflicts (coach double-bookings) for demo
- [ ] **DATA-04**: Attendance data (15-200 range) with 5-week trend for published workshops

### Interactions & Polish

- [ ] **UX-01**: Side panel slides in from right (200ms ease)
- [ ] **UX-02**: Calendar events have subtle hover lift effect
- [ ] **UX-03**: Status changes animate with color transitions
- [ ] **UX-04**: Conflict warnings pulse gently (subtle red glow)
- [ ] **UX-05**: Toast notifications slide in from top-right
- [ ] **UX-06**: Empty states: dashed border cells with "+ Add workshop" on hover, "No coaches available", "No scheduling conflicts"

### Keyboard Shortcuts

- [ ] **KEY-01**: Left/Right arrows navigate weeks
- [ ] **KEY-02**: T for today, Esc to close panel, N for new workshop

## v2 Requirements

### Enhanced Views

- **VIEW-01**: Full Month view with workshop density indicators
- **VIEW-02**: Day view with detailed time blocks

### Advanced Features

- **ADV-01**: Drag-and-drop workshop rescheduling on calendar
- **ADV-02**: Bulk coach assignment tools
- **ADV-03**: Schedule templates (copy week structure)
- **ADV-04**: Export schedule to PDF/spreadsheet

### Notifications

- **NOTF-01**: Real notification delivery for schedule changes
- **NOTF-02**: Email notifications for published schedules

## Out of Scope

| Feature | Reason |
|---------|--------|
| Backend / API | Prototype uses local state and mock data |
| Mobile responsive | Desktop-optimized for coordinator workflow |
| Real authentication | Hardcoded user for prototype |
| Automated testing | Prototype phase, manual QA only |
| Accessibility audit | Not required for demo |
| Real-time collaboration | Single-user prototype |
| Coach self-service portal | Coordinator tool only |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| LAYOUT-01 | Phase 1 | Pending |
| LAYOUT-02 | Phase 1 | Pending |
| LAYOUT-03 | Phase 1 | Pending |
| LAYOUT-04 | Phase 1 | Pending |
| LAYOUT-05 | Phase 1 | Pending |
| DATA-01 | Phase 1 | Pending |
| DATA-02 | Phase 1 | Pending |
| DATA-03 | Phase 1 | Pending |
| DATA-04 | Phase 1 | Pending |
| CAL-01 | Phase 2 | Pending |
| CAL-02 | Phase 2 | Pending |
| CAL-03 | Phase 2 | Pending |
| CAL-04 | Phase 2 | Pending |
| CAL-05 | Phase 2 | Pending |
| CARD-01 | Phase 2 | Pending |
| CARD-02 | Phase 2 | Pending |
| CARD-03 | Phase 2 | Pending |
| PANEL-01 | Phase 3 | Pending |
| PANEL-02 | Phase 3 | Pending |
| PANEL-03 | Phase 3 | Pending |
| PANEL-04 | Phase 3 | Pending |
| PANEL-05 | Phase 3 | Pending |
| PANEL-06 | Phase 3 | Pending |
| CREATE-01 | Phase 3 | Pending |
| CREATE-02 | Phase 3 | Pending |
| CONFLICT-01 | Phase 4 | Pending |
| CONFLICT-02 | Phase 4 | Pending |
| CONFLICT-03 | Phase 4 | Pending |
| CONFLICT-04 | Phase 4 | Pending |
| CONFLICT-05 | Phase 4 | Pending |
| FILTER-01 | Phase 5 | Pending |
| FILTER-02 | Phase 5 | Pending |
| FILTER-03 | Phase 5 | Pending |
| FILTER-04 | Phase 5 | Pending |
| FILTER-05 | Phase 5 | Pending |
| AVAIL-01 | Phase 5 | Pending |
| AVAIL-02 | Phase 5 | Pending |
| AVAIL-03 | Phase 5 | Pending |
| ROSTER-01 | Phase 6 | Pending |
| ROSTER-02 | Phase 6 | Pending |
| ROSTER-03 | Phase 6 | Pending |
| DRAFT-01 | Phase 7 | Pending |
| DRAFT-02 | Phase 7 | Pending |
| DRAFT-03 | Phase 7 | Pending |
| DRAFT-04 | Phase 7 | Pending |
| UX-01 | Phase 7 | Pending |
| UX-02 | Phase 7 | Pending |
| UX-03 | Phase 7 | Pending |
| UX-04 | Phase 7 | Pending |
| UX-05 | Phase 7 | Pending |
| UX-06 | Phase 7 | Pending |
| KEY-01 | Phase 7 | Pending |
| KEY-02 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 53 total
- Mapped to phases: 53
- Unmapped: 0

---
*Requirements defined: 2026-03-05*
*Last updated: 2026-03-05 — traceability updated after roadmap creation*
