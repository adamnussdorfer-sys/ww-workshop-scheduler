# Pitfalls Research

**Domain:** Scheduling/calendar UI — adding filters, secondary pages, batch operations, micro-interactions to existing React prototype
**Researched:** 2026-03-09
**Confidence:** MEDIUM-HIGH (stack-specific findings verified against official docs and multiple sources; UX patterns drawn from community evidence)

---

## Critical Pitfalls

### Pitfall 1: Filter State Lives in the Wrong Component

**What goes wrong:**
Sidebar filter state (selected coach, type, status, market) is added directly to `ScheduleCalendar` or `Sidebar` rather than being hoisted to `AppContext`. Because `CalendarGrid`, `WorkshopPanel`, and future pages (`CoachRoster`, `DraftManager`) all need to respond to the same active filters, the state ends up being prop-drilled through 3+ component layers, or duplicated across pages, producing stale/inconsistent filter behavior.

**Why it happens:**
Filters feel like "calendar page" state when first built, so the developer places them in `ScheduleCalendar`. It's only when `CoachRoster` needs the same active coach filter (to highlight the same coach) that the pain shows.

**How to avoid:**
Add filter state directly to `AppContext` from day one of the sidebar phase. The existing `AppContext.Provider` in `App.jsx` already holds `workshops` and `coaches`; add `filters` and `setFilters` alongside them. Components compute their own filtered/highlighted views from this single source.

```jsx
// In App.jsx — add to existing context
const [filters, setFilters] = useState({
  coaches: [],       // string[] of coach IDs
  types: [],         // string[] of workshop types
  statuses: [],      // string[] of statuses
  markets: [],       // string[] of markets
});

<AppContext.Provider value={{ coaches, setCoaches, workshops, setWorkshops, filters, setFilters }}>
```

**Warning signs:**
- `ScheduleCalendar` is receiving `filters` or `activeCoach` as props from `AppShell`
- `CoachRoster` page doesn't react when sidebar filters change
- You find yourself passing filter state through `AppShell` → `Sidebar` → back up via callbacks

**Phase to address:** Sidebar filters phase (first feature phase of v1.1)

---

### Pitfall 2: React Context Re-renders the Entire Calendar on Every Filter Change

**What goes wrong:**
When filter state is added to `AppContext`, every context consumer re-renders on every filter change — including `CalendarGrid` (which renders 48 workshop cards) and `WorkshopPanel`. Without memoization, toggling a single coach filter causes the entire calendar to re-render, producing visible lag at 60fps.

**Why it happens:**
Any `AppContext.Provider` value change triggers re-renders in all components that call `useApp()`. The context value object is recreated on every render because it's defined inline: `value={{ coaches, setCoaches, workshops, setWorkshops, filters, setFilters }}`.

**How to avoid:**
1. Memoize the context value with `useMemo` in `App.jsx`:
```jsx
const contextValue = useMemo(
  () => ({ coaches, setCoaches, workshops, setWorkshops, filters, setFilters }),
  [coaches, workshops, filters]
);
<AppContext.Provider value={contextValue}>
```
2. Wrap `CalendarGrid` in `React.memo` so it only re-renders when its specific props (not unrelated context slices) change.
3. Memoize the filtered workshop lists in each page that consumes them via `useMemo`.

**Warning signs:**
- React DevTools Profiler shows `CalendarGrid` re-rendering on sidebar checkbox clicks
- Checkbox toggle feels sluggish compared to the rest of the UI
- `WorkshopPanel` flickers when filter state changes while panel is open

**Phase to address:** Sidebar filters phase — prevention built in at implementation time

---

### Pitfall 3: Dynamic Tailwind Classes Silently Disappear in Production

**What goes wrong:**
New filter UI components use dynamic class construction (e.g., `bg-${typeColor}-500`, or `text-${severity}`) to apply per-type or per-status colors. These classes are never seen by Tailwind's scanner at build time and are purged from the production stylesheet, producing elements with no background color or wrong text color — visible only after `npm run build`, not during `vite dev`.

**Why it happens:**
Tailwind v4's scanner uses static analysis to detect class names. String interpolation (template literals) defeats the scanner. The existing codebase already solved this with lookup objects (`TYPE_CARD_STYLES`, `STATUS_DOT_COLORS`, `CONFLICT_RING`), but new developers adding filters often reach for interpolation first.

**How to avoid:**
Continue the existing pattern exclusively: static lookup objects that map data values to complete Tailwind class strings.

