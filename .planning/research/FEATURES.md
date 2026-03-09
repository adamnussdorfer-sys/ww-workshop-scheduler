# Feature Research

**Domain:** Workshop scheduling / staff coordination calendar — UI polish milestone
**Researched:** 2026-03-09
**Confidence:** MEDIUM (patterns verified across multiple sources; specifics extrapolated to this domain)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that coordinators assume exist in any scheduling tool. Missing these breaks the demo.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Sidebar filter: coach name | Any scheduling app with >10 staff has person-filter | LOW | Checkbox list; highlight matching cards, dim non-matching to ~30% opacity |
| Sidebar filter: workshop type | Color-coded type system already exists — filter is obvious extension | LOW | Multi-select; type tags already have color identity |
| Sidebar filter: status (draft/published/conflict) | Status dots exist on cards; users expect to isolate conflicts | LOW | Radio or multi-select; "show conflicts only" is a power user workflow |
| Sidebar filter: market/region | Coordinators manage by region — isolation is essential for review | LOW | Multi-select dropdown |
| Active filter indicator | Users must know filters are applied — invisible state causes confusion | LOW | Filter pills above grid OR badge count on sidebar toggle |
| Clear all filters | Once filters applied, escape hatch is mandatory | LOW | Single "Clear" button; resets all filter state |
| Sortable roster table (name, workshops, availability) | Standard expectation for any staff list page | MEDIUM | Click-column-header to toggle ASC/DESC; active column indicator |
| Roster search/filter by name | 18 coaches is manageable; >20 demands search | LOW | Debounced text input; highlights rows or filters list |
| Coach detail in roster | Staff list without detail panel is read-only noise | MEDIUM | Slide-in panel (reuse detail panel pattern from v1.0) |
| Empty state: no filter results | When filters match 0 workshops, blank grid looks broken | LOW | Inline message + "Clear filters" CTA |
| Empty state: no workshops in week | Empty week navigation looks like a bug | LOW | Centered card with "No workshops scheduled" + "Create Workshop" CTA |
| Toast confirmation after actions | Creating/saving/publishing without feedback is disorienting | LOW | Bottom-right, 3-second auto-dismiss, success/error variants |
| Draft Manager batch select | "Publish all" requires multi-select before action | MEDIUM | Checkbox per row + "Select all" header checkbox |
| Publish confirmation modal | Bulk destructive-ish action needs confirmation step | LOW | Lists item count; confirm/cancel; not reversible in prototype |
| Keyboard: week navigation (arrows) | Power users expect arrow key week pagination in any calendar | LOW | Left/Right arrows → prev/next week; already have button UI |
| Keyboard: Escape to close panel | Universal pattern; any slide-in panel that ignores Esc is broken | LOW | Document-level keydown listener; already have panel close button |
| Keyboard: T to jump to today | Google Calendar standard; users who know calendars expect it | LOW | Single key listener; calls existing setCurrentWeek(today) |

### Differentiators (Competitive Advantage)

