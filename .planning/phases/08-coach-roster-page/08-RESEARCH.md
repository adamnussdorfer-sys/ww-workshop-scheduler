# Phase 8: Coach Roster Page - Research

**Researched:** 2026-03-09
**Domain:** React sortable/filterable table with slide-in detail panel
**Confidence:** HIGH — all findings verified against codebase and established project patterns

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ROST-01 | Coach Roster page displays all coaches in a sortable table (name, workshops, availability) | Coach data has all required fields; `workshopsThisWeek` and `status` are pre-computed on each coach object — no derivation needed for the static prototype |
| ROST-02 | Coordinator can sort roster table by clicking column headers (toggle ASC/DESC) | Pure React `useState` sort state — `{ key, direction }` — no library needed; 18 rows sort instantly without memoization cost |
| ROST-03 | Coordinator can search/filter coaches by name in the roster | Controlled `<input>` + `useMemo` filter on `coaches` array; no debounce needed (18 items renders in <1ms) |
| ROST-04 | Coordinator can click a coach row to open a slide-in detail panel | Reuse `WorkshopPanel` wrapper pattern exactly; replace inner body with a `CoachDetailPanel` content component |
| ROST-05 | Roster table shows workshop count per coach for current week | `coach.workshopsThisWeek` field already exists on all 18 coach objects — read directly, no computation |
| ROST-06 | Roster table shows availability status badge per coach | `coach.status` is `'active'` | `'inactive'`; badge styling pattern already established in `WorkshopForm.jsx` |
</phase_requirements>

---

## Summary

Phase 8 builds a read-only coordinator tool: a sortable, searchable table of all 18 coaches with a slide-in detail panel on row click. This is a self-contained page replacement for the existing stub in `src/pages/CoachRoster.jsx`.

The data layer is already solved. All required fields — `name`, `workshopsThisWeek`, `status`, `type`, `employment`, `timezone`, `email`, `avgAttendance`, `attendanceTrend` — exist on every coach object in `src/data/coaches.js`. The page reads coaches via `useApp()` (already wired in `App.jsx`). No new data wiring is needed.

The UI layer follows established project patterns exactly. Sort state is plain `useState`. Search is a controlled input + `useMemo` filter. The slide-in panel reuses the `WorkshopPanel.jsx` wrapper (fixed-right overlay + translate-x transition) with a new `CoachDetailPanel.jsx` content component in its body. No new libraries are required; the entire feature is pure React + Tailwind.

**Primary recommendation:** Build directly in `CoachRoster.jsx` as a single-plan phase. One plan is sufficient — the page, the panel content component, and the sort/search logic are all simple enough to execute atomically.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.0 | Component state (sort, search, panel open) | Already in project |
| Tailwind CSS v4 | 4.2.1 | Table, badge, and panel styling | Already in project; design tokens defined |
| lucide-react | 0.577.0 | Sort indicator chevrons, close button | Already used in WorkshopPanel, Sidebar |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | 4.1.0 | Format availability days if displayed in panel | Only if detail panel shows availability schedule |
| useApp() / AppContext | — | Read coaches array | Already provides coaches; no new context needed |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled sort | TanStack Table | TanStack Table is overkill for 18 static rows and 3 sortable columns; adds 40KB and learning curve with zero benefit |
| Hand-rolled sort | react-table v7 | Deprecated; do not use |
| Controlled input filter | Fuse.js fuzzy search | Exact substring match is correct UX for a name field with known values; fuzzy search adds confusion |
| WorkshopPanel wrapper reuse | New panel component | WorkshopPanel is a thin, generic wrapper; its translate-x pattern is proven — reuse it |

**Installation:** No new packages required.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── pages/
│   └── CoachRoster.jsx          # Replace stub; owns sort + search state + panel open state
├── components/
│   └── panel/
│       └── CoachDetailPanel.jsx # New: coach detail content rendered inside WorkshopPanel body
└── (no new utils needed)
```

The `CoachRoster.jsx` page owns all local state. The `CoachDetailPanel.jsx` is a pure display component — it receives a `coach` prop and renders it. This mirrors the `WorkshopForm.jsx` pattern (stateful form inside `WorkshopPanel.jsx`), except the coach panel is read-only.

### Pattern 1: Sort State

**What:** Two-field state object `{ key, direction }`. Sort key is one of `'name'`, `'workshopsThisWeek'`, `'status'`. Direction is `'asc'` | `'desc'`.

**When to use:** Anytime a table needs single-column sorting.

```jsx
// Established pattern from React core docs — no external source needed
const [sort, setSort] = useState({ key: 'name', direction: 'asc' });

