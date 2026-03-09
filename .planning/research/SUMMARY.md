# Project Research Summary

**Project:** WW Workshop Scheduler — v1.1 Interactive Polish Milestone
**Domain:** React scheduling UI — filters, secondary pages, batch operations, micro-interactions
**Researched:** 2026-03-09
**Confidence:** HIGH

## Executive Summary

The WW Workshop Scheduler v1.1 milestone is an interactive polish pass on a working v1.0 prototype (React 19.2, Vite 8, Tailwind v4, 2,629 LOC shipped). The core architectural question is not "what stack to use" — that is locked — but rather "where does new cross-cutting state live?" Research converges clearly: filter state and toast state belong in `AppContext` from day one, not in page-level components. Every pitfall that could derail this milestone traces back to state placed in the wrong component, causing prop-drilling, stale data, or inconsistent UI across the three pages (ScheduleCalendar, CoachRoster, DraftManager).

Three new libraries justify their weight: `sonner` (explicit React 19 peer dep, 4KB, zero-config toast), `react-hotkeys-hook` (handles modifier keys, focus trapping, and cleanup that rolling a custom listener gets wrong), and `@tanstack/react-table` (headless, Tailwind-compatible, eliminates ~100 lines of sort boilerplate for the Coach Roster page). Everything else — filters, micro-interactions, empty states, batch selection, availability overlay — is achievable with existing dependencies (`useState`, `useMemo`, Tailwind v4 transitions). The instinct to reach for `framer-motion` or a filter library should be resisted; Tailwind v4 handles all required animation.

The principal risk is a Tailwind v4 production build trap: dynamic class interpolation (`` `bg-${color}-500` ``) is invisible to the scanner and silently purges classes. The codebase already has the correct pattern (static lookup objects), but new filter and roster UI will tempt interpolation. Verify every phase with `npm run build && npm run preview`, not just `vite dev`. The secondary risk is keyboard shortcut listener leaks — use a single centralized `useKeyboardShortcuts` hook with a ref pattern, not scattered `useEffect` + `addEventListener` calls.

---

## Key Findings

### Recommended Stack

The existing stack needs only three additions for v1.1. Install with: `npm install sonner react-hotkeys-hook @tanstack/react-table`. All three are headless or use inline styles — none conflicts with Tailwind v4 or Vite 8. No state library, animation library, or form library is needed.

**New libraries:**
- `sonner@2.0.7`: Toast notifications — explicit React 19 peerDep, 4KB, mounts once in `App.jsx` as `<Toaster position="bottom-right" />`
- `react-hotkeys-hook@5.2.4`: Keyboard shortcuts — hook-based API (`useHotkeys`), handles input-field suppression, peerDep `>=16.8`
- `@tanstack/react-table@8.21.3`: Sortable coach roster table — headless, tree-shakable, import only `getCoreRowModel` + `getSortedRowModel`

**What requires no new library:**
- Sidebar filters: `useState` + `useMemo` on 18/48-item arrays is instant
- Highlight/dim: Tailwind `opacity-30 pointer-events-none` conditional class
- Batch select: `useState(new Set())` — 10 lines of vanilla React
- Micro-interactions: Tailwind `transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md`
- Availability overlay: Computed grid slots using existing `GRID_START_HOUR` math

See `.planning/research/STACK.md` for full alternatives analysis.

### Expected Features

This milestone's feature set breaks cleanly into P1 (demo breaks without these), P2 (adds polish and depth), and P3 (nice-to-have).

**Must have — P1 (table stakes for demo):**
- Sidebar filters: coach, type, status, market — with highlight/dim mode and active filter pills
- Clear all filters with escape hatch
- Toast notification system — every action currently has zero feedback
- Keyboard shortcuts: arrow keys (week nav), T (today), Esc (close panel), N (new workshop)
- Empty states: filter produces zero results AND empty week (two distinct scenarios, different messages)
- Coach Roster page: sortable table + slide-in detail panel (reuses existing panel pattern)
- Draft Manager page: batch checkbox select + publish confirmation modal

**Should have — P2 (differentiators):**
- Availability overlay on calendar grid (semi-transparent coach lanes behind workshop cards)
- Filter highlight/dim spatial mode (matching cards illuminate, non-matching dim to ~25% opacity)
- Micro-interactions: hover lift on cards, panel cubic-bezier easing, conflict status dot pulse
- Filter persistence across week navigation (filter state survives prev/next week)
- Draft Manager conflict count badge + publish-with-conflicts override warning

