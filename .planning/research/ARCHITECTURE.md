# Architecture Research

**Domain:** React scheduling UI — v1.1 interactive polish milestone
**Researched:** 2026-03-09
**Confidence:** HIGH (based on direct codebase inspection + verified React patterns)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         App.jsx                                      │
│  AppContext.Provider { coaches, setCoaches, workshops, setWorkshops  │
│                        toasts, addToast, removeToast [NEW]           │
│                        filters, setFilters [NEW] }                   │
├──────────────────┬──────────────────────────────────────────────────┤
│   AppShell       │           Pages (routed)                         │
│  ┌────────────┐  │  ┌────────────────┐  ┌────────┐  ┌──────────┐   │
│  │  Sidebar   │  │  │ScheduleCalendar│  │ Coach  │  │  Draft   │   │
│  │ (nav +     │  │  │ (week nav,     │  │ Roster │  │ Manager  │   │
│  │  filters   │  │  │  CalendarGrid, │  │ (table │  │ (batch   │   │
│  │  [NEW])    │  │  │  panel state,  │  │  sort, │  │  ops,    │   │
│  └────────────┘  │  │  overlay[NEW]) │  │  panel)│  │  modal)  │   │
│  ┌────────────┐  │  └────────────────┘  └────────┘  └──────────┘   │
│  │  TopBar    │  │                                                   │
│  └────────────┘  │  ┌──────────────────────────────────────────┐   │
│                  │  │         ToastStack [NEW]                  │   │
│                  │  │   (fixed position, outside page routing)  │   │
│                  │  └──────────────────────────────────────────┘   │
└──────────────────┴──────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        utils/            data/          components/
    conflictEngine     coaches.js       calendar/
    coachAvailability  workshops.js     panel/
    filterEngine[NEW]                  roster/[NEW]
                                       common/[NEW]
```

### Component Responsibilities

| Component | Responsibility | Status |
|-----------|----------------|--------|
| `App.jsx` | Global state owner: coaches, workshops, toasts, filters | Modify |
| `AppContext.jsx` | Context shape — add toast API + filter state | Modify |
| `AppShell.jsx` | Layout shell — unchanged | Unchanged |
| `Sidebar.jsx` | Nav + filter panel (coach, type, status, market) | Modify |
| `ScheduleCalendar.jsx` | Week nav, panel state, keyboard shortcuts | Modify |
| `CalendarGrid.jsx` | Renders filtered workshops, availability overlay layer | Modify |
| `WorkshopCard.jsx` | Dimmed state when filtered out | Modify |
| `WorkshopPanel.jsx` | Escape key + close unchanged | Unchanged |
| `CoachRoster.jsx` | Sortable table + coach detail panel | New implementation |
| `DraftManager.jsx` | Batch select + publish confirmation modal | New implementation |
| `ToastStack` | Fixed-position toast container, auto-dismiss | New component |
| `EmptyState` | Reusable: icon + headline + CTA, contextual | New component |
| `ConfirmModal` | Blocking confirmation dialog for destructive ops | New component |
| `AvailabilityOverlay` | Semi-transparent lane overlays inside CalendarGrid | New component |
| `RosterTable` | Sortable table body for CoachRoster | New component |
| `filterEngine.js` | Pure filter/highlight logic for workshop arrays | New util |

## Recommended Project Structure

```
src/
├── components/
│   ├── calendar/
│   │   ├── CalendarGrid.jsx          # Modified: accepts activeFilters, renders overlay
│   │   ├── WorkshopCard.jsx          # Modified: accepts isDimmed prop
│   │   └── AvailabilityOverlay.jsx   # New: lane overlays per coach
│   ├── layout/
│   │   ├── AppShell.jsx              # Unchanged
│   │   ├── Sidebar.jsx               # Modified: filter panel below nav
│   │   └── TopBar.jsx                # Unchanged
│   ├── nav/
│   │   └── NavItem.jsx               # Unchanged
│   ├── panel/
│   │   ├── WorkshopPanel.jsx         # Unchanged
│   │   ├── WorkshopForm.jsx          # Unchanged
│   │   └── AttendanceSparkline.jsx   # Unchanged
│   ├── roster/                       # New folder
│   │   ├── RosterTable.jsx           # Sortable table
│   │   └── CoachDetailPanel.jsx      # Slide-in panel for selected coach
│   └── common/                       # New folder
│       ├── ToastStack.jsx            # Fixed toast container
│       ├── Toast.jsx                 # Individual toast with auto-dismiss
│       ├── EmptyState.jsx            # Reusable empty state + CTA
│       └── ConfirmModal.jsx          # Blocking confirmation dialog
├── context/
│   └── AppContext.jsx                # Modified: add toast API + filter state
├── data/
│   ├── coaches.js                    # Unchanged
│   └── workshops.js                  # Unchanged
├── pages/
│   ├── ScheduleCalendar.jsx          # Modified: keyboard shortcuts, overlay toggle
│   ├── CoachRoster.jsx               # New implementation
│   └── DraftManager.jsx              # New implementation
└── utils/
    ├── conflictEngine.js             # Unchanged
    ├── coachAvailability.js          # Unchanged
    └── filterEngine.js               # New: pure filter/highlight logic