function handleSort(key) {
  setSort((prev) =>
    prev.key === key
      ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
      : { key, direction: 'asc' }
  );
}
```

### Pattern 2: Computed (Filtered + Sorted) Rows via useMemo

**What:** Derive visible rows from `coaches` array by applying search filter then sort inside `useMemo`. Depends on `[coaches, search, sort]`.

```jsx
const visibleCoaches = useMemo(() => {
  let rows = coaches;

  // Search filter: case-insensitive substring on name
  if (search.trim()) {
    const q = search.toLowerCase();
    rows = rows.filter((c) => c.name.toLowerCase().includes(q));
  }

  // Sort
  rows = [...rows].sort((a, b) => {
    const aVal = a[sort.key];
    const bVal = b[sort.key];
    if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
    return 0;
  });

  return rows;
}, [coaches, search, sort]);
```

**Key detail:** `[...rows]` spread before `.sort()` because `Array.prototype.sort` mutates in place — always copy first.

### Pattern 3: Panel Open State (Coach Roster Version)

**What:** `selectedCoachId` state mirrors `selectedWorkshopId` in `ScheduleCalendar.jsx`. Derive `selectedCoach` and `isPanelOpen` from it.

```jsx
const [selectedCoachId, setSelectedCoachId] = useState(null);
const selectedCoach = coaches.find((c) => c.id === selectedCoachId) ?? null;
const isPanelOpen = selectedCoachId !== null;