**Defer — v2+:**
- Drag-and-drop rescheduling (requires full grid layout rewrite)
- Filter presets / saved views (requires persistence layer)
- Mobile responsive sidebar (explicitly out of scope, desktop-only)
- Real approval workflows (requires backend)

See `.planning/research/FEATURES.md` for full feature prioritization matrix and competitor analysis.

### Architecture Approach

The architecture is additive — AppContext gains `filters`/`setFilters` and `toasts`/`addToast`/`removeToast`; two new pages (`CoachRoster`, `DraftManager`) and two new component folders (`components/roster/`, `components/common/`) are added; existing components (`CalendarGrid`, `WorkshopCard`, `Sidebar`) receive targeted prop additions. A new `utils/filterEngine.js` pure utility decouples filter logic from rendering components, making it independently testable and reusable across pages.

**Major components to build or modify:**
1. `AppContext.jsx` (modify) — add filter state + toast API as cross-cutting concerns
2. `filterEngine.js` (new util) — pure `applyFilters()` and `getHighlightState()` functions; no React imports
3. `ToastStack` + `Toast` (new, in `components/common/`) — fixed-position, z-50, fed by context
4. `Sidebar.jsx` (modify) — add filter panel section below nav; consider `<SidebarFilters>` subcomponent
5. `CalendarGrid.jsx` (modify) — reads filters from context, passes `isDimmed` to WorkshopCard, hosts `AvailabilityOverlay`
6. `AvailabilityOverlay.jsx` (new, in `components/calendar/`) — semi-transparent lane blocks per coach per day column
7. `CoachRoster.jsx` + `RosterTable.jsx` + `CoachDetailPanel.jsx` (new, in `pages/` and `components/roster/`)
8. `DraftManager.jsx` (new page) — Set-based batch selection, `ConfirmModal`, wires to `setWorkshops` + `addToast`
9. `EmptyState.jsx` + `ConfirmModal.jsx` (new, in `components/common/`) — reusable cross-cutting UI primitives

**Key patterns:**
- Filter state in AppContext (not Sidebar or ScheduleCalendar) — Sidebar writes, CalendarGrid/CoachRoster read
- Toast via Context API — single `ToastStack` in `App.jsx` above the router; prevents duplicate stacks
- Centralized `useKeyboardShortcuts` hook using ref pattern — handlers stay fresh, listener is stable
- Set-based batch selection in local state — always `new Set(prev)` to preserve React referential equality
- CalendarGrid geometry constants extracted to `utils/calendarGeometry.js` — shared by `AvailabilityOverlay`

See `.planning/research/ARCHITECTURE.md` for data flow diagrams, code examples, and anti-patterns.

### Critical Pitfalls

1. **Filter state in the wrong component** — Adding `filters` to `Sidebar` or `ScheduleCalendar` local state forces deep prop-drilling when CoachRoster and DraftManager need the same active filters. Add to `AppContext` from day one; Sidebar is a writer, CalendarGrid/pages are readers.

2. **Context re-renders degrading CalendarGrid** — Inline context value object (`value={{ ...all state }}`) is recreated every render, causing all context consumers to re-render on every filter tick. Fix: `useMemo` on context value in `App.jsx`; `React.memo` on `WorkshopCard`; `useMemo` on filtered workshop list in each consumer.

3. **Dynamic Tailwind classes silently purged in production** — Template literal class interpolation (`` `bg-${typeColor}-100` ``) passes `vite dev` but is invisible to the Tailwind v4 scanner at build time. The codebase already uses the correct pattern (static lookup objects). Verify every phase with `npm run build && npm run preview`.

4. **Keyboard shortcut listener leaks and conflicts** — Missing `useEffect` cleanup causes listeners to stack on re-render. `Esc` registered globally fires in both panel and confirmation modal simultaneously. Centralize all shortcuts in one `useKeyboardShortcuts` hook with ref pattern; gate on `event.target.tagName` to suppress in form inputs; give modal-level Esc priority over panel-level.

5. **Batch publish operating on stale workshop data** — Copying workshops to `DraftManager` local state on mount snapshots stale data. DraftManager must read workshops exclusively from `useApp()` context and derive `draftWorkshops` with `useMemo`, never via local `useState` copy.