```

### Structure Rationale

- **components/roster/**: Isolated from calendar components — CoachRoster page is its own domain with its own table + panel pattern. Keep separate to avoid coupling.
- **components/common/**: Toast, EmptyState, ConfirmModal are cross-cutting UI primitives used by multiple pages. Grouping avoids duplication.
- **utils/filterEngine.js**: Filter logic extracted to a pure function so CalendarGrid and Sidebar can both depend on it without coupling to each other. Testable independently.
- **context/AppContext.jsx modified vs new file**: AppContext already exists with `coaches/workshops` — extend it rather than create a second context, because filters and toasts need the same provider scope.

## Architectural Patterns

### Pattern 1: Filter State in AppContext, Applied by CalendarGrid

**What:** Filters live in AppContext (`filters` state), not in Sidebar or CalendarGrid. Sidebar writes them. CalendarGrid reads them and applies via `filterEngine.js`.

**When to use:** When filter state needs to survive page navigation (coordinator switches to Roster and back — filters should persist).

**Trade-offs:** Slightly more wiring than local state. Worth it because filters are genuinely cross-cutting — the calendar page, the roster page, and potentially the draft page all benefit from knowing the active coach filter.

**Example:**
```jsx
// App.jsx — add to AppContext.Provider value
const [filters, setFilters] = useState({
  coaches: [],    // array of coachId strings, empty = all
  types: [],      // array of workshop type strings
  statuses: [],   // array of status strings
  markets: [],    // array of market strings
})

// filterEngine.js — pure function, no React imports
export function applyFilters(workshops, filters) {
  return workshops.filter(ws => {
    if (filters.coaches.length && !filters.coaches.includes(ws.coachId)) return false
    if (filters.types.length && !filters.types.includes(ws.type)) return false
    if (filters.statuses.length && !filters.statuses.includes(ws.status)) return false
    if (filters.markets.length && !ws.markets?.some(m => filters.markets.includes(m))) return false
    return true
  })
}

export function getHighlightState(workshop, filters) {
  const hasActiveFilters =
    filters.coaches.length || filters.types.length ||
    filters.statuses.length || filters.markets.length
  if (!hasActiveFilters) return 'normal'
  const matchesCoach = !filters.coaches.length || filters.coaches.includes(workshop.coachId)
  const matchesType = !filters.types.length || filters.types.includes(workshop.type)
  // ... etc
  return (matchesCoach && matchesType /* && ... */) ? 'highlight' : 'dim'
}