```js
// Good — scanner sees complete class names
const FILTER_CHIP_COLORS = {
  'Weight Loss': 'bg-blue-100 text-blue-700 border-blue-200',
  'Maintenance':  'bg-green-100 text-green-700 border-green-200',
  'Wellness':     'bg-purple-100 text-purple-700 border-purple-200',
};

// Bad — scanner cannot see these
const cls = `bg-${typeColor}-100 text-${typeColor}-700`;
```

Note: Tailwind v4 removed the `safelist` config option. The v4 equivalent is `@source inline(...)` in CSS, but lookup tables remain the simpler and preferred solution.

**Warning signs:**
- Filter chips render with no color in `npm run build` preview but look fine in `vite dev`
- You grep the codebase and find `` `bg-${` `` or `` `text-${` `` patterns in new filter components
- A new type is added to the data and its chip is colorless

**Phase to address:** Sidebar filters phase — verify with production build before marking phase complete

---

### Pitfall 4: Keyboard Shortcut Event Listeners Leak or Conflict with Panel/Modal

**What goes wrong:**
Keyboard shortcuts (arrow keys for week navigation, `T` for Today, `N` for New, `Esc` to close) registered via `useEffect` + `addEventListener` on `window` or `document` accumulate duplicate listeners if the dependency array is wrong, or they fire at the wrong time — e.g., `Esc` closes both the panel and a confirmation modal simultaneously, or `N` triggers when the user is typing in a form field inside `WorkshopForm`.

**Why it happens:**
Three failure modes:
1. Missing cleanup function in `useEffect` → listeners stack on re-render
2. All shortcuts registered globally without context checking → fire inside form inputs
3. No priority/scope system → `Esc` registered in both `WorkshopPanel` and a future confirmation modal both fire at once

**How to avoid:**
- Always pair `addEventListener` with `removeEventListener` in the `useEffect` cleanup:
```js
useEffect(() => {
  const handler = (e) => { ... };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, []); // stable dependency array
```
- Gate on `event.target.tagName` to suppress shortcuts inside inputs:
```js
if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
```
- Give panel `Esc` higher priority: register it on the panel component (which mounts/unmounts logically based on open state) rather than globally. The panel's `Esc` handler runs while the panel is open; the global `Esc` does not need to fire.
- Register all global shortcuts in a single `useKeyboardShortcuts` custom hook rather than scattered across multiple components.

**Warning signs:**
- Week navigation fires 2x per keypress after navigating between pages
- `Esc` simultaneously closes panel and triggers another action
- Typing in `WorkshopForm` search/title fields triggers navigation

**Phase to address:** Keyboard shortcuts phase

---

### Pitfall 5: Batch Publish Operates on Stale Workshop List

**What goes wrong:**
Draft Manager batch operations (select all, publish selected) capture the workshop list at the moment the selection UI renders. If the user edits a workshop via the panel on the Schedule Calendar page and then switches to Draft Manager, the batch operation sees the pre-edit workshop data because it reads from a stale snapshot rather than the live `AppContext` state.

**Why it happens:**
`DraftManager` captures workshops in local state (`useState`) on mount or with a missing `useMemo` dependency, rather than always reading directly from `AppContext`. React's stale closure trap: the callback used in the publish action closes over the workshop list from its definition time.

**How to avoid:**
`DraftManager` must read workshops exclusively from `useApp()` context, not from local state, and must not copy it into local state. The "selected drafts" UI state (which checkboxes are checked) is local state; the workshop data it operates on is always from context.

```jsx
// Good
const { workshops, setWorkshops } = useApp();
const drafts = useMemo(
  () => workshops.filter(w => w.status === 'Draft'),
  [workshops]
);

// Bad — snapshot on mount, goes stale
const [drafts, setDrafts] = useState(workshops.filter(w => w.status === 'Draft'));
```

**Warning signs:**
- Editing a workshop on the calendar and then publishing from Draft Manager publishes the old version
- `console.log` inside the publish handler shows workshop data that doesn't match what the UI shows

**Phase to address:** Draft Manager phase

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Inline filter logic in `ScheduleCalendar` | Fast to ship | CoachRoster/DraftManager can't share same filter; requires refactor | Never — put in context from start |
| Separate `useEffect` per keyboard shortcut | Simple per-component | Listeners multiply, conflicts harder to debug | Never — use one centralized hook |
| Copying workshops to local state in DraftManager | Avoids threading context | Stale data on publish; source of truth split | Never for batch-write operations |
| Dynamic Tailwind class interpolation | Concise code | Classes purged from production build silently | Never — use lookup objects |
| Toast notifications without duplicate guard | Fast to implement | Rapid actions (e.g., clicking Publish 3x) stack 3 identical toasts | Never — always gate with ID or debounce |
| Sorting a 48-item list on every render without `useMemo` | Simpler code | Imperceptible at 48 items, but sets bad pattern | OK during early build, should memoize before v1.1 ships |