Features that make this prototype feel like a real product, not a demo.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Availability overlay on calendar grid | Shows coach availability blocks directly on the grid — context without switching pages | HIGH | Semi-transparent colored bands behind workshop cards; toggle button in toolbar; per-coach color derived from coach roster; must not obscure card content |
| Filter highlight/dim mode | Selected filters illuminate matching cards; rest fade to ~25% opacity — spatial filtering instead of list filtering | MEDIUM | CSS opacity transition 200ms; matching cards get subtle ring or brightness boost; non-matching cards dim but stay visible |
| Saturation overlay per coach | Availability overlay can show weekly load at a glance (hours vs cap) | HIGH | Extends availability overlay; color-coded saturation gradient per column |
| Keyboard: N to create new workshop | Removes mouse requirement for coordinator power-user flow | LOW | Opens click-to-create with today's next available slot pre-filled |
| Filter persistence across week navigation | Filters stay active when navigating prev/next week — rare in calendar UIs | LOW | Filter state lives in parent; week navigation doesn't reset it |
| Roster page: workshop count per coach | Shows utilization at a glance; not common in staff roster pages | LOW | Computed from mock workshop data; sortable column |
| Roster page: availability status badges | Shows current-week availability inline in roster row | LOW | Derives from existing coach availability data |
| Draft Manager: conflict count badge | Shows number of conflicts blocking publish — motivates resolution | LOW | Count of workshops with conflict status; visual badge on "Publish" button |
| Draft Manager: publish with conflicts warning | Rather than blocking publish, warn and let coordinator override | MEDIUM | Secondary modal state: "X workshops have conflicts — publish anyway?" |
| Micro-interaction: card hover lift | Cards respond to cursor with subtle elevation change (box-shadow + translate-y) | LOW | CSS transition 150ms; 2px lift, shadow-md → shadow-lg; matches Linear/Notion feel |
| Micro-interaction: panel slide entrance | Panel uses cubic-bezier easing for entrance, not linear | LOW | Already using translate-x; change transition timing to ease-out-cubic |
| Micro-interaction: status dot pulse | Conflict status dot gets subtle pulse animation to draw attention | LOW | CSS @keyframes; applies only to `conflict` status; 2s cycle, subtle scale |
| Micro-interaction: filter checkbox animation | Checkboxes use spring-like check animation vs instant state flip | LOW | CSS transform on checkmark SVG; 120ms bounce |
| Empty state: filtered to specific coach | When coach filter is active and no workshops exist: "No workshops for [Name] this week" — personalized | LOW | Reads active filter state to compose message |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Drag-and-drop rescheduling | Feels natural for calendar editing | Requires complete rewrite of grid layout model; conflicts with click-to-create zone; weeks of complexity for prototype scope | Keep click-to-create + slide-in edit panel; it's faster for coordinators anyway |
| Real-time filter with debounce delay | Text search UX best practice | 18 coaches renders instantly; debounce adds perceived lag at small scale | Filter on each keystroke; React re-render is fast enough |
| Animated week transition (slide calendar) | Makes navigation feel fluid | Calendar is a dense grid; sliding 48 cards causes layout jank; state during animation is complex | Instant swap is cleaner; let week counter animate (number transition only) |
| Infinite scroll in roster table | Handles large datasets | 18 coaches always fits on one screen; infinite scroll adds intersection observer complexity for zero user benefit | Show all rows; no pagination needed at this scale |
| Save/load filter presets | Power users want to bookmark filter combos | Requires localStorage persistence, preset naming UI, preset delete — weeks of work; prototype has no auth for per-user storage | "Clear all" and a simple multi-select are sufficient for a demo |
| Multi-step publish wizard | Enterprise scheduling tools have approval workflows | Out of scope per PROJECT.md; no backend, no real users; wizard complexity dwarfs the demo value | Single confirmation modal with conflict count warning is sufficient |
| Mobile-responsive filters | Sidebar filters that collapse to drawer on mobile | PROJECT.md explicitly scopes to desktop 1280px+; responsive sidebar work has zero ROI | Fixed sidebar width; ignore mobile breakpoints |
| Inline cell editing on calendar grid | Edit workshop by clicking a field directly on the card | Conflicts with click-to-create behavior on empty cells; click routing becomes ambiguous | Slide-in panel is the editing surface; it's already built |

---

## Feature Dependencies

```
[Sidebar Filters (coach/type/status/market)]
    └──requires──> [Filter State in Parent Component]
                       └──requires──> [Highlight/Dim Visual Mode]

[Availability Overlay]
    └──requires──> [Coach Availability Data (already in mock)]
    └──requires──> [Grid column/row coordinate system (already in v1.0)]

[Draft Manager Page]
    └──requires──> [Workshop Status Field (draft/published — already in mock)]
    └──requires──> [Batch Select UI (checkboxes)]
                       └──enhances──> [Publish Confirmation Modal]

[Coach Roster Page]
    └──requires──> [Coach Data (already in mock)]
    └──enhances──> [Availability Overlay] (roster → overlay color assignment)

[Toast Notifications]
    └──enhances──> [Click-to-Create (already built)]
    └──enhances──> [Detail Panel Save (already built)]
    └──enhances──> [Draft Manager Publish]

[Keyboard Shortcuts]
    └──requires──> [Document-level keydown listener]
    └──conflicts──> [Panel text field focus] (Esc must not fire when typing in input)

[Empty States]
    └──requires──> [Filter State] (to compose contextual messages)
    └──requires──> [Workshop Data] (to detect truly empty week)

[Filter Persistence across weeks]
    └──requires──> [Filter State hoisted above week navigation]
    └──enhances──> [Sidebar Filters]
```

