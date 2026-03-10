# Requirements: WW Workshop Scheduler v1.1

**Defined:** 2026-03-09
**Core Value:** Coordinators can see the full weekly workshop schedule at a glance, spot conflicts immediately, and publish changes with confidence.

## v1.1 Requirements

Requirements for Interactive Polish milestone. Each maps to roadmap phases.

### Filtering

- [x] **FILT-01**: Coordinator can filter calendar by coach name via sidebar checkboxes
- [x] **FILT-02**: Coordinator can filter calendar by workshop type via sidebar checkboxes
- [x] **FILT-03**: Coordinator can filter calendar by status (draft/published/conflict) via sidebar checkboxes
- [x] **FILT-04**: Coordinator can filter calendar by market/region via sidebar checkboxes
- [x] **FILT-05**: Active filters display as pills above the calendar grid showing what's applied
- [x] **FILT-06**: Coordinator can clear all active filters with a single "Clear" button
- [x] **FILT-07**: Non-matching workshop cards dim to ~25% opacity while matching cards stay fully visible
- [x] **FILT-08**: Active filters persist when navigating between weeks (prev/next/today)

### Availability Overlay

- [x] **OVER-01**: Coordinator can toggle a coach availability overlay on the calendar grid
- [x] **OVER-02**: Overlay renders semi-transparent colored bands behind workshop cards showing each coach's available hours

### Coach Roster

- [x] **ROST-01**: Coach Roster page displays all coaches in a sortable table (name, workshops, availability)
- [x] **ROST-02**: Coordinator can sort roster table by clicking column headers (toggle ASC/DESC)
- [x] **ROST-03**: Coordinator can search/filter coaches by name in the roster
- [x] **ROST-04**: Coordinator can click a coach row to open a slide-in detail panel
- [x] **ROST-05**: Roster table shows workshop count per coach for current week
- [x] **ROST-06**: Roster table shows availability status badge per coach

### Draft Manager

- [x] **DRAF-01**: Draft Manager page lists all draft workshops in a table
- [x] **DRAF-02**: Coordinator can select multiple draft workshops via checkboxes (with select-all)
- [x] **DRAF-03**: Coordinator can publish selected workshops via a confirmation modal showing item count
- [x] **DRAF-04**: Publish button displays a conflict count badge when selected workshops have conflicts
- [x] **DRAF-05**: Confirmation modal warns about conflicts and allows override ("publish anyway")

### Interactions

- [x] **INTR-01**: Toast notification appears after create, save, publish, and delete actions (auto-dismiss 3-4s)
- [x] **INTR-02**: Left/Right arrow keys navigate to previous/next week
- [x] **INTR-03**: T key jumps to current week (today)
- [x] **INTR-04**: Escape key closes the detail panel (does not fire when focus is in a text input)
- [x] **INTR-05**: N key opens the create-workshop flow with next available slot pre-filled
- [x] **INTR-06**: Workshop cards lift on hover (2px translate-y + shadow elevation)
- [x] **INTR-07**: Detail panel uses cubic-bezier easing for slide entrance/exit
- [x] **INTR-08**: Conflict status dot pulses subtly to draw attention (2s CSS animation cycle)

### Empty States

- [x] **EMPT-01**: Empty calendar week shows "No workshops scheduled" message with "Create Workshop" CTA
- [x] **EMPT-02**: Zero filter results shows "No matching workshops" message with "Clear filters" CTA
- [x] **EMPT-03**: Coach-specific filter with no results shows personalized "No workshops for [Name]" message

## Future Requirements

Deferred beyond v1.1. Tracked for future consideration.

### Roster Enhancements

- **ROST-07**: Coordinator can view coach schedule directly from roster detail panel
- **ROST-08**: Roster supports pagination for larger coach lists (>50)

### Advanced Filtering

- **FILT-09**: Coordinator can save and load filter presets
- **FILT-10**: Filter presets persist across sessions via localStorage

## Out of Scope

| Feature | Reason |
|---------|--------|
| Drag-and-drop rescheduling | Requires complete grid layout rewrite; click-to-create + panel edit is sufficient |
| Animated week transitions | Causes layout jank with 48 dense cards; instant swap is cleaner |
| Infinite scroll in roster | 18 coaches always fits on one screen; zero benefit |
| Filter presets / saved views | Requires persistence layer; simple multi-select sufficient for demo |
| Multi-step publish wizard | No backend, no real approval workflow; single confirmation modal sufficient |
| Mobile-responsive filters | Desktop-only prototype (1280px+ per PROJECT.md) |
| Inline cell editing on grid | Conflicts with click-to-create behavior; panel is the editing surface |
| Real-time debounced filter | 18 coaches renders instantly; debounce adds perceived lag |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FILT-01 | Phase 6 | Complete |
| FILT-02 | Phase 6 | Complete |
| FILT-03 | Phase 6 | Complete |
| FILT-04 | Phase 6 | Complete |
| FILT-05 | Phase 6 | Complete |
| FILT-06 | Phase 6 | Complete |
| FILT-07 | Phase 6 | Complete |
| FILT-08 | Phase 6 | Complete |
| OVER-01 | Phase 10 | Complete |
| OVER-02 | Phase 10 | Complete |
| ROST-01 | Phase 8 | Complete |
| ROST-02 | Phase 8 | Complete |
| ROST-03 | Phase 8 | Complete |
| ROST-04 | Phase 8 | Complete |
| ROST-05 | Phase 8 | Complete |
| ROST-06 | Phase 8 | Complete |
| DRAF-01 | Phase 9 | Complete |
| DRAF-02 | Phase 9 | Complete |
| DRAF-03 | Phase 9 | Complete |
| DRAF-04 | Phase 9 | Complete |
| DRAF-05 | Phase 9 | Complete |
| INTR-01 | Phase 5 | Complete |
| INTR-02 | Phase 7 | Complete |
| INTR-03 | Phase 7 | Complete |
| INTR-04 | Phase 7 | Complete |
| INTR-05 | Phase 7 | Complete |
| INTR-06 | Phase 11 | Complete |
| INTR-07 | Phase 11 | Complete |
| INTR-08 | Phase 11 | Complete |
| EMPT-01 | Phase 11 | Complete |
| EMPT-02 | Phase 6 | Complete |
| EMPT-03 | Phase 6 | Complete |

**Coverage:**
- v1.1 requirements: 32 total
- Mapped to phases: 32
- Unmapped: 0

---
*Requirements defined: 2026-03-09*
*Last updated: 2026-03-09 after v1.1 roadmap creation*