See `.planning/research/PITFALLS.md` for full recovery strategies and per-phase verification checklists.

---

## Implications for Roadmap

Based on combined research, the recommended phase structure maps to the build order suggested in ARCHITECTURE.md, respecting dependency and state-establishment order.

### Phase 1: Context Foundation + Toast System

**Rationale:** Every subsequent phase needs the ability to fire toasts and read from a stable filter-aware context shape. Establish this first to avoid retrofitting. The context extension is additive — zero risk of breaking existing functionality. PITFALLS.md confirms that the most expensive recovery scenario (filter state in wrong component) is prevented here.

**Delivers:** Extended `AppContext` with `filters`/`setFilters` + `toasts`/`addToast`/`removeToast`; `ToastStack` + `Toast` components wired into `App.jsx`; `useMemo` on context value for performance.

**Addresses:** Toast confirmation after actions (P1 table stakes); filter state architecture prerequisite.

**Avoids:** Pitfall 1 (filter state in wrong place), Pitfall 2 (context re-renders), Pitfall 5 (stale batch data — the correct context shape prevents this from the start).

**Research flag:** None — standard React Context pattern, well-documented.

---

### Phase 2: Sidebar Filters + CalendarGrid Highlight/Dim

**Rationale:** Filters are the highest-value P1 feature and the first consumer of the context foundation established in Phase 1. The `filterEngine.js` utility built here is also consumed by CoachRoster and DraftManager — building it now avoids duplicating logic. `WorkshopCard` dim state must be established before micro-interactions, since the `isDimmed` prop changes the card's visual layer.

**Delivers:** `filterEngine.js` pure utility; filter UI in `Sidebar` (4 filter types: coach, type, status, market); filter pills above grid; "Clear all" button; `CalendarGrid` highlight/dim via `isDimmed` prop on `WorkshopCard`; empty state for zero filter results.

**Addresses:** All sidebar filter table stakes (P1); filter highlight/dim differentiator (P2); active filter indicator; clear all; empty state: filter produces no results.

**Avoids:** Pitfall 3 (Tailwind purging) — verify with production build at end of phase; anti-pattern of filter state in Sidebar local state.

**Research flag:** Low — standard React filter pattern. Verify production build before marking complete.

---

### Phase 3: Keyboard Shortcuts

**Rationale:** Isolated from other phases (no dependencies on filters or roster), but should be built before the availability overlay and roster pages so the Esc/N shortcuts are in place when those pages go live. The centralized hook established here also covers DraftManager's modal Esc priority in Phase 5.

**Delivers:** `useKeyboardShortcuts` hook with ref pattern; arrow key week navigation; T for today; Esc to close panel; N to open create modal.

**Addresses:** Keyboard shortcuts table stakes (P1); keyboard: N to create (P2).

**Avoids:** Pitfall 4 (listener leaks, Esc conflicts) — centralized hook established here prevents scattered `useEffect` anti-pattern. Document event target gating for form field suppression.

**Research flag:** Low — well-documented hook pattern. Verify by opening panel and modal simultaneously, confirm Esc priority.

---

### Phase 4: Coach Roster Page

**Rationale:** Second page of the app. Builds on `filterEngine.js` (from Phase 2) to show filtered coach list. `RosterTable` can use `@tanstack/react-table` or the `sortConfig` + `useMemo` pattern — research recommends TanStack Table for forward-compatibility if columns expand. `CoachDetailPanel` reuses the existing slide-in panel pattern from v1.0.

**Delivers:** `CoachRoster.jsx` page; `RosterTable.jsx` with sortable columns (name, workshop count, availability); `CoachDetailPanel.jsx` (slide-in, reuses WorkshopPanel pattern); empty state for filtered-to-zero coaches.

**Uses:** `@tanstack/react-table@8.21.3` for sortable table; `sonner` (via context) for any roster actions; `filterEngine.js` from Phase 2.

**Addresses:** Coach Roster page (P1); sortable roster table; coach detail in roster; roster workshop count column (P3); roster availability status badges (P3).

**Avoids:** Anti-pattern of sorting `coaches` array in context directly — always `[...coaches].sort()` in `useMemo`. Sort config stays in local state (not context) — sort is ephemeral UI state.

**Research flag:** Low — TanStack Table v8 is well-documented. `@tanstack/react-table` headless pattern is standard.

---