### Dependency Notes

- **Sidebar filters require filter state in parent:** Filter state must live at ScheduleCalendar level (or higher) so week navigation does not reset it. This is a state architecture decision before writing filter UI.
- **Availability overlay requires grid coordinate system:** The overlay renders behind workshop cards using the same time-slot grid. The existing 30-minute slot grid gives coordinates; overlay just needs semi-transparent absolutely-positioned divs in the same grid.
- **Keyboard Esc conflicts with panel text inputs:** A document-level `keydown` listener for Esc must check `event.target.tagName` — do not close the panel if focus is inside an `<input>` or `<textarea>`.
- **Toast enhances multiple existing features:** Toast is a cross-cutting concern. Build it once as a standalone component with a hook (`useToast`) and call from anywhere — do not inline per-action.
- **Draft Manager requires workshop status field:** Check mock data includes `status: "draft" | "published"` field. If not present, add to mock data before building Draft Manager page.

---

## MVP Definition

This is a subsequent milestone (v1.1) on a working v1.0 prototype. "MVP" here means: minimum feature set to make the demo feel complete for a product review.

### Launch With (v1.1 core)

- [x] Sidebar filters (coach, type, status, market) with highlight/dim — table stakes for demo
- [x] Active filter pills + clear all — without these, filters feel broken
- [x] Toast notification system — completes every action flow that currently has no feedback
- [x] Keyboard shortcuts (arrows, T, Esc, N) — adds 10% effort for outsized "feels polished" perception
- [x] Empty states: no results from filter, empty week — prevents demo-breaking blank states
- [x] Coach Roster page: sortable table + slide-in detail panel — second page needs to feel functional
- [x] Draft Manager page: batch select + publish confirmation modal — third page needs its core workflow

### Add After Core (v1.1 polish)

- [x] Micro-interactions: hover lift, panel easing, status pulse — add after all pages functional
- [x] Availability overlay — most complex feature; add after filters and roster are stable
- [x] Filter persistence across week navigation — only adds value once filters are proven useful
- [x] Draft Manager conflict count badge + override warning — enhances publish workflow

### Future Consideration (v2+, out of scope for prototype)

- [ ] Drag-and-drop rescheduling — requires architecture changes; not prototype scope
- [ ] Filter presets / saved views — requires persistence layer
- [ ] Mobile responsive sidebar — explicitly out of scope per PROJECT.md
- [ ] Real approval workflow — requires backend

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Sidebar filters (4 types) | HIGH | LOW | P1 |
| Filter highlight/dim mode | HIGH | MEDIUM | P1 |
| Active filter pills + clear | HIGH | LOW | P1 |
| Toast notification system | HIGH | LOW | P1 |
| Keyboard shortcuts (arrows, T, Esc) | MEDIUM | LOW | P1 |
| Empty state: filter no results | HIGH | LOW | P1 |
| Empty state: empty week | MEDIUM | LOW | P1 |
| Coach Roster page (table + detail) | HIGH | MEDIUM | P1 |
| Draft Manager (batch + modal) | HIGH | MEDIUM | P1 |
| Keyboard: N for new workshop | MEDIUM | LOW | P2 |
| Micro-interaction: hover lift | MEDIUM | LOW | P2 |
| Micro-interaction: panel easing | LOW | LOW | P2 |
| Micro-interaction: status pulse | MEDIUM | LOW | P2 |
| Availability overlay on grid | HIGH | HIGH | P2 |
| Filter persistence across weeks | MEDIUM | LOW | P2 |
| Draft Manager conflict badge | MEDIUM | LOW | P2 |
| Draft Manager publish-with-conflicts | MEDIUM | MEDIUM | P2 |
| Roster: workshop count column | LOW | LOW | P3 |
| Roster: availability status badges | LOW | LOW | P3 |