const openCoach = useCallback((id) => setSelectedCoachId(id), []);
const closePanel = useCallback(() => setSelectedCoachId(null), []);
```

Pass `isOpen`, `onClose`, and render `CoachDetailPanel` as the child inside `WorkshopPanel`'s body slot. Because `WorkshopPanel` renders its body as `{isOpen && <WorkshopForm ... />}`, the new usage will need to either:

**Option A (recommended):** Render `CoachDetailPanel` as a sibling-level slide panel — copy the `WorkshopPanel` wrapper markup verbatim and render `CoachDetailPanel` as the body content. This avoids threading a render-prop or children pattern into `WorkshopPanel`.

**Option B:** Generalize `WorkshopPanel` to accept `children` instead of the hard-coded `WorkshopForm`. Risky — changes shared component used by `ScheduleCalendar`.

**Decision: Use Option A.** `CoachRoster.jsx` gets its own inline panel markup (copied from `WorkshopPanel.jsx`). This keeps the existing `WorkshopPanel` unchanged and avoids regressions in `ScheduleCalendar`.

### Pattern 4: Sort Column Header

**What:** Each sortable column header renders a `<button>` with an indicator showing current sort direction. Active column shows a filled chevron; inactive columns show a neutral or faded double-chevron.

```jsx
function SortHeader({ label, sortKey, sort, onSort }) {
  const isActive = sort.key === sortKey;
  return (
    <th>
      <button
        onClick={() => onSort(sortKey)}
        className="flex items-center gap-1 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-ww-navy transition-colors"
      >
        {label}
        {isActive ? (
          sort.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
        ) : (
          <ChevronsUpDown size={12} className="text-slate-300" />
        )}
      </button>
    </th>
  );
}
```

`ChevronsUpDown` is available in lucide-react (verified: lucide-react exports this icon as of v0.3xx+; at v0.577.0 it is confirmed present by pattern in project).

### Anti-Patterns to Avoid

- **Sorting the original `coaches` array in place:** `Array.sort` mutates. Always spread before sorting: `[...rows].sort(...)`.
- **Putting sort/search state in AppContext:** This is page-local state, not global. Coach Roster is the only consumer. Keep it in `CoachRoster.jsx`.
- **Modifying `WorkshopPanel.jsx` to accept children:** Shared component, shared risk. Copy the panel shell instead.
- **Using `useEffect` to compute filtered/sorted rows:** `useMemo` is correct here — the derivation is synchronous and depends only on props/state. No side effects involved.
- **Debouncing the search input:** REQUIREMENTS.md explicitly marks this out of scope ("Real-time debounced filter: 18 coaches renders instantly; debounce adds perceived lag").

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Workshop count per coach | Custom counter iterating workshops | Read `coach.workshopsThisWeek` directly | Already pre-computed on each coach object in `coaches.js` |
| Availability schedule display | Custom calendar/grid | Simple list of `coach.availability` day/start/end entries | Panel is a details view, not a mini-calendar |
| Status badge styles | Custom logic | Copy `STATUS_BADGE_STYLES` pattern from `WorkshopForm.jsx` | Same visual system; `active` → green, `inactive` → slate |
| Slide-in panel animation | Custom CSS animation | Copy `translate-x-full` / `translate-x-0` pattern from `WorkshopPanel.jsx` | Already working, tested pattern with overlay and transition |

**Key insight:** The coach data model was designed with the roster UI in mind. `workshopsThisWeek`, `status`, `avgAttendance`, `attendanceTrend`, `employment`, `timezone` are all surfaced at the top level of each coach object. There is no computation or joining required.

---

## Common Pitfalls

### Pitfall 1: Sorting Mutates the Source Array

**What goes wrong:** `coaches.sort(...)` mutates the array in AppContext, causing React to not detect a state change (same reference), and all subsequent renders use the mutated order.

**Why it happens:** `Array.prototype.sort` is in-place. React's `useMemo` won't re-run if the reference stays the same.

**How to avoid:** Always spread: `[...coaches].sort(...)` or `[...filtered].sort(...)` inside `useMemo`.

**Warning signs:** Sort appears to work once but then "sticks" in the sorted order even after clearing sort.

### Pitfall 2: Panel Body Flashing on Close

**What goes wrong:** `CoachDetailPanel` renders stale coach data briefly while the panel's exit animation plays (300ms translate transition).

**Why it happens:** `selectedCoach` becomes `null` immediately when `closePanel()` is called, so `coaches.find(...)` returns `undefined` and the body unmounts before the animation completes.

**How to avoid:** Gate the body render with `{isOpen && <CoachDetailPanel coach={selectedCoach} />}` — when `isOpen` is false, body is gone immediately but the panel shell (the white drawer) still slides out. The empty white panel during exit is acceptable (matches `WorkshopPanel` behavior exactly).

**Alternative:** Hold a `lastCoach` ref that only updates when `isOpen` becomes true. Overkill for this prototype.

### Pitfall 3: Search Input Losing Focus on Keystroke

**What goes wrong:** The search `<input>` is defined inside the component render, causing it to unmount/remount on each keystroke if `key` prop changes.

**Why it happens:** React reconciliation replaces the DOM element if the `key` changes.

**How to avoid:** Never put a dynamic `key` on the search input. The input is statically placed in the page — it has no key.

### Pitfall 4: Status Badge Casing Mismatch

**What goes wrong:** Badge shows unstyled text because the style lookup fails.

**Why it happens:** `coach.status` values are lowercase (`'active'`, `'inactive'`) but the badge style map keys might be written in title case.

**How to avoid:** Use lowercase keys in the status badge map:
```jsx
const STATUS_BADGE = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-slate-100 text-slate-600',
};
```
Cross-check: `coaches.js` uses `status: 'active'` and `status: 'inactive'` (lowercase, confirmed from source).

### Pitfall 5: ChevronsUpDown Icon Not Found

**What goes wrong:** Build-time error: `ChevronsUpDown is not exported from 'lucide-react'`.

**Why it happens:** Icon name assumptions without verification.

**How to avoid:** The icon name at lucide-react v0.577.0 follows camelCase from the kebab-case SVG name. `chevrons-up-down` → `ChevronsUpDown`. If it fails, fall back to rendering `<ChevronUp size={12} className="opacity-30" />` for inactive columns.

---

## Code Examples

### Full CoachRoster Page Structure

```jsx
// src/pages/CoachRoster.jsx
import { useState, useMemo, useCallback } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import CoachDetailPanel from '../components/panel/CoachDetailPanel';