// CalendarGrid.jsx — consume filters from context
const { workshops, coaches, filters } = useApp()
const highlightMap = useMemo(
  () => new Map(workshops.map(ws => [ws.id, getHighlightState(ws, filters)])),
  [workshops, filters]
)
// Pass highlightState to each WorkshopCard as isDimmed={highlightMap.get(ws.id) === 'dim'}
```

---

### Pattern 2: Toast System via Context API

**What:** `addToast(message, type)` function lives in AppContext. `ToastStack` component in `AppShell` (or directly in `App.jsx` outside the router) calls `useApp()` and renders the toast list. Individual toasts auto-dismiss via `useEffect` + `setTimeout`.

**When to use:** Any action that needs feedback — publish success, conflict warning, save confirmation. Works from any page without prop drilling.

**Trade-offs:** Context re-renders ToastStack on every toast add/remove, but ToastStack is a fixed overlay outside the main layout so this is acceptable. Toasts array stays small (3-5 items max).

**Example:**
```jsx
// App.jsx additions
const [toasts, setToasts] = useState([])

const addToast = useCallback((message, type = 'success') => {
  const id = Date.now()
  setToasts(prev => [...prev, { id, message, type }])
}, [])

const removeToast = useCallback((id) => {
  setToasts(prev => prev.filter(t => t.id !== id))
}, [])

// AppContext.Provider value additions: toasts, addToast, removeToast

// Toast.jsx — auto-dismiss
export function Toast({ id, message, type, onRemove }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(id), 3000)
    return () => clearTimeout(timer)
  }, [id, onRemove])
  // render based on type: success=green, error=red, warning=amber
}