---

## Integration Gotchas

Common mistakes when connecting new features to existing systems in this codebase.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Sidebar filters → CalendarGrid | Passing filters as props through AppShell to ScheduleCalendar | Read filters directly from `useApp()` inside CalendarGrid |
| Filters → WorkshopPanel | Forgetting panel also needs filter context (e.g., coach filter should highlight panel's coach field) | Panel reads from context, not props |
| Keyboard shortcuts → WorkshopPanel | Registering `Esc` globally, not inside panel mount lifecycle | Register panel-specific shortcuts in panel component's `useEffect` |
| Conflict engine → filtered workshops | Running `buildConflictMap` on unfiltered workshops but displaying filtered cards only | Always run conflict engine on full workshop list, apply display filter separately |
| Coach roster sort → coach data | Sorting the `coaches` array in context directly | Always sort a derived copy: `[...coaches].sort(...)` inside `useMemo` — never mutate context state |

---

## Performance Traps

Patterns that work at 48 workshops but degrade with added UI complexity.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Non-memoized filter computation in CalendarGrid | Grid re-renders on every parent state change | `useMemo(() => workshops.filter(...), [workshops, filters])` | Immediately visible if filters change often; currently hidden because no filters exist |
| Context value object recreated inline on every App render | All context consumers re-render even when their slice didn't change | `useMemo` on context value in App.jsx | Becomes noticeable when filter state changes frequently |
| `buildConflictMap` called without `useMemo` dependencies including filters | Conflict map rebuilt on every render | Ensure `useMemo` deps are `[workshops, coaches]` — not filters, since conflicts run on all workshops | Subtle: doesn't break, just wastes CPU |
| Workshop cards re-render on filter change even when they're not filtered | Janky filter toggle | `React.memo` on `WorkshopCard` | Visible at 48 cards, worse at 100+ |

---

## UX Pitfalls

Common user experience mistakes for this specific feature set.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Filters applied without visual feedback — grid just changes | Disorienting; user doesn't know what changed | Animate filter chip activation; dim/highlight transition should be CSS `transition-opacity` not instant |
| Empty state after filtering shows blank calendar grid | User thinks app broke | Show explicit "No workshops match your filters" with a "Clear filters" action button |
| Batch select all on Draft Manager selects across multiple weeks | User publishes workshops for wrong weeks | Scope "select all" to the visible week or add date-range scope indicator |
| `Esc` closes panel but not modal | Modal blocks calendar, user confused | `Esc` chain: modal first if open, panel second, nothing if both closed |
| Toast appears behind the slide-in panel | User misses publish confirmation | Toast `z-index` must be above panel overlay (panel is `translate-x` based, toast needs explicit `z-50` or higher) |
| Hover lift on workshop cards triggers accidental click-to-create on slot | Fat-finger creates unwanted workshop | Card hover lift should use `transform: translateY(-1px)` scoped to card, not expanding clickable area |
| Sort column in Coach Roster resets when navigating away and back | Users lose context | Store sort state in context or URL param, not local state |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Sidebar filters:** Filter chips are styled and clickable — verify that CalendarGrid actually dims non-matching workshops (opacity change) and that the conflict engine still runs on ALL workshops, not just visible ones
- [ ] **Coach availability overlay:** Overlay renders in grid — verify it doesn't interfere with click-to-create slot detection (overlapping z-index)
- [ ] **Keyboard shortcuts:** Shortcuts fire on keypresses — verify they are suppressed inside `WorkshopForm` input fields and that `Esc` priority order is correct (modal > panel > nothing)
- [ ] **Toast notifications:** Toast appears on publish — verify it doesn't stack on rapid clicks (duplicate guard in place)
- [ ] **Draft Manager batch publish:** UI reflects published status — verify workshops in `AppContext` are actually mutated (status changed to 'Published'), not just the local selection state cleared
- [ ] **Empty states:** Empty state renders — verify it shows when filters produce zero results AND when the week genuinely has no workshops (two distinct scenarios with different messages)
- [ ] **Coach Roster sort:** Column sort works — verify `[...coaches].sort()` is used (copy first), not `coaches.sort()` (mutates context state directly)

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Filter state in wrong component | MEDIUM | Move state to AppContext, remove props from intermediate components, update all consumers to use `useApp()` — typically 2-3 hours |
| Keyboard shortcut listeners leaking | LOW | Add missing `return () => removeEventListener(...)` cleanup to each `useEffect`; verify in React DevTools that listener count doesn't grow on re-renders |
| Dynamic Tailwind classes purged | LOW | Replace interpolated strings with lookup objects; add `npm run build` check to phase verification |
| Stale workshop data in batch publish | LOW | Remove local workshop state copy; read directly from `useApp()` context |
| Toast stacking | LOW | Add `toastId` parameter to `toast()` call to deduplicate, or add debounce to publish handler |
| Context re-render performance | MEDIUM | Add `useMemo` to context value, `React.memo` to CalendarGrid; profile with React DevTools before and after |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Filter state in wrong component | Sidebar filters phase — establish AppContext shape first | Navigate to CoachRoster while filter is active; verify roster reflects same filter |
| Context re-renders on filter change | Sidebar filters phase — add `useMemo` on context value during implementation | React DevTools Profiler: CalendarGrid should not re-render when unrelated context slice changes |
| Dynamic Tailwind class purging | Any phase adding new colored UI elements | Run `npm run build && npm run preview` and visually inspect — not just `vite dev` |
| Keyboard shortcut listener leaks | Keyboard shortcuts phase — centralize in one hook | Open/close panel 20 times; check DevTools → Elements → Event Listeners on `window`: count should not grow |
| Batch publish stale data | Draft Manager phase — never copy workshops to local state | Edit a workshop, navigate to Draft Manager, publish; verify edit is reflected in published data |
| `Esc` priority conflicts | Keyboard shortcuts phase AND Draft Manager phase (confirmation modal) | Open confirmation modal while panel is also open; `Esc` should close modal only |
| Empty state missing after filter | Sidebar filters phase — treat empty-filtered as a distinct branch | Apply filter with no matching workshops; verify explicit message appears, not blank grid |
| Hover lift affecting click target | Micro-interactions phase | Click precisely at card border; verify no slot-create dialog fires |

---

## Sources

- [Avoid Prop Drilling Chaos: How React Hooks & Context Boundaries Simplify State Management in 2025](https://medium.com/@ahamisi777/avoid-prop-drilling-chaos-how-react-hooks-context-boundaries-simplify-state-management-in-2025-ff79c51845d2) — LOW-MEDIUM confidence (WebSearch, not independently verified)
- [Optimizing React Context for Performance: Avoiding Common Re-rendering Pitfalls](https://www.tenxdeveloper.com/blog/optimizing-react-context-performance) — MEDIUM confidence (consistent with React official docs behavior)
- [React re-renders guide: everything, all at once](https://www.developerway.com/posts/react-re-renders-guide) — HIGH confidence (Nadia Makarevich, widely referenced authoritative source)
- [Mastering Safelisting in Tailwind CSS v4: The Shift to CSS and Smart Alternatives](https://iifx.dev/en/articles/456461527/mastering-safelisting-in-tailwind-css-v4-the-shift-to-css-and-patterns-and-alternatives) — MEDIUM confidence (WebSearch; consistent with Tailwind v4 migration docs)
- [Safelist in V4 — GitHub Discussion, tailwindlabs/tailwindcss](https://github.com/tailwindlabs/tailwindcss/discussions/15291) — HIGH confidence (official Tailwind repo)
- [Creating a Keyboard Shortcut Hook in React (Deep Dive)](https://www.taniarascia.com/keyboard-shortcut-hook-react/) — MEDIUM confidence (reputable author, consistent with React docs)
- [How to Use useEffect to Remove Event Listeners in React](https://www.dhiwise.com/post/how-to-use-useeffect-to-remove-event-listeners-in-react) — MEDIUM confidence (multiple sources agree)
- [React-Toastify: Limit the number of toast displayed](https://fkhadra.github.io/react-toastify/limit-the-number-of-toast-displayed/) — HIGH confidence (official library docs)
- [UI best practices for loading, error, and empty states in React](https://blog.logrocket.com/ui-design-best-practices-loading-error-empty-state-react/) — MEDIUM confidence (LogRocket, well-regarded source)
- [Be Aware of Stale Closures when Using React Hooks](https://dmitripavlutin.com/react-hooks-stale-closures/) — HIGH confidence (Dmitri Pavlutin, widely cited, consistent with React behavior)
- Codebase analysis: `/Users/adam/ww-workshop-scheduler/src/` — HIGH confidence (direct inspection of actual project files)

---
*Pitfalls research for: WW Workshop Scheduler v1.1 Interactive Polish milestone*
*Researched: 2026-03-09*