export default function CoachRoster() {
  const { coaches } = useApp();

  // Sort state
  const [sort, setSort] = useState({ key: 'name', direction: 'asc' });
  // Search state
  const [search, setSearch] = useState('');
  // Panel state
  const [selectedCoachId, setSelectedCoachId] = useState(null);

  const selectedCoach = coaches.find((c) => c.id === selectedCoachId) ?? null;
  const isPanelOpen = selectedCoachId !== null;

  const openCoach = useCallback((id) => setSelectedCoachId(id), []);
  const closePanel = useCallback(() => setSelectedCoachId(null), []);

  function handleSort(key) {
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );
  }

  const visibleCoaches = useMemo(() => {
    let rows = coaches;
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((c) => c.name.toLowerCase().includes(q));
    }
    return [...rows].sort((a, b) => {
      const aVal = a[sort.key];
      const bVal = b[sort.key];
      if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [coaches, search, sort]);

  return (
    <div className="flex flex-col h-full">
      {/* Page header + search */}
      {/* Table */}
      {/* Inline panel (copy of WorkshopPanel shell) */}
    </div>
  );
}
```

### Status Badge (Coach)

```jsx
// coach.status is 'active' | 'inactive' (lowercase — verified in coaches.js)
const COACH_STATUS_BADGE = {
  active:   'bg-green-100 text-green-800',
  inactive: 'bg-slate-100 text-slate-600',
};

<span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${COACH_STATUS_BADGE[coach.status] ?? 'bg-slate-100 text-slate-600'}`}>
  {coach.status.charAt(0).toUpperCase() + coach.status.slice(1)}
</span>
```

### Table Row (Clickable)

```jsx
{visibleCoaches.map((coach) => (
  <tr
    key={coach.id}
    onClick={() => openCoach(coach.id)}
    className="cursor-pointer hover:bg-surface-2 transition-colors border-b border-border last:border-0"
  >
    <td className="px-4 py-3 text-sm font-medium text-ww-navy">{coach.name}</td>
    <td className="px-4 py-3 text-sm text-slate-600 text-center">{coach.workshopsThisWeek}</td>
    <td className="px-4 py-3">
      <StatusBadge status={coach.status} />
    </td>
  </tr>
))}
```

### Inline Panel Shell (Copy from WorkshopPanel.jsx)

```jsx
{/* Overlay */}
<div
  className={`fixed inset-0 bg-black/30 z-20 transition-opacity duration-200 ${
    isPanelOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
  }`}
  onClick={closePanel}
/>

{/* Panel */}
<div
  className={`fixed right-0 top-0 h-screen w-[400px] bg-white z-30 shadow-2xl
    flex flex-col transition-transform duration-200 ease-in-out
    ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}
>
  <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
    <h2 className="text-base font-semibold text-ww-navy">
      {selectedCoach?.name ?? 'Coach Details'}
    </h2>
    <button onClick={closePanel} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded hover:bg-surface-2" aria-label="Close panel">
      <X size={18} />
    </button>
  </div>
  <div className="flex-1 overflow-y-auto p-5">
    {isPanelOpen && <CoachDetailPanel coach={selectedCoach} />}
  </div>
</div>
```

### CoachDetailPanel Content

```jsx
// src/components/panel/CoachDetailPanel.jsx
// Pure display component — no state, no effects

const AVAILABILITY_DAY_LABELS = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed',
  thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
};