### Phase 5: Draft Manager Page

**Rationale:** Third page. Depends on toast system (Phase 1) for publish success feedback. Set-based batch selection pattern is self-contained. `ConfirmModal` component built here is reusable for any future destructive-confirmation scenario.

**Delivers:** `DraftManager.jsx` page; checkbox batch selection with select-all; `ConfirmModal` component; publish confirmation flow; `setWorkshops` mutation to update status; toast on publish; conflict count badge; publish-with-conflicts warning (P2).

**Addresses:** Draft Manager batch select (P1); publish confirmation modal (P1); Draft Manager conflict badge (P2); publish with conflicts warning (P2).

**Avoids:** Pitfall 5 (stale workshop data) — workshops must come from `useApp()` + `useMemo`, never local state copy. Pitfall 4 (Esc priority) — modal Esc must take priority over panel Esc.

**Research flag:** Low — Set-based batch selection is standard. Verify Esc priority with panel open + modal open simultaneously.

---

### Phase 6: Availability Overlay

**Rationale:** Highest-complexity feature (HIGH rating in FEATURES.md) deferred to after all pages are stable. Depends on CalendarGrid modifications from Phase 2 (overlay renders in the same grid). Requires extracting `GRID_START_HOUR` / `PX_PER_HOUR` to a shared utility to avoid duplication between `CalendarGrid` and `AvailabilityOverlay`.

**Delivers:** `utils/calendarGeometry.js` (extracted grid constants); `AvailabilityOverlay.jsx` (semi-transparent coach-colored lane blocks per day column); toggle button in ScheduleCalendar nav bar.

**Addresses:** Availability overlay on calendar grid (P2 differentiator); saturation overlay per coach (P2).

**Avoids:** Anti-pattern of duplicating grid constants across components; overlay z-index must not interfere with click-to-create slot detection (overlay is `pointer-events-none`).

**Research flag:** MEDIUM — the availability data shape in mock data should be verified before building. Grid coordinate math must be validated against actual rendered pixel positions.

---

### Phase 7: Micro-interactions + Empty States Polish

**Rationale:** Polish layer applied last, after all pages are functional. Micro-interactions are purely additive Tailwind class additions — zero risk of breaking state logic. Empty states across all pages can be unified with the reusable `EmptyState` component built here.

**Delivers:** `EmptyState.jsx` reusable component; hover lift on workshop cards (`hover:-translate-y-0.5 hover:shadow-md`); panel cubic-bezier easing; conflict status dot pulse (`@keyframes` scale); filter checkbox animation; empty week state on calendar.

**Addresses:** All P2 micro-interactions; empty state: empty week (P1, deferred to this phase for proper `EmptyState` component); filter persistence across week navigation (P2 — verify filter state survives week navigation).

**Avoids:** Pitfall: hover lift expanding card click target — use `transform: translateY(-1px)` scoped to card, not expanding the clickable area.

**Research flag:** Low — all micro-interactions are Tailwind v4 built-ins. No new libraries needed.

---

### Phase Ordering Rationale

- **Context first:** Phases 2-7 all depend on the toast API and filter state being available in context. Building this foundation in Phase 1 makes every other phase cleaner.
- **filterEngine before pages:** Building the pure filter utility in Phase 2 means CoachRoster (Phase 4) and DraftManager (Phase 5) can reuse it without coupling.
- **Pages before polish:** Phases 4-5 (Roster, DraftManager) must be functionally complete before Phase 7 micro-interactions, because micro-interactions are additive to working components.
- **Availability overlay last among features:** It has the most moving parts (grid geometry, coach data, overlay z-index) and benefits from CalendarGrid modifications being stable before introducing the overlay layer.
- **Micro-interactions always last:** Risk-free additions that should never block functional delivery.

### Research Flags

Phases likely needing deeper investigation during planning:

- **Phase 6 (Availability Overlay):** MEDIUM confidence. The coach availability data shape in `coaches.js` mock data needs verification before building — confirm `availability[].day`, `availability[].start`, `availability[].end` fields match the expected format in the overlay code. Grid coordinate math should be spot-checked against actual rendered pixel positions.

Phases with standard patterns (no additional research needed):