// ToastStack.jsx — fixed position, outside scroll containers
export function ToastStack() {
  const { toasts, removeToast } = useApp()
  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
      {toasts.map(t => <Toast key={t.id} {...t} onRemove={removeToast} />)}
    </div>
  )
}
```

---

### Pattern 3: Keyboard Shortcut Hook

**What:** Custom `useKeyboardShortcuts(handlers)` hook that registers a global `keydown` listener. Filters out events from input elements so shortcuts don't fire while typing. Lives in `ScheduleCalendar` (week nav shortcuts) and can be reused elsewhere.

**When to use:** For app-level shortcuts that map to page-scoped actions. Do not put in AppShell — shortcuts are page-specific.

**Trade-offs:** Hook must be careful about dependency array stability — wrap handlers in `useCallback` before passing in.

**Example:**
```jsx
// hooks/useKeyboardShortcuts.js
export function useKeyboardShortcuts(handlers) {
  const handlersRef = useRef(handlers)
  useLayoutEffect(() => { handlersRef.current = handlers })

  useEffect(() => {
    const onKeyDown = (e) => {
      // Don't fire when user is typing in an input/textarea/select
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.target.isContentEditable) return

      const handler = handlersRef.current[e.key]
      if (handler) {
        e.preventDefault()
        handler(e)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, []) // stable — uses ref pattern, no deps needed
}

// ScheduleCalendar.jsx usage
useKeyboardShortcuts({
  ArrowLeft: prevWeek,
  ArrowRight: nextWeek,
  t: goToToday,
  T: goToToday,
  Escape: closePanel,
  n: openCreate,
  N: openCreate,
})
```

---

### Pattern 4: Sortable Table with sortConfig State

**What:** `RosterTable` owns `sortConfig = { key, direction }` in local `useState`. `useMemo` derives the sorted rows. Column headers receive `onClick` that calls `handleSort(key)` toggling direction.

**When to use:** CoachRoster page — 18 coaches is small enough that client-side sort with `useMemo` is zero-cost.

**Trade-offs:** Local state (not context) because sort config is page-scoped UI state that doesn't need to persist across navigation.

**Example:**
```jsx
const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' })

const sortedCoaches = useMemo(() => {
  return [...coaches].sort((a, b) => {
    const aVal = a[sortConfig.key]
    const bVal = b[sortConfig.key]
    const cmp = typeof aVal === 'string'
      ? aVal.localeCompare(bVal)
      : aVal - bVal
    return sortConfig.direction === 'asc' ? cmp : -cmp
  })
}, [coaches, sortConfig])

const handleSort = (key) => {
  setSortConfig(prev =>
    prev.key === key
      ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
      : { key, direction: 'asc' }
  )
}
```

---

### Pattern 5: Availability Overlay as Positioned Child in CalendarGrid

**What:** `AvailabilityOverlay` renders semi-transparent lane blocks inside each day column in `CalendarGrid`. Driven by a toggle (`showAvailability` bool) in `ScheduleCalendar` state, passed as a prop to `CalendarGrid`.

**When to use:** Overlay is calendar-specific — local state in `ScheduleCalendar` is correct. No need to put it in context.

**Trade-offs:** The overlay requires mapping each coach's availability windows to pixel positions using the same `GRID_START_HOUR / PX_PER_HOUR` constants already in `CalendarGrid`. Those constants should be extracted to a shared file (`utils/calendarGeometry.js`) to avoid duplication.

**Example:**
```jsx
// AvailabilityOverlay.jsx — renders inside a day column
// receives: coaches, day (Date), gridStartHour, pxPerHour
function coachAvailabilityForDay(coach, day) {
  const dayName = format(day, 'EEEE').toLowerCase()
  return coach.availability.filter(a => a.day === dayName)
}

export function AvailabilityOverlay({ coaches, day, gridStartHour, pxPerHour }) {
  const activeCoaches = coaches.filter(c => c.status === 'active')
  return (
    <>
      {activeCoaches.flatMap(coach =>
        coachAvailabilityForDay(coach, day).map((slot, i) => {
          const [sh, sm] = slot.start.split(':').map(Number)
          const [eh, em] = slot.end.split(':').map(Number)
          const top = ((sh + sm / 60) - gridStartHour) * pxPerHour
          const height = ((eh + em / 60) - (sh + sm / 60)) * pxPerHour
          return (
            <div
              key={`${coach.id}-${i}`}
              className="absolute left-0 right-0 bg-green-100/40 pointer-events-none border-l-2 border-green-400/50"
              style={{ top, height }}
            />
          )
        })
      )}
    </>
  )
}
```

---

### Pattern 6: Batch Operations with Set-Based Selection State

**What:** `DraftManager` owns `selectedIds = new Set()` in `useState`. Checkboxes toggle IDs in/out of the set. A "Publish Selected" button is enabled when set is non-empty, opens `ConfirmModal`, and on confirm calls `setWorkshops` to update statuses.

**When to use:** Local state in the DraftManager page — selection is ephemeral UI state that does not need to persist.

**Trade-offs:** `Set` objects require copying to trigger React re-renders (`new Set(prev).add(id)`) — consistent with React's immutable state contract.

**Example:**
```jsx
const [selectedIds, setSelectedIds] = useState(new Set())
const [confirmOpen, setConfirmOpen] = useState(false)

const toggleSelect = (id) => {
  setSelectedIds(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })
}

const toggleSelectAll = () => {
  setSelectedIds(prev =>
    prev.size === draftWorkshops.length
      ? new Set()
      : new Set(draftWorkshops.map(w => w.id))
  )
}

const handlePublishConfirm = () => {
  setWorkshops(prev =>
    prev.map(w => selectedIds.has(w.id) ? { ...w, status: 'Published' } : w)
  )
  setSelectedIds(new Set())
  setConfirmOpen(false)
  addToast(`Published ${selectedIds.size} workshops`)
}
```

## Data Flow

### Filter Application Flow

```
User clicks filter checkbox in Sidebar
    ↓
Sidebar calls setFilters (from AppContext)
    ↓
AppContext.filters updates → subscribers re-render
    ↓
CalendarGrid reads filters via useApp()
    ↓
useMemo recomputes highlightMap
    ↓
WorkshopCard receives isDimmed prop → renders with opacity-40 class
```

### Toast Flow

```
Any page/component calls addToast("message", "success")
    ↓
App.jsx setToasts adds { id, message, type } to array
    ↓
ToastStack re-renders with new toast
    ↓
Toast.jsx useEffect schedules removeToast after 3000ms
    ↓
App.jsx setToasts removes toast by id
```

### Keyboard Shortcut Flow

```
User presses ArrowRight (not in input)
    ↓
useKeyboardShortcuts onKeyDown fires
    ↓
Calls nextWeek() from ScheduleCalendar
    ↓
setCurrentWeekStart updates → CalendarGrid re-renders
```

### Batch Publish Flow

```
Coordinator checks workshops in DraftManager
    ↓
selectedIds Set grows in local useState
    ↓
"Publish Selected" button becomes enabled
    ↓
Click opens ConfirmModal
    ↓
Confirm → setWorkshops in AppContext (updates global workshops state)
    ↓
addToast("Published N workshops")
    ↓
selectedIds reset to empty Set
```

## Integration Points with Existing Components

### CalendarGrid — modifications needed

| What changes | Why |
|---|---|
| Accept `filters` prop (or read from context) | Drive highlight/dim state |
| Accept `showAvailability` bool prop | Toggle overlay layer |
| Render `<AvailabilityOverlay>` inside each day column when `showAvailability` | New overlay feature |
| Pass `isDimmed` to each `WorkshopCard` | Visual filter feedback |
| Extract `GRID_START_HOUR`, `PX_PER_HOUR` to shared util | Reuse in `AvailabilityOverlay` |

### WorkshopCard — minimal change

Add one prop: `isDimmed: boolean`. Apply `opacity-40 saturate-0` classes when dimmed. No logic changes.

### Sidebar — significant change

Currently only renders nav items. Needs a filter panel section below nav. Filter state lives in AppContext — Sidebar calls `setFilters`. Consider breaking into `<SidebarFilters />` subcomponent to keep the file manageable.

### AppContext — additive change only

Add `filters`, `setFilters`, `toasts`, `addToast`, `removeToast` to the provider value. Existing consumers (`useApp()`) are unaffected because they destructure only what they need.

### App.jsx — additive change

Add `filters` and `toasts` state. Wire up `addToast`/`removeToast`. Render `<ToastStack />` as a sibling to `<AppShell>` (both inside the provider, outside the router).

## Suggested Build Order

Build in this order — each phase unblocks the next:

1. **AppContext extension + ToastStack** (enables all other phases to fire toasts)
   - Add `filters`, `toasts`, `addToast`, `removeToast` to AppContext
   - Build `ToastStack` + `Toast` components
   - Wire into `App.jsx`

2. **filterEngine.js + Sidebar filters + CalendarGrid highlighting**
   - Build pure `filterEngine.js` utility
   - Add filter UI to `Sidebar`
   - Pass highlight state to `CalendarGrid` → `WorkshopCard`
   - Fire toast when filter applied: "Showing 3 coaches"

3. **Availability overlay** (depends on CalendarGrid modification from step 2)
   - Extract calendar geometry constants to shared util
   - Build `AvailabilityOverlay` component
   - Add toggle button to ScheduleCalendar nav bar

4. **Keyboard shortcuts** (isolated, no dependencies)
   - Build `useKeyboardShortcuts` hook
   - Wire into `ScheduleCalendar` (arrows, T, Esc, N)

5. **Coach Roster page** (isolated from calendar, builds on context)
   - Build `RosterTable` with sort
   - Build `CoachDetailPanel`
   - Add EmptyState for "no coaches match filter" case

6. **Draft Manager page** (depends on toast from step 1)
   - Build sortable draft list with checkboxes
   - Build `ConfirmModal` component
   - Wire batch publish → `setWorkshops` → `addToast`

7. **Micro-interactions + empty states** (polish layer, applies to all previous work)
   - Add Tailwind hover transitions to cards, buttons
   - Build `EmptyState` reusable component
   - Wire into filtered-empty calendar, empty roster, empty draft list

## Anti-Patterns

### Anti-Pattern 1: Filter State in Sidebar Local State

**What people do:** Put `filters` in `useState` inside `Sidebar.jsx`.
**Why it's wrong:** Filters become invisible to `CalendarGrid`, `CoachRoster`, and `DraftManager`. Sidebar would need to pass filters up via callbacks to `AppShell`, then down to children — deep prop drilling through a layout component that shouldn't own business state.
**Do this instead:** Filters in `AppContext`. Sidebar is a writer. CalendarGrid is a reader.

---

### Anti-Pattern 2: Inline Toast State in Each Page

**What people do:** Each page manages its own toast `useState` and renders toasts locally.
**Why it's wrong:** Toasts from `DraftManager` disappear when user navigates away. Multiple toast stacks can appear simultaneously. No unified z-index or positioning.
**Do this instead:** Single `ToastStack` in `App.jsx` (above the router), fed by `AppContext.addToast`.

---

### Anti-Pattern 3: Multiple `useEffect` Event Listeners for Keyboard Shortcuts

**What people do:** Add `document.addEventListener('keydown', handler)` directly in a `useEffect` in `ScheduleCalendar` with all handler functions in the dependency array.
**Why it's wrong:** Handler functions recreated every render (unless wrapped in `useCallback`) cause the listener to be removed and re-added on every render. Also easy to accidentally capture stale closures.
**Do this instead:** The `useKeyboardShortcuts` hook using a ref-based pattern — handlers stay fresh via `useRef`, listener is stable, added once on mount.

---

### Anti-Pattern 4: CalendarGrid Owning Filter Logic

**What people do:** Put `applyFilters()` inside `CalendarGrid.jsx`.
**Why it's wrong:** Makes CalendarGrid harder to test, couples the rendering component to business logic, and makes it impossible to reuse filter logic on the Roster page.
**Do this instead:** Pure `filterEngine.js` utility consumed by CalendarGrid via `useMemo`. Logic is independently testable.

---

### Anti-Pattern 5: AvailabilityOverlay Duplicating Grid Constants

**What people do:** Hardcode `GRID_START_HOUR = 6` and `PX_PER_HOUR = 64` inside `AvailabilityOverlay.jsx`.
**Why it's wrong:** CalendarGrid already defines these. Two copies diverge immediately if one is changed (e.g., extending grid to 5 AM).
**Do this instead:** Extract to `utils/calendarGeometry.js` and import in both `CalendarGrid` and `AvailabilityOverlay`.

---

### Anti-Pattern 6: `new Set()` Mutation for Batch Selection

**What people do:** `selectedIds.add(id); setSelectedIds(selectedIds)` — mutating the existing Set.
**Why it's wrong:** React uses referential equality to detect state changes. Mutating the same Set object means React sees no change and does not re-render.
**Do this instead:** Always create a new Set: `setSelectedIds(prev => new Set(prev).add(id))`.

## Scaling Considerations

This is a single-user prototype targeting ~48 workshops and 18 coaches. All scaling below is informational only — none applies to v1.1.

| Concern | At current scale (48 workshops) | At 500+ workshops | At real backend |
|---------|----------------------------------|-------------------|----------------|
| Filter performance | `useMemo` on 48 items is instant | Still fine with `useMemo` | Move filter to API query params |
| Conflict detection | O(n²) is ~2300 iterations — fine | Would need optimization | Move to server |
| Sort (18 coaches) | Client-side instant | Client-side fine up to 1000 | Paginate + server sort |
| Toast queue | 3-5 toasts max | Same | Same |

## Sources

- Direct codebase inspection: `/Users/adam/ww-workshop-scheduler/src/` (HIGH confidence — authoritative)
- React docs on context: https://react.dev/reference/react/useContext (HIGH confidence)
- React keyboard event pattern: https://www.taniarascia.com/keyboard-shortcut-hook-react/ (MEDIUM confidence — verified against React docs AbortController pattern already in WorkshopPanel.jsx)
- Sortable table pattern: https://blog.logrocket.com/creating-react-sortable-table/ (MEDIUM confidence — standard pattern, matches existing useState usage in project)
- Toast via Context: https://dev.to/kevjose/building-a-reusable-notification-system-with-react-hooks-and-context-api-2phj (MEDIUM confidence — pattern widely used, verified against React 19 context API)
- Empty state design: https://carbondesignsystem.com/patterns/empty-states-pattern/ (MEDIUM confidence — IBM design system, stable pattern)
- Tailwind transitions: https://tailwindcss.com/docs/transition-property (HIGH confidence — official docs)

---
*Architecture research for: WW Workshop Scheduler v1.1*
*Researched: 2026-03-09*