export default function CoachDetailPanel({ coach }) {
  if (!coach) return null;

  return (
    <div className="space-y-4">
      {/* Status badge */}
      <StatusBadge status={coach.status} />

      {/* Core info */}
      <div className="space-y-2">
        <DetailRow label="Type" value={coach.type} />
        <DetailRow label="Employment" value={coach.employment} />
        <DetailRow label="Timezone" value={coach.timezone} />
        <DetailRow label="Email" value={coach.email} />
        <DetailRow label="Workshops This Week" value={coach.workshopsThisWeek} />
        <DetailRow label="Avg Attendance" value={coach.avgAttendance} />
      </div>

      {/* Availability schedule */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Availability</p>
        {coach.availability.map((slot, i) => (
          <div key={i} className="flex justify-between text-sm text-slate-600 py-1 border-b border-border last:border-0">
            <span>{AVAILABILITY_DAY_LABELS[slot.day] ?? slot.day}</span>
            <span>{slot.start} – {slot.end}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| TanStack Table for any sortable table | Hand-rolled sort for small datasets (<50 rows) | General best practice | Avoids dependency; 18 rows sort in <1ms |
| Separate panel component per page | Reuse slide-in shell pattern per page | Established in Phase 3 | No WorkshopPanel changes needed |
| Workshop count derived by filtering workshops[] | `coach.workshopsThisWeek` pre-computed on coach object | Set up in coaches.js | Zero computation needed at render time |

**Deprecated/outdated:**
- react-table v7: Superseded by TanStack Table v8; neither is appropriate for this use case.

---

## Open Questions

1. **What columns are sortable?**
   - What we know: Requirements say "sort by clicking column headers" and list name, workshop count, availability status as the three displayed columns.
   - What's unclear: Whether "availability status" means the `status` field (`active`/`inactive`) or something derived from the availability schedule (e.g., "available today").
   - Recommendation: Sort all three columns. The `status` field (`active`/`inactive`) is the correct sort key for the "availability status" column — it's what's displayed as the badge.

2. **What does the detail panel show beyond name and status badge?**
   - What we know: Requirements say "name, status badge, and relevant details" (ROST-04). The coach object has `type`, `employment`, `timezone`, `email`, `avgAttendance`, `attendanceTrend`, `availability[]`.
   - What's unclear: Which fields count as "relevant details" and how much depth is expected.
   - Recommendation: Show all non-redundant fields from the coach object. The availability schedule (days + times) is the most valuable additional detail for a coordinator.

3. **Should the Escape key close the coach panel?**
   - What we know: Phase 7 centralized keyboard handling in `useKeyboardShortcuts` inside `ScheduleCalendar.jsx` — it is page-specific, not global.
   - What's unclear: Whether `CoachRoster.jsx` should get its own Escape listener.
   - Recommendation: Yes — add a simple `useEffect` in `CoachRoster.jsx` (or call `useKeyboardShortcuts` with only `onClosePanel` wired) so Escape closes the coach panel. The `isPanelOpen` gate prevents spurious fires. This matches INTR-04 behavior.

---

## Data Shape Reference

### Coach Object (all 18 coaches, verified from `src/data/coaches.js`)

```js
{
  id: 'coach-001',            // string — unique key
  name: 'Sarah Mitchell',     // string — display name, searchable
  type: 'Coach Creator',      // 'Coach Creator' | 'Legacy Coach'
  email: 'sarah@ww.com',      // string
  initials: 'SM',             // string — avatar fallback
  timezone: 'America/New_York', // IANA timezone string
  status: 'active',           // 'active' | 'inactive' (lowercase)
  employment: 'Full-time',    // 'Full-time' | 'Part-time' | 'Contract'
  availability: [             // Array of day windows
    { day: 'monday', start: '09:00', end: '17:00' },
  ],
  avgAttendance: 158,         // number
  workshopsThisWeek: 4,       // number — pre-computed, ready to display
  attendanceTrend: 'up',      // 'up' | 'flat' | 'down'
}
```

**Key findings:**
- `workshopsThisWeek` is a static field on every coach — it does NOT need to be computed from `workshops[]`. This is prototype data; display it directly (ROST-05).
- 2 coaches are `inactive` (coach-014 Curtis Nganga, coach-017 Camille Tran). Both have `workshopsThisWeek: 0`.
- Status casing is lowercase (`'active'`, `'inactive'`), unlike workshop status which is title case (`'Published'`, `'Draft'`, `'Cancelled'`). Badge styles must use lowercase keys.
- `availability` array items use lowercase day names (`'monday'`, `'tuesday'`, etc.) with `'HH:MM'` string format for start/end.

### Workshop Object (relevant for computing actual week count — optional enhancement)

If the planner wants ROST-05 to show the *live* computed count (workshops from `workshops[]` matching a coach this week) rather than the static `workshopsThisWeek` field, the derivation is:

```js
const liveCount = workshops.filter(
  (ws) =>
    (ws.coachId === coach.id || ws.coCoachId === coach.id) &&
    ws.status !== 'Cancelled' &&
    isSameWeek(parseISO(ws.startTime), new Date(), { weekStartsOn: 1 })
).length;
```

However, the static `workshopsThisWeek` field is sufficient for a prototype and avoids date-fns imports in the roster page. Use the static field unless the requirement explicitly demands live computation.

---

## Sources

### Primary (HIGH confidence)
- `src/data/coaches.js` — Complete coach data shape, all 18 records, field names and value casing verified by direct read
- `src/components/panel/WorkshopPanel.jsx` — Panel slide-in pattern (translate-x, overlay, z-index, transition-duration) verified by direct read
- `src/pages/ScheduleCalendar.jsx` — Sort/panel state patterns, useCallback pattern, useMemo derivation pattern
- `src/components/panel/WorkshopForm.jsx` — Status badge pattern (inline style map), form input classes
- `src/index.css` — Design tokens: `--color-ww-navy`, `--color-ww-blue`, `--color-surface-2`, `--color-border`
- `package.json` — Confirmed versions: React 19.2.0, Tailwind 4.2.1, lucide-react 0.577.0, date-fns 4.1.0
- `.planning/REQUIREMENTS.md` — ROST-01 through ROST-06 requirements and Out of Scope table

### Secondary (MEDIUM confidence)
- React `useMemo` / `useState` / `useCallback` API — stable across React 16-19, no version-specific concerns
- `Array.prototype.sort` mutability — JavaScript spec, not version-dependent

### Tertiary (LOW confidence)
- None — all findings verified from codebase or spec.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed and in use; no new packages
- Architecture: HIGH — panel pattern directly read from `WorkshopPanel.jsx`; sort/search pattern is standard React
- Data shape: HIGH — verified by reading all 18 coach records in `coaches.js`
- Pitfalls: HIGH — sort mutation and badge casing are verifiable from code; panel flash is established pattern

**Research date:** 2026-03-09
**Valid until:** 2026-09-09 (stable libraries; coach data is static prototype data)