**Priority key:**
- P1: Must have for v1.1 launch — demo feels broken without these
- P2: Should have — adds polish and depth
- P3: Nice to have — add only if time allows

---

## Competitor Feature Analysis

Reference apps for this domain's UI conventions (per PROJECT.md: "think Linear/Notion Calendar/Calendly").

| Feature | Google Calendar | Linear | Notion Calendar | Our Approach |
|---------|----------------|--------|-----------------|--------------|
| Sidebar filters | Calendar list with color toggle (show/hide) | Sidebar filter groups with multi-select | Database filter chips above view | Sidebar filter checkboxes + active pills above grid |
| Filter dim behavior | Hidden (calendar hides entirely) | Dimmed items in list view at ~40% opacity | Filtered rows removed from view | Dim non-matching cards to 25% opacity; keep visible for spatial context |
| Availability overlay | Free/busy shading in gray | N/A | N/A | Coach-colored semi-transparent bands behind cards |
| Keyboard shortcuts | Extensive (T, N, P, G, C, etc.) | Extensive (G then shortcuts) | Limited | T/Esc/arrows/N — small focused set appropriate for a coordinator tool |
| Toast notifications | Bottom-right, 3s auto-dismiss | Bottom-right, 4s with undo button | Bottom-right, 3s, action verb labels | Bottom-right, 3-4s, success/error variants; "Undo" only on destructive actions |
| Empty states | Illustration + "No events" text | Illustration + action CTA button | Contextual + CTA button | Contextual message + single CTA button; no illustrations (out of scope) |
| Staff/roster page | People directory (Google Workspace) | Members page: sortable table | Members database | Sortable table + slide-in detail panel reusing existing component |
| Bulk publish | N/A (publish is per-event) | Bulk status update via multi-select | Bulk edit via database multi-select | Checkbox multi-select + persistent action bar + confirmation modal |

---

## Sources

- Pencil & Paper: Filter UX Design Patterns & Best Practices — https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-filtering (MEDIUM confidence — enterprise filtering patterns)
- Eleken: Bulk Actions UX — https://www.eleken.co/blog-posts/bulk-actions-ux (MEDIUM confidence — bulk action guidelines, confirmation patterns)
- Eleken: Filter UX & UI for SaaS — https://www.eleken.co/blog-posts/filter-ux-and-ui-for-saas (MEDIUM confidence — chip/pill patterns, sidebar filter implementations)
- Eleken: Calendar UI — https://www.eleken.co/blog-posts/calendar-ui (MEDIUM confidence — availability overlay patterns, Calendly/ClickUp reference)
- Nielsen Norman Group: Empty States in Complex Applications — https://www.nngroup.com/articles/empty-state-interface-design/ (HIGH confidence — contextual CTA patterns, filter empty states)
- LogRocket: Toast Notifications UX — https://blog.logrocket.com/ux-design/toast-notifications/ (MEDIUM confidence — positioning, timing, accessibility)
- Bricxlabs: Micro-Interactions 2025 — https://bricxlabs.com/blogs/micro-interactions-2025-examples (LOW confidence — general micro-interaction trends)
- Google Calendar keyboard shortcuts — https://www.getmagical.com/blog/google-calendar-shortcuts-tips-tricks (MEDIUM confidence — standard shortcut conventions)
- Eleken: Calendar UI Examples — https://www.eleken.co/blog-posts/calendar-ui (MEDIUM confidence — grid overlay patterns)

---

*Feature research for: WW Workshop Scheduler — v1.1 Interactive Polish milestone*
*Researched: 2026-03-09*
