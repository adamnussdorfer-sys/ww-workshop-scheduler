---
phase: quick
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/layout/AppShell.jsx
  - src/components/layout/Sidebar.jsx
  - src/components/layout/BottomNav.jsx
  - src/components/panel/WorkshopPanel.jsx
  - src/pages/CoachRoster.jsx
  - src/pages/ScheduleCalendar.jsx
  - src/components/filters/FilterBar.jsx
  - src/components/calendar/MonthView.jsx
  - src/pages/DraftManager.jsx
  - src/index.css
autonomous: true
must_haves:
  truths:
    - "On mobile (<768px), sidebar is hidden and a fixed bottom nav bar with 3 icons appears"
    - "On mobile, panels slide up from the bottom as bottom sheets instead of from the right"
    - "On mobile, the calendar toolbar stacks into two rows and filters collapse behind a button"
    - "On mobile, month view shows colored dots instead of text pills"
    - "On mobile, CoachRoster and DraftManager tables become stacked cards"
    - "On desktop (>=768px), everything looks and works exactly as before"
  artifacts:
    - path: "src/components/layout/BottomNav.jsx"
      provides: "Mobile bottom navigation bar"
      min_lines: 15
    - path: "src/components/layout/AppShell.jsx"
      provides: "Responsive grid that hides sidebar on mobile"
    - path: "src/components/panel/WorkshopPanel.jsx"
      provides: "Bottom sheet on mobile, right slide on desktop"
  key_links:
    - from: "src/components/layout/BottomNav.jsx"
      to: "NAV_ITEMS"
      via: "Same route data as Sidebar"
      pattern: "NavLink.*to="
    - from: "src/components/layout/AppShell.jsx"
      to: "BottomNav"
      via: "Rendered on mobile only"
      pattern: "md:hidden|BottomNav"
---