- **Phase 1:** Standard React Context + useCallback patterns. Well-documented.
- **Phase 2:** Standard filter/useMemo pattern. Verify production build only.
- **Phase 3:** Standard keyboard shortcut hook. Well-documented.
- **Phase 4:** TanStack Table v8 docs are comprehensive. Standard slide-in panel reuse.
- **Phase 5:** Standard Set-based selection. Standard ConfirmModal pattern.
- **Phase 7:** Pure Tailwind v4 built-ins. No unknowns.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | npm registry verified versions; React 19 compatibility confirmed for all 3 additions; Tailwind v4 compatibility confirmed (headless/inline-styles libraries) |
| Features | MEDIUM | UX patterns from reputable sources (NNGroup, Eleken, LogRocket); specific competitor behaviors observed but not tested in this codebase |
| Architecture | HIGH | Based on direct codebase inspection of `/Users/adam/ww-workshop-scheduler/src/`; patterns verified against React official docs; all 6 patterns are established idioms |
| Pitfalls | MEDIUM-HIGH | Critical pitfalls verified against React official behavior and authoritative sources (Nadia Makarevich, Dmitri Pavlutin); Tailwind v4 purging confirmed via official GitHub discussion |

**Overall confidence:** HIGH

### Gaps to Address

- **Coach availability data shape:** Phase 6 depends on `availability[].day/start/end` fields being present in `coaches.js`. Inspect mock data before writing `AvailabilityOverlay` — if shape differs, overlay code in ARCHITECTURE.md needs adjustment.
- **react-hotkeys-hook React 19 explicit compatibility:** peerDep is `>=16.8` (not explicit React 19 declaration). MEDIUM confidence. If issues arise, fall back to the custom `useKeyboardShortcuts` hook pattern documented in ARCHITECTURE.md — it handles all the same edge cases without the library.
- **Workshop status field in mock data:** FEATURES.md flags that `workshops.js` must include `status: "draft" | "published"` for DraftManager to function. Verify before starting Phase 5 — if missing, add to mock data first.

---

## Sources

### Primary (HIGH confidence)
- npm registry (`npm info`) — sonner@2.0.7, react-hotkeys-hook@5.2.4, @tanstack/react-table@8.21.3 peer deps and versions
- Direct codebase inspection: `/Users/adam/ww-workshop-scheduler/src/` — confirmed existing patterns, component structure, AppContext shape
- [TanStack Table v8 Docs](https://tanstack.com/table/v8/docs) — headless architecture, sort guide
- [Sonner GitHub](https://github.com/emilkowalski/sonner) — React 19 peer dep, API
- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs/transition-property) — built-in transition utilities, `@starting-style`
- [tailwindlabs/tailwindcss GitHub discussion #15291](https://github.com/tailwindlabs/tailwindcss/discussions/15291) — safelist removal in v4, correct alternative
- [React re-renders guide](https://www.developerway.com/posts/react-re-renders-guide) (Nadia Makarevich) — context re-render behavior
- [Stale closures in React Hooks](https://dmitripavlutin.com/react-hooks-stale-closures/) (Dmitri Pavlutin) — stale closure pitfall

### Secondary (MEDIUM confidence)
- [NNGroup: Empty States in Complex Applications](https://www.nngroup.com/articles/empty-state-interface-design/) — contextual CTA patterns
- [LogRocket: React Toast Comparison 2025](https://blog.logrocket.com/react-toast-libraries-compared-2025/) — sonner vs alternatives
- [Eleken: Filter UX & UI for SaaS](https://www.eleken.co/blog-posts/filter-ux-and-ui-for-saas) — chip/pill patterns, sidebar filter implementations
- [Eleken: Bulk Actions UX](https://www.eleken.co/blog-posts/bulk-actions-ux) — batch action confirmation patterns
- [Tania Rascia: Keyboard Shortcut Hook React](https://www.taniarascia.com/keyboard-shortcut-hook-react/) — hook pattern, ref stability
- [React Toast via Context](https://dev.to/kevjose/building-a-reusable-notification-system-with-react-hooks-and-context-api-2phj) — toast context pattern
- [Eleken: Calendar UI](https://www.eleken.co/blog-posts/calendar-ui) — availability overlay patterns, grid shading reference

### Tertiary (LOW confidence)
- [Bricxlabs: Micro-Interactions 2025](https://bricxlabs.com/blogs/micro-interactions-2025-examples) — general trend reference; specific patterns validated independently via Tailwind docs

---

*Research completed: 2026-03-09*
*Ready for roadmap: yes*