<objective>
Make the entire app responsive for mobile viewports (<768px, using Tailwind's `md:` breakpoint).

Purpose: The app currently only works on desktop with fixed sidebars and wide tables. Mobile users need a usable experience with bottom nav, bottom sheet panels, collapsed toolbar, dot-based month view, and card-based tables.

Output: All existing components updated with responsive Tailwind classes. One new BottomNav component. No behavioral changes on desktop.
</objective>

<execution_context>
@/Users/adam/.claude/get-shit-done/workflows/execute-plan.md
@/Users/adam/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/components/layout/AppShell.jsx
@src/components/layout/Sidebar.jsx
@src/components/nav/NavItem.jsx
@src/components/panel/WorkshopPanel.jsx
@src/pages/ScheduleCalendar.jsx
@src/components/filters/FilterBar.jsx
@src/components/calendar/MonthView.jsx
@src/pages/CoachRoster.jsx
@src/pages/DraftManager.jsx
@src/index.css
</context>

<tasks>

<task type="auto">
  <name>Task 1: Responsive shell — bottom nav, hide sidebar, bottom sheet panels</name>
  <files>
    src/components/layout/BottomNav.jsx
    src/components/layout/AppShell.jsx
    src/components/layout/Sidebar.jsx
    src/components/panel/WorkshopPanel.jsx
    src/pages/CoachRoster.jsx
    src/index.css
  </files>
  <action>
    **1a. Create BottomNav.jsx** — a new component for mobile navigation:
    - Import `NavLink` from `react-router`, import `Calendar`, `Users`, `FileText` from `lucide-react`
    - Define same NAV_ITEMS array as Sidebar: `[{ to: '/', icon: Calendar, label: 'Calendar' }, { to: '/roster', icon: Users, label: 'Roster' }, { to: '/drafts', icon: FileText, label: 'Drafts' }]`
    - Render a `<nav>` with classes: `fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border flex items-center justify-around h-14 md:hidden` (safe area: add `pb-[env(safe-area-inset-bottom)]`)
    - Each NavLink: `flex flex-col items-center gap-0.5 text-[10px]`, active state: `text-ww-blue font-semibold`, inactive: `text-slate-400`
    - Icon size 20, label below icon

    **1b. Update AppShell.jsx:**
    - Import BottomNav
    - On mobile: no CSS grid columns for sidebar. Change the outer div to: `className="h-screen flex flex-col md:grid overflow-hidden"` with `style` only applying `gridTemplateColumns` on md+ (use a conditional or just keep the style but hide sidebar)
    - Better approach: Keep the grid but hide sidebar with responsive classes:
      - Outer div: keep `h-screen grid overflow-hidden` but change gridTemplateColumns to only apply on desktop. Use `className="h-screen overflow-hidden flex flex-col md:grid"` and apply `style={{ gridTemplateColumns: \`${sidebarWidth} 1fr\` }}` only via a wrapper or media approach
      - Simplest: Use CSS classes. The outer div becomes `className="h-screen overflow-hidden"`. Inside, use a flex/grid approach:
        - Actually simplest: keep the grid with `style` but add `hidden md:flex` to sidebar, and use `grid-cols-1 md:grid-cols-[var(--sidebar)] ` ... but inline style complicates this.
      - **Recommended approach:** Remove inline style. Use CSS custom property. Set `--sidebar-w` via style prop. Use Tailwind: `className="h-screen grid overflow-hidden grid-cols-1 md:grid-cols-[var(--sidebar-w)_1fr]"` with `style={{ '--sidebar-w': sidebarWidth }}`. This way mobile gets `grid-cols-1` (no sidebar column), desktop gets the sidebar + 1fr.
    - Sidebar: add `hidden md:flex` to hide on mobile (it already uses `flex flex-col`, so `hidden md:flex` works)
    - Main: add `pb-14 md:pb-0` to leave room for BottomNav on mobile
    - Render `<BottomNav />` after `</main>` (outside the grid, fixed positioned so it doesn't matter)

    **1c. Update Sidebar.jsx:**
    - Add `hidden md:flex` to the `<aside>` element's className (before the existing `bg-white flex flex-col...`). This becomes `hidden md:flex bg-white flex-col overflow-hidden border-r border-border`

    **1d. Update WorkshopPanel.jsx — bottom sheet on mobile:**
    - The slide panel div currently: `fixed right-0 top-0 h-screen w-[400px] ... translate-x-0/translate-x-full`
    - On mobile, it should slide up from bottom instead. Change classes to:
      - Mobile: `fixed inset-x-0 bottom-0 w-full max-h-[85vh] rounded-t-2xl` with `translate-y-0` (open) / `translate-y-full` (closed)
      - Desktop: `md:top-0 md:right-0 md:bottom-auto md:left-auto md:w-[400px] md:h-screen md:max-h-none md:rounded-none` with `md:translate-x-0` (open) / `md:translate-x-full` (closed)
    - Approach: Split transform classes. On mobile use translate-y, on desktop use translate-x:
      - Base: `fixed z-30 bg-white shadow-2xl flex flex-col transition-transform duration-200`
      - Mobile positioning: `inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl`
      - Desktop positioning: `md:inset-auto md:right-0 md:top-0 md:h-screen md:w-[400px] md:max-h-none md:rounded-none`
      - Open state: `translate-y-0 md:translate-y-0 md:translate-x-0` (but need to handle the closed separately)
      - Closed state: `translate-y-full md:translate-y-0 md:translate-x-full`
      - So: `${isOpen ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-y-0 md:translate-x-full'}`
    - Add a drag handle bar at top (mobile only): `<div className="md:hidden flex justify-center pt-2 pb-1"><div className="w-10 h-1 rounded-full bg-slate-300" /></div>` as first child of panel div
    - Keep the easing classes as-is (ease-panel-open / ease-panel-close)

    **1e. Update CoachRoster.jsx inline panel — same bottom sheet treatment:**
    - The roster's inline slide panel (lines ~210-246) uses the same `fixed right-0 top-0 h-screen w-[400px]` pattern
    - Apply the exact same responsive class changes as WorkshopPanel:
      - Base: `fixed z-30 bg-white shadow-2xl flex flex-col transition-transform duration-200 ease-in-out`
      - Mobile: `inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl`
      - Desktop: `md:inset-auto md:right-0 md:top-0 md:h-screen md:w-[400px] md:max-h-none md:rounded-none`
      - Transform: `${isPanelOpen ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-y-0 md:translate-x-full'}`
    - Add the same drag handle div as first child (md:hidden)

    **1f. Add bottom-sheet slide animation to index.css** (inside @theme):
    - Add `--ease-sheet-up: cubic-bezier(0.32, 0.72, 0, 1);` (reuse panel-open curve, or just rely on existing ease-panel-open)
    - No new keyframes needed — translate transitions handle it
  </action>
  <verify>
    Run `npm run build` (or `npx vite build`) — no errors. Open in browser, resize to <768px: sidebar hidden, bottom nav visible with 3 icons, clicking nav items navigates correctly. Open a workshop — panel slides up from bottom as a sheet. Resize to >=768px: sidebar visible, bottom nav hidden, panel slides from right.
  </verify>
  <done>
    Mobile: sidebar hidden, bottom nav with Calendar/Roster/Drafts icons, panels are bottom sheets (full width, max 85vh, rounded top, drag handle). Desktop: identical to current behavior.
  </done>
</task>

<task type="auto">
  <name>Task 2: Responsive calendar toolbar, auto-switch week-to-day, mobile month dots</name>
  <files>
    src/pages/ScheduleCalendar.jsx
    src/components/filters/FilterBar.jsx
    src/components/calendar/MonthView.jsx
  </files>
  <action>
    **2a. ScheduleCalendar.jsx toolbar — collapse on mobile:**
    The toolbar is currently a single `flex items-center gap-3` row (line 204). On mobile it needs to wrap/stack.

    - Change the toolbar container to: `flex flex-wrap items-center gap-2 md:gap-3 py-3 px-4 flex-shrink-0`
    - First row (Today + arrows + date): Wrap them in a div `flex items-center gap-2 md:gap-3`. The date `<span>` should add `text-sm md:text-lg` to keep it smaller on mobile. This group takes full width on mobile: add `w-full md:w-auto`
    - Second row (filters + view tabs + create): The `ml-auto` div already pins right on desktop. On mobile, make it full width: `flex items-center gap-2 md:gap-3 w-full md:w-auto md:ml-auto mt-1 md:mt-0`
    - FilterBar: On mobile, hide the individual dropdowns and show a single "Filters" button instead. On desktop, show dropdowns as-is. Handle in FilterBar.jsx (see 2b).
    - View tabs: keep them but use smaller text on mobile: the buttons get `px-3 md:px-5 py-1 md:py-1.5 text-xs md:text-sm`
    - Create button: hide "Create" text on mobile, show just the Plus icon. Use `<span className="hidden md:inline">Create</span>` for the label. Button: `px-2 md:px-3 py-1.5`

    **2b. Auto-switch week view to day view on mobile:**
    - Add a `useEffect` + `matchMedia` hook in ScheduleCalendar:
      ```
      useEffect(() => {
        const mql = window.matchMedia('(max-width: 767px)');
        function handleChange(e) {
          if (e.matches && viewMode === 'week') setViewMode('day');
        }
        handleChange(mql); // check on mount
        mql.addEventListener('change', handleChange);
        return () => mql.removeEventListener('change', handleChange);
      }, [viewMode]);
      ```
    - Also hide the "Week" tab on mobile: in the VIEW_TABS map, add `className="hidden md:block"` to the Week button specifically, or filter it conditionally. Simpler: add `${value === 'week' ? 'hidden md:block' : ''}` to the button's className.

    **2c. FilterBar.jsx — single filter button on mobile:**
    - Add state `const [mobileOpen, setMobileOpen] = useState(false)` and a ref for outside-click
    - The component's root div: wrap the existing 4 FilterDropdowns in a `<div className="hidden md:flex items-center gap-1.5">...</div>`
    - Add a mobile-only button: `<button className="md:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border ..." onClick={() => setMobileOpen(!mobileOpen)}>` with a Filter icon (import `SlidersHorizontal` from lucide-react) and active count badge
    - When mobileOpen: render a dropdown/popover below the button (absolute positioned, z-40, bg-white rounded-lg shadow-lg border, p-3) containing all 4 filter sections stacked vertically. Each section: label + checkboxes list. Reuse the existing filter data (coachItems, typeItems, etc.) and toggleFilter function.
    - Actually simpler approach: On mobile, render a single button that toggles a full-width dropdown panel below the toolbar. Inside that panel, stack all 4 FilterDropdown components vertically in a `flex flex-col gap-2` layout. Each FilterDropdown can be rendered as-is but in an open-by-default list rather than a dropdown.
    - **Simplest approach:** Keep FilterBar's current implementation but wrap the 4 dropdowns in `hidden md:flex items-center gap-1.5`. Add a mobile toggle button (`md:hidden`) that shows/hides a `flex flex-col gap-2` version of the same dropdowns. The mobile version opens all dropdowns as inline lists.
    - Implementation:
      - Outer wrapper: `<div className="contents">` or just fragment
      - Desktop: `<div className="hidden md:flex items-center gap-1.5">{...4 FilterDropdowns}</div>`
      - Mobile button: `<button className="md:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border border-slate-200 text-slate-600 hover:border-slate-300" onClick={() => setMobileOpen(v => !v)}><SlidersHorizontal size={14} /> Filters {totalActive > 0 && <badge>}</button>`
      - Mobile panel (when mobileOpen): `<div className="md:hidden absolute left-0 right-0 top-full mt-1 bg-white border border-border rounded-xl shadow-lg p-3 z-40 flex flex-col gap-3">` containing the 4 filter sections as checkbox lists (not dropdowns). Each section: `<div><p className="text-xs font-semibold text-slate-500 uppercase mb-1">{title}</p>{items.map(item => <label>...)}</div>`
      - Wrap FilterBar's root in `relative` for the absolute positioning

    **2d. MonthView.jsx — dots on mobile instead of pills:**
    - The workshop pills section (lines 133-157) should switch to dots on mobile
    - Type-to-dot-color mapping: derive from TYPE_PILL_STYLES. Create a `TYPE_DOT_COLORS` map: `{ 'Weekly Connection': 'bg-sky-500', 'All In': 'bg-fuchsia-500', 'Special Event': 'bg-pink-500', 'Coaching Corner': 'bg-slate-500', 'Movement/Fitness': 'bg-violet-500' }`
    - The pills container `<div className="flex flex-col gap-0.5">` becomes `<div className="flex flex-col gap-0.5 md:gap-0.5">`
    - Inside, for each workshop:
      - Desktop (existing pill): wrap in `<div className="hidden md:block">...existing pill markup...</div>`
      - Mobile (dot): `<span className="md:hidden w-2 h-2 rounded-full shrink-0 {TYPE_DOT_COLORS[ws.type]} {isDimmed ? 'opacity-25' : ''}" />`
    - But rendering both (hidden + shown) is wasteful. Better: use responsive classes on a single element.
    - **Better approach:** Change the pill container to flex-row on mobile (dots side by side) and flex-col on desktop (pills stacked):
      - Container: `flex flex-row flex-wrap gap-1 md:flex-col md:gap-0.5`
      - Each workshop: render BOTH a dot (md:hidden) and a pill (hidden md:block) — but that doubles DOM.
    - **Cleanest approach:** Keep pills as-is but add responsive size classes:
      - Mobile: make the pill into a dot by adding `w-2 h-2 md:w-auto md:h-5 rounded-full md:rounded px-0 md:px-1 overflow-hidden` and hide the text span on mobile: `<span className="hidden md:inline truncate ...">`.
      - So each pill becomes a dot (fixed 8x8, rounded-full, no text) on mobile and a normal pill on desktop.
      - The border-l on mobile looks weird for a dot. Override: `border-l-0 md:border-l-2`
    - Container: change to `flex flex-row flex-wrap gap-1 md:flex-col md:gap-0.5` so dots flow horizontally on mobile
    - Remove MAX_VISIBLE_PILLS limit on mobile dots — show up to 5 dots. Add a `MAX_VISIBLE_DOTS = 5` constant. Use responsive logic: on mobile show up to 5 dots, on desktop show up to 3 pills. Since we can't query breakpoints in JS easily, just increase to 5 and let the compact dots handle it (5 tiny dots fit fine; 3 pills was the desktop limit for space). Actually keep MAX_VISIBLE_PILLS = 3 for desktop pills. Show all items up to 5 but hide 4th and 5th pill text on desktop via the overflow count. Simpler: just keep it at 3. The dots are small enough that 3 dots + "+N more" works fine on mobile too.
    - Overflow "+N more" text: `text-[10px] md:text-[10px]` — fine as-is, but hide on mobile since dots are self-explanatory. Add `hidden md:block` to the overflow button.
    - Cell min-height: `min-h-[80px] md:min-h-[120px]` — more compact on mobile
  </action>
  <verify>
    Run `npm run build` — no errors. Open calendar on mobile viewport: toolbar wraps to 2 rows, "Week" tab hidden, filters behind single button, month view shows colored dots. Resize to desktop: everything unchanged from before.
  </verify>
  <done>
    Mobile toolbar stacks nav+date and controls on two rows. Week view auto-switches to day on mobile. FilterBar shows a single "Filters" button with expandable panel on mobile. MonthView shows colored dots instead of text pills on mobile. Desktop unchanged.
  </done>
</task>

<task type="auto">
  <name>Task 3: Responsive tables — card layout for CoachRoster and DraftManager</name>
  <files>
    src/pages/CoachRoster.jsx
    src/pages/DraftManager.jsx
  </files>
  <action>
    **3a. CoachRoster.jsx — card layout on mobile:**
    The table (lines 144-199) should become cards on mobile while keeping the table on desktop.

    - Wrap the existing `<table>` in `<div className="hidden md:block">...</div>`
    - Below it (still inside the rounded-2xl border container), add a mobile card list: `<div className="md:hidden divide-y divide-border">`
    - Each card: map over `visibleCoaches` and render:
      ```jsx
      <div key={coach.id} onClick={() => openCoach(coach.id)} className="flex items-center justify-between p-4 cursor-pointer active:bg-surface-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-ww-navy">{coach.name}</span>
          <span className="text-xs text-slate-500">{coach.workshopsThisWeek} workshops this week</span>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${COACH_STATUS_BADGE[coach.status]}`}>
          {coach.status.charAt(0).toUpperCase() + coach.status.slice(1)}
        </span>
      </div>
      ```
    - Remove the sort headers on mobile (they're inside the hidden table). Mobile cards are sorted by the same `visibleCoaches` array, so sorting still works via state.
    - The page header (lines 126-140) is fine as-is (flex row with title + Add Coach button). Just ensure the button text stays visible: it's short enough.

    **3b. DraftManager.jsx — card layout on mobile:**
    The table (lines 126-193) should become cards on mobile.

    - Wrap the existing `<table>` in `<div className="hidden md:block">...</div>`
    - Below it (inside the rounded-2xl container), add mobile cards: `<div className="md:hidden divide-y divide-border">`
    - Each card: map over `draftWorkshops` and render:
      ```jsx
      <div key={w.id} className="p-4 flex items-start gap-3">
        <div className="pt-0.5">
          <Checkbox
            checked={effectiveSelectedIds.has(w.id)}
            onChange={() => toggleOne(w.id)}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-ww-navy truncate">{w.title}</span>
            {conflictMap.get(w.id)?.hasConflicts && (
              <AlertTriangle size={14} className="text-ww-coral shrink-0" />
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {coachMap.get(w.coachId)?.name ?? 'Unknown'} &middot; {format(parseISO(w.startTime), 'EEE MMM d, h:mm a')}
          </p>
          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${TYPE_PILL_STYLES[w.type] ?? 'bg-slate-100 text-slate-600'}`}>
            {w.type}
          </span>
        </div>
      </div>
      ```
    - The "select all" checkbox: Add a mobile version above the cards list:
      ```jsx
      <div className="md:hidden flex items-center gap-2 px-4 py-2 border-b border-border bg-slate-50/60">
        <Checkbox checked={allSelected} indeterminate={someSelected} onChange={toggleAll} />
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Select all</span>
      </div>
      ```
    - Page header (lines 88-121): The publish button and add draft button — on mobile, ensure they wrap. Change the header container from `flex items-center justify-between` to `flex flex-wrap items-center justify-between gap-2`. Publish button text: fine as-is (short). Add Draft button: hide text on smallest screens if needed, but "Add Draft" is short enough to keep.
  </action>
  <verify>
    Run `npm run build` — no errors. Open CoachRoster on mobile: see stacked cards with name, workshop count, status badge. Tap a card to open detail panel (bottom sheet from Task 1). Open DraftManager on mobile: see cards with checkbox, title, coach, time, type pill, conflict icon. Select all checkbox works. Desktop: both pages show tables as before.
  </verify>
  <done>
    CoachRoster shows card list on mobile with name, workshops count, and status badge per card. DraftManager shows cards with checkbox, title, coach/time, type pill, conflict indicator. Select-all header visible on mobile. Tables unchanged on desktop.
  </done>
</task>

</tasks>

<verification>
1. `npm run build` passes with zero errors
2. At 375px width (mobile): sidebar hidden, bottom nav visible, panels are bottom sheets, toolbar wraps, month view shows dots, tables are cards
3. At 768px+ (desktop): everything identical to current — sidebar visible, right-slide panels, single-row toolbar, month pills, tables
4. Navigation works on mobile bottom nav (Calendar, Roster, Drafts all route correctly)
5. All interactive features still work: filter dropdowns, panel open/close, checkbox selection, publish flow
</verification>

<success_criteria>
- All 10 files build without errors
- Mobile viewport shows bottom nav, bottom sheet panels, collapsed toolbar, dot month view, card tables
- Desktop viewport is pixel-identical to current behavior
- No broken interactions (filters, panels, navigation, checkboxes)
</success_criteria>

<output>
After completion, create `.planning/quick/1-make-the-app-responsive/1-SUMMARY.md`
</output>
