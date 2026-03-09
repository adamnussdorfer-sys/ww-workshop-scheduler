# Phase 6: Sidebar Filters + Highlight/Dim - Research

**Researched:** 2026-03-09
**Domain:** React multi-select filter state, CSS opacity dim effect, removable filter pills UI
**Confidence:** HIGH

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FILT-01 | Coordinator can filter calendar by coach name via sidebar checkboxes | `filters.coaches` array in AppContext already exists; Sidebar needs checkbox list built from `coaches` data; CalendarGrid passes `isFiltered` prop to WorkshopCard |
| FILT-02 | Coordinator can filter calendar by workshop type via sidebar checkboxes | `filters.types` array in AppContext; types enumerated from workshops data: "Weekly Connection", "All In", "Special Event", "Coaching Corner", "Movement/Fitness" |
| FILT-03 | Coordinator can filter calendar by status via sidebar checkboxes | `filters.statuses` array in AppContext; values: "Draft", "Published", "Cancelled" (Cancelled cards already hidden, but can still be filter target) |
| FILT-04 | Coordinator can filter calendar by market/region via sidebar checkboxes | `filters.markets` array in AppContext; values: "US", "CA", "UK", "ANZ" |
| FILT-05 | Active filters display as pills above the calendar grid | FilterPills component in ScheduleCalendar above CalendarGrid; one pill per active filter value |
| FILT-06 | Coordinator can clear all active filters with a single "Clear" button | `setFilters({ coaches: [], types: [], statuses: [], markets: [] })` — already shaped for this |
| FILT-07 | Non-matching workshop cards dim to ~25% opacity while matching cards stay fully visible | CSS `opacity: 0.25` on non-matching WorkshopCard; no additional library needed |
| FILT-08 | Active filters persist when navigating between weeks | Filters live in AppContext (App.jsx state), not ScheduleCalendar local state — week navigation only changes `currentWeekStart` local state, filters are unaffected |
| EMPT-02 | Zero filter results shows "No matching workshops" with "Clear filters" CTA | CalendarGrid or ScheduleCalendar detects `matchedCount === 0 && anyFilterActive` and renders empty state |
| EMPT-03 | Coach-specific filter with no results shows personalized "No workshops for [Name]" message | Special-case: when `filters.coaches.length === 1 && filters.types.length === 0 && filters.statuses.length === 0 && filters.markets.length === 0 && matchedCount === 0` — show "No workshops for [Coach Name] this week" |
</phase_requirements>

---

## Summary

Phase 6 is a pure React state + Tailwind CSS phase — no new npm packages are needed. The filter state shape (`filters: { coaches[], types[], statuses[], markets[] }`) was already established in AppContext during Phase 5. The work is wiring UI to that state and applying the visual dim effect.

The architecture has three distinct surfaces: (1) the **Sidebar** becomes a filter control panel with four collapsible sections of checkboxes, one per filter dimension; (2) a new **FilterPills** component renders above the CalendarGrid in ScheduleCalendar, showing one removable pill per active filter value with a "Clear all" button; (3) **WorkshopCard** receives a boolean `isFiltered` prop that applies `opacity-25` and `pointer-events-none` when true. CalendarGrid computes which workshops match the active filters using a pure `filterEngine.js` utility.

The critical design decision confirmed by STATE.md: **filter state lives in AppContext**, not in Sidebar or ScheduleCalendar. The Sidebar is a writer (`setFilters`), and ScheduleCalendar/CalendarGrid are readers (`filters`). This separation means FILT-08 (filter persistence across week navigation) is architecturally free — week navigation only touches `currentWeekStart` local state in ScheduleCalendar, leaving AppContext filters untouched.

**Primary recommendation:** Build a pure filterEngine.js utility (parallel to conflictEngine.js), add checkbox filter sections to Sidebar, add a FilterPills strip in ScheduleCalendar above CalendarGrid, pass `isFiltered` boolean to WorkshopCard, and implement the empty state in CalendarGrid. No new npm packages required.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React + AppContext | 19.x (already installed) | Filter state management and propagation | `filters` shape already in AppContext from Phase 5; `useApp()` hook provides access everywhere |
| Tailwind CSS v4 | 4.2.x (already installed) | `opacity-25`, `transition-opacity`, `pointer-events-none` utility classes for dim effect | Zero-config, no new CSS required |
| lucide-react | 0.577.x (already installed) | `X` icon for pill close buttons, `ChevronDown`/`ChevronUp` for collapsible sections | Already in project |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `useMemo` (React built-in) | React 19.x | Compute `filteredWorkshopIds` Set from filters + workshops — avoids re-computing per card | Called in CalendarGrid or ScheduleCalendar where both `workshops` and `filters` are in scope |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Pure CSS opacity dim | Framer Motion animate opacity | Overkill for this prototype; CSS transition is instant (<16ms), adds no bundle weight |
| Inline filter logic in CalendarGrid | Separate filterEngine.js utility | filterEngine.js is the decided architecture (STATE.md); keeps CalendarGrid a pure renderer; reusable in CoachRoster/DraftManager |
| Pills in ScheduleCalendar | Pills inside CalendarGrid | ScheduleCalendar is the correct level — it owns week navigation and the overall layout; CalendarGrid is a rendering component only |

**Installation:** None required. All libraries already installed.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── utils/
│   └── filterEngine.js          # NEW: pure filter matching utility (mirrors conflictEngine.js style)
├── components/
│   ├── layout/
│   │   └── Sidebar.jsx          # MODIFY: add four filter sections below nav items
│   ├── filters/
│   │   └── FilterPills.jsx      # NEW: removable pill strip + "Clear all" button
│   └── calendar/
│       ├── CalendarGrid.jsx     # MODIFY: accept filteredIds set, pass isFiltered to WorkshopCard
│       └── WorkshopCard.jsx     # MODIFY: accept isFiltered prop, apply opacity-25
└── pages/
    └── ScheduleCalendar.jsx     # MODIFY: read filters from context, compute filteredIds, render FilterPills, handle empty state
```

### Pattern 1: Pure Filter Engine (filterEngine.js)

**What:** A pure utility function that takes workshops + filters and returns a Set of workshop IDs that match all active filter dimensions. OR logic within a dimension, AND logic across dimensions.

**When to use:** Anywhere that needs to know which workshops match — CalendarGrid, future DraftManager, CoachRoster.

**Logic:**
- If `filters.coaches` is empty, all workshops pass the coaches dimension (no filter applied)
- If `filters.coaches` has values, workshop passes if `ws.coachId` OR `ws.coCoachId` is in `filters.coaches`
- Same OR-within-AND-across pattern for types, statuses, markets
- A workshop "matches" only if it passes ALL active dimensions

**Example:**
```js
// src/utils/filterEngine.js

/**
 * Returns a Set of workshop IDs that match all active filter dimensions.
 * OR within a dimension, AND across dimensions.
 * Empty dimension array = no filter applied (all pass).
 *
 * @param {Object[]} workshops
 * @param {{ coaches: string[], types: string[], statuses: string[], markets: string[] }} filters
 * @returns {Set<string>} matchedIds
 */
export function getMatchedWorkshopIds(workshops, filters) {
  const { coaches, types, statuses, markets } = filters;
  const hasCoachFilter = coaches.length > 0;
  const hasTypeFilter = types.length > 0;
  const hasStatusFilter = statuses.length > 0;
  const hasMarketFilter = markets.length > 0;

  // No filters active — all workshops match
  if (!hasCoachFilter && !hasTypeFilter && !hasStatusFilter && !hasMarketFilter) {
    return new Set(workshops.map(w => w.id));
  }

  const matched = new Set();
  for (const ws of workshops) {
    const passesCoach = !hasCoachFilter || coaches.includes(ws.coachId) || (ws.coCoachId && coaches.includes(ws.coCoachId));
    const passesType = !hasTypeFilter || types.includes(ws.type);
    const passesStatus = !hasStatusFilter || statuses.includes(ws.status);
    const passesMarket = !hasMarketFilter || ws.markets.some(m => markets.includes(m));

    if (passesCoach && passesType && passesStatus && passesMarket) {
      matched.add(ws.id);
    }
  }
  return matched;
}

/**
 * Returns true if any filter dimension has at least one value selected.
 */
export function hasActiveFilters(filters) {
  return filters.coaches.length > 0 || filters.types.length > 0 ||
         filters.statuses.length > 0 || filters.markets.length > 0;
}
```

### Pattern 2: Filter State Toggle in Sidebar

**What:** Toggle a value in/out of a filter array via setFilters. Functional update pattern prevents stale closure issues.

**When to use:** Every checkbox onChange handler in the Sidebar filter sections.

**Example:**
```jsx
// In Sidebar.jsx — toggle a coachId in filters.coaches
const { filters, setFilters } = useApp();

function toggleFilter(dimension, value) {
  setFilters(prev => {
    const current = prev[dimension];
    const next = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    return { ...prev, [dimension]: next };
  });
}

// Usage in checkbox:
<input
  type="checkbox"
  checked={filters.coaches.includes(coach.id)}
  onChange={() => toggleFilter('coaches', coach.id)}
/>
```

### Pattern 3: filteredIds Set in ScheduleCalendar

**What:** Compute the matched IDs set once in ScheduleCalendar using useMemo, then pass it down to CalendarGrid. CalendarGrid uses it per-card to determine `isFiltered`.

**When to use:** One computation point for all filter logic — not repeated per-card.

**Example:**
```jsx
// ScheduleCalendar.jsx
import { useApp } from '../context/AppContext';
import { getMatchedWorkshopIds, hasActiveFilters } from '../utils/filterEngine';

export default function ScheduleCalendar() {
  const { workshops, coaches, filters } = useApp();

  const anyFilterActive = useMemo(() => hasActiveFilters(filters), [filters]);

  const filteredIds = useMemo(
    () => getMatchedWorkshopIds(workshops, filters),
    [workshops, filters]
  );

  // Count visible (non-cancelled) matched workshops for current week
  const weekMatchCount = useMemo(() => {
    return weekDays.reduce((count, day) => {
      return count + workshops.filter(ws =>
        ws.status !== 'Cancelled' &&
        isSameDay(parseISO(ws.startTime), day) &&
        filteredIds.has(ws.id)
      ).length;
    }, 0);
  }, [workshops, filteredIds, weekDays]);

  // ...

  return (
    <>
      {anyFilterActive && <FilterPills />}
      {/* empty state check */}
      {anyFilterActive && weekMatchCount === 0 ? (
        <EmptyFilterState filters={filters} onClear={clearFilters} />
      ) : (
        <CalendarGrid
          {...}
          filteredIds={filteredIds}
          anyFilterActive={anyFilterActive}
        />
      )}
    </>
  );
}
```

### Pattern 4: WorkshopCard isFiltered Dim Effect

**What:** Pass `isFiltered` boolean to WorkshopCard. When true, apply `opacity-25` and `pointer-events-none` so dimmed cards don't intercept clicks.

**When to use:** Any workshop card that does not match the active filter set.

**Example:**
```jsx
// WorkshopCard.jsx
export default function WorkshopCard({ workshop, coachMap, conflicts = [], onClick, isFiltered = false }) {
  return (
    <div
      className={`h-full overflow-hidden rounded text-xs px-1.5 py-1 cursor-pointer hover:brightness-95 transition-all relative ${cardStyle} ${ringClass} ${
        isFiltered ? 'opacity-25 pointer-events-none' : ''
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(workshop.id);
      }}
    >
      {/* existing content unchanged */}
    </div>
  );
}
```

Note: `transition-opacity duration-150` can be added to smooth the dim/undim as filters toggle. Tailwind's `transition-all` already on the card covers this.

### Pattern 5: FilterPills Component

**What:** Renders one pill per active filter value, each with an X button that removes that specific value. Plus a "Clear all" button.

**When to use:** Rendered in ScheduleCalendar when `anyFilterActive` is true.

**Pill label format:** Dimension prefix + value name
- Coach filter: "Coach: Sarah Mitchell"
- Type filter: "Type: All In"
- Status filter: "Status: Draft"
- Market filter: "Market: US"

**Example:**
```jsx
// FilterPills.jsx
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function FilterPills() {
  const { filters, setFilters, coaches } = useApp();

  const coachMap = new Map(coaches.map(c => [c.id, c]));
  const clearAll = () => setFilters({ coaches: [], types: [], statuses: [], markets: [] });

  const removeFilter = (dimension, value) => {
    setFilters(prev => ({
      ...prev,
      [dimension]: prev[dimension].filter(v => v !== value),
    }));
  };

  const pills = [
    ...filters.coaches.map(id => ({
      key: `coach-${id}`,
      label: `Coach: ${coachMap.get(id)?.name ?? id}`,
      remove: () => removeFilter('coaches', id),
    })),
    ...filters.types.map(t => ({
      key: `type-${t}`,
      label: `Type: ${t}`,
      remove: () => removeFilter('types', t),
    })),
    ...filters.statuses.map(s => ({
      key: `status-${s}`,
      label: `Status: ${s}`,
      remove: () => removeFilter('statuses', s),
    })),
    ...filters.markets.map(m => ({
      key: `market-${m}`,
      label: `Market: ${m}`,
      remove: () => removeFilter('markets', m),
    })),
  ];

  if (pills.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2 bg-white border-b border-border">
      {pills.map(pill => (
        <span
          key={pill.key}
          className="flex items-center gap-1 px-2 py-1 bg-ww-blue/10 text-ww-blue text-xs font-medium rounded-full"
        >
          {pill.label}
          <button
            type="button"
            onClick={pill.remove}
            className="ml-0.5 text-ww-blue/60 hover:text-ww-blue"
            aria-label={`Remove filter: ${pill.label}`}
          >
            <X size={10} />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={clearAll}
        className="text-xs text-slate-500 hover:text-ww-navy underline ml-1"
      >
        Clear all
      </button>
    </div>
  );
}
```

### Pattern 6: Empty State for Zero Filter Results

**What:** When `anyFilterActive && weekMatchCount === 0`, replace the CalendarGrid with a centered message. Personalize when exactly one coach filter is active.

**When to use:** In ScheduleCalendar, wrapping the CalendarGrid render.

**Example:**
```jsx
// In ScheduleCalendar.jsx, in the calendar body section
const singleCoachFilter =
  filters.coaches.length === 1 &&
  filters.types.length === 0 &&
  filters.statuses.length === 0 &&
  filters.markets.length === 0;

const emptyMessage = singleCoachFilter
  ? `No workshops for ${coachMap.get(filters.coaches[0])?.name ?? 'this coach'} this week`
  : 'No matching workshops';

// Render:
{anyFilterActive && weekMatchCount === 0 ? (
  <div className="flex flex-col items-center justify-center h-64 text-center">
    <p className="text-slate-600 text-sm font-medium mb-2">{emptyMessage}</p>
    <button
      type="button"
      onClick={() => setFilters({ coaches: [], types: [], statuses: [], markets: [] })}
      className="text-ww-blue text-sm underline hover:text-ww-navy"
    >
      Clear filters
    </button>
  </div>
) : (
  <CalendarGrid ... />
)}
```

### Pattern 7: Sidebar Filter Sections

**What:** Four collapsible sections below the nav items in Sidebar. Each section has a label and a scrollable list of checkboxes. The sidebar only renders these when on the Schedule Calendar route (or always — coordinator-facing UX decision).

**Data for each filter section:**

| Section | Data Source | Key | Display Name |
|---------|-------------|-----|--------------|
| Coaches | `coaches` from AppContext | `coach.id` | `coach.name` |
| Types | Static constant array | string | string |
| Status | Static constant array | string | string |
| Market | Static constant array | string | string |

**Static filter option constants:**
```js
const WORKSHOP_TYPES = ['All In', 'Coaching Corner', 'Movement/Fitness', 'Special Event', 'Weekly Connection'];
const WORKSHOP_STATUSES = ['Published', 'Draft', 'Cancelled'];
const WORKSHOP_MARKETS = ['US', 'CA', 'UK', 'ANZ'];
```

**Coach list consideration:** 18 coaches — renders fine without virtualization. Active coaches only (status === 'active') = 16 coaches. Design decision: show active coaches only, or all 18. Recommendation: show all (including inactive) since coordinator may want to find why an inactive coach has no workshops.

**Sidebar collapsed state interaction:** When sidebar is collapsed (64px wide), filter sections cannot be shown. The filter sections are only rendered when `!collapsed`. When collapsed, sidebar shows only nav icons — no filter UI. This is already handled by the `collapsed` prop.

### Anti-Patterns to Avoid

- **Filter logic inside WorkshopCard:** WorkshopCard should only receive a boolean `isFiltered` prop. Never compute filter matching inside the card — it would run 48 times per render instead of once.
- **Filter state in ScheduleCalendar local state:** Breaks FILT-08. Filters must live in AppContext so week navigation (which remounts nothing from AppContext's perspective) cannot reset them.
- **Filtering out non-matching workshops entirely (removing from DOM):** The requirement says "dim to 25% opacity" — non-matching cards must remain rendered and positioned on the grid. Removing them would collapse the grid layout. Apply `opacity-25 pointer-events-none`, not conditional rendering.
- **OR logic across filter dimensions:** A workshop matching "Coach: Sarah" OR "Type: All In" would produce unexpectedly broad results. The correct behavior is AND across dimensions (workshop must match all active dimension filters) with OR within a dimension.
- **Putting FilterPills inside CalendarGrid:** CalendarGrid is a calendar renderer. Pills belong at the ScheduleCalendar page level, above the navigation bar or between the nav bar and the grid body.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Filter matching logic per-card | Inline `if` chains in WorkshopCard or CalendarGrid's workshop loop | `filterEngine.js` pure function returning a Set | Set lookup is O(1); logic is isolated and testable; consistent with conflictEngine.js pattern |
| Pill overflow handling | Custom scroll/collapse logic | Tailwind `flex flex-wrap` | 18 coaches × 4 dimensions = at most 24 pills; flex-wrap handles overflow naturally |
| Checkbox controlled state | Custom checkbox component | Native `<input type="checkbox">` with Tailwind styling | Zero bundle cost; accessible; browser-native indeterminate state |
| Opacity animation | JS-based opacity transition | Tailwind `transition-opacity` or `transition-all` already on WorkshopCard | The card already has `transition-all` — opacity dim will animate automatically |

**Key insight:** The entire filter system is pure React state + CSS. The only "computation" is the filter matching function, which is a simple O(n) loop over 48 workshops. No library, no virtual DOM diffing optimization, no memoization beyond the single `useMemo` that wraps `getMatchedWorkshopIds` is needed.

---

## Common Pitfalls

### Pitfall 1: Filtering vs. Dimming (Wrong Rendering Strategy)

**What goes wrong:** Builder filters workshops array before passing to CalendarGrid, so non-matching workshops are removed from the DOM. The calendar grid collapses or shows gaps where cards were.

**Why it happens:** "Filter" is a natural impulse to `.filter()` the array.

**How to avoid:** Pass the full workshops array to CalendarGrid always. Pass `filteredIds: Set<string>` and `anyFilterActive: boolean` separately. CalendarGrid uses `filteredIds.has(ws.id)` to set `isFiltered` prop on each WorkshopCard. The card stays mounted with `opacity-25`.

**Warning signs:** Grid columns shift or collapse when filters are applied; positioned-absolute cards restack incorrectly.

### Pitfall 2: weekMatchCount Computed Incorrectly (Wrong Empty State Trigger)

**What goes wrong:** Empty state shows when there are matching workshops in OTHER weeks, or does not show when all visible workshops in the current week are filtered out.

**Why it happens:** `filteredIds` contains workshops from all weeks (full workshops array), not just the current week view.

**How to avoid:** Count matched workshops specifically for the current week's `weekDays`. Filter by `isSameDay(parseISO(ws.startTime), day)` for each day in `weekDays`, then check `filteredIds.has(ws.id)` and `ws.status !== 'Cancelled'`. Sum across all days.

**Warning signs:** Empty state appears on a week that has no workshops regardless of filters; or empty state never appears even when all visible cards are dimmed.

### Pitfall 3: Sidebar Filter Sections Always Visible (Wrong Route Context)

**What goes wrong:** Filter sections appear in the sidebar when the user navigates to Coach Roster or Draft Manager pages, where they have no effect on the visible content.

**Why it happens:** Sidebar doesn't know which page is active.

**How to avoid:** Two options: (A) Use `useLocation()` from react-router in Sidebar and only render filter sections when `location.pathname === '/'`; (B) Always show filters but scope their visual effect (harmless — filters simply don't affect non-calendar pages). Recommendation: option A for clean UX. The Sidebar can import `useLocation` to conditionally render filter sections.

**Warning signs:** Filter checkboxes visible on /roster page where they have no visual effect.

### Pitfall 4: Coach Filter Using Name Instead of ID

**What goes wrong:** Builder stores coach name strings in `filters.coaches` array. Workshop data stores `coachId` ('coach-001' etc.), not name. Filter matching fails silently.

**Why it happens:** The filter UI shows names, so builder stores names.

**How to avoid:** Store coach IDs in `filters.coaches`. The filter UI maps from coach objects to display names but stores `coach.id` as the filter value. The filter engine matches `ws.coachId` against the IDs in `filters.coaches`.

**Warning signs:** Filtering by "Sarah Mitchell" dims no cards even though she has workshops.

### Pitfall 5: Missing co-coach in Coach Filter Matching

**What goes wrong:** Workshop ws-006 has `coachId: 'coach-015'` and `coCoachId: 'coach-008'`. Filtering for coach-008 does not match it because only `coachId` is checked.

**Why it happens:** `coCoachId` is null for most workshops, easy to overlook.

**How to avoid:** In filterEngine.js, check BOTH `ws.coachId` and `ws.coCoachId`:
```js
const passesCoach = !hasCoachFilter ||
  coaches.includes(ws.coachId) ||
  (ws.coCoachId && coaches.includes(ws.coCoachId));
```

**Warning signs:** Some of coach's workshops appear dimmed when filtering by that coach.

### Pitfall 6: Personalized Empty State Logic Too Broad

**What goes wrong:** "No workshops for [Name] this week" message appears when filtering by one coach AND one type (e.g., "coach-001 AND All In"), producing a confusing personalized message that implies no workshops at all for that coach.

**Why it happens:** The personalization check only looks at `filters.coaches.length === 1` without checking that other dimensions are empty.

**How to avoid:** Only show personalized coach message when EXACTLY one coach filter is active AND all other dimension arrays are empty:
```js
const singleCoachFilter =
  filters.coaches.length === 1 &&
  filters.types.length === 0 &&
  filters.statuses.length === 0 &&
  filters.markets.length === 0;
```

**Warning signs:** "No workshops for Sarah Mitchell this week" appearing when 3 filter dimensions are active.

---

## Code Examples

Verified patterns from codebase inspection:

### Filter State Shape (Already in AppContext from Phase 5)
```js
// src/App.jsx — already implemented
const [filters, setFilters] = useState({
  coaches: [],    // string[] — coach IDs (e.g., 'coach-001')
  types: [],      // string[] — 'Weekly Connection' | 'All In' | 'Special Event' | 'Coaching Corner' | 'Movement/Fitness'
  statuses: [],   // string[] — 'Published' | 'Draft' | 'Cancelled'
  markets: [],    // string[] — 'US' | 'CA' | 'UK' | 'ANZ'
})
// Available via: const { filters, setFilters } = useApp()
```

### Workshop Data Shape (relevant fields for filtering)
```js
// Every workshop in workshops.js has these fields:
{
  id: 'ws-001',
  type: 'Weekly Connection',  // one of 5 types
  status: 'Published',        // 'Published' | 'Draft' | 'Cancelled'
  coachId: 'coach-001',       // always present
  coCoachId: 'coach-006',     // may be null
  markets: ['US', 'CA'],      // string[] — always an array, at least 1 value
}
```

### Tailwind CSS Classes for Dim Effect
```jsx
// WorkshopCard.jsx — add to existing className
className={`... ${isFiltered ? 'opacity-25 pointer-events-none' : ''}`}
// The card already has transition-all — opacity animates automatically on filter toggle
// pointer-events-none ensures dimmed cards don't intercept click-to-create on the day column
```

### Static Filter Constants
```js
// Can be defined at top of Sidebar.jsx or in a separate constants file
const WORKSHOP_TYPES = [
  'All In',
  'Coaching Corner',
  'Movement/Fitness',
  'Special Event',
  'Weekly Connection',
];
const WORKSHOP_STATUSES = ['Published', 'Draft', 'Cancelled'];
const WORKSHOP_MARKETS = ['US', 'CA', 'UK', 'ANZ'];
```

### CalendarGrid Signature Change
```jsx
// CalendarGrid.jsx — add filteredIds and anyFilterActive props
export default function CalendarGrid({
  weekDays,
  workshops,
  coaches,
  conflictMap,
  onWorkshopClick,
  onSlotClick,
  filteredIds,        // NEW: Set<string> — workshop IDs that pass current filters
  anyFilterActive,    // NEW: boolean — whether any filter dimension is active
}) {
  // In the workshop card render loop:
  const isFiltered = anyFilterActive && !filteredIds.has(ws.id);

  return (
    <WorkshopCard
      workshop={ws}
      coachMap={coachMap}
      conflicts={conflictMap?.get(ws.id)?.conflicts ?? []}
      onClick={onWorkshopClick}
      isFiltered={isFiltered}   // NEW
    />
  );
}
```

### Sidebar Route-Aware Filter Section Rendering
```jsx
// Sidebar.jsx — show filter sections only on Schedule Calendar route
import { useLocation } from 'react-router';

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const showFilters = location.pathname === '/' && !collapsed;
  const { coaches, filters, setFilters } = useApp();

  // ... existing nav items ...

  return (
    <aside ...>
      {/* existing logo and nav */}
      {showFilters && (
        <div className="border-t border-white/10 px-2 py-3 overflow-y-auto flex-1">
          <FilterSection title="Coach" ... />
          <FilterSection title="Type" ... />
          <FilterSection title="Status" ... />
          <FilterSection title="Market" ... />
        </div>
      )}
      {/* collapse toggle */}
    </aside>
  );
}
```

---

## Data Enumeration

Confirmed values from `src/data/workshops.js` and `src/data/coaches.js`:

**Workshop Types (5):**
- All In
- Coaching Corner
- Movement/Fitness
- Special Event
- Weekly Connection

**Workshop Statuses (3):**
- Published
- Draft
- Cancelled

**Markets (4):**
- ANZ
- CA
- UK
- US

**Coaches (18):** Listed in coaches.js with IDs coach-001 through coach-018. 2 inactive (coach-014 Curtis Nganga, coach-017 Camille Tran). 16 active.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Redux for filter state | React Context + useState | React 16.3+ (2018) | No boilerplate, no additional packages; setState functional updates prevent stale closures |
| Filter by removing from DOM | CSS opacity dim with pointer-events-none | Component-era pattern | Grid layout preserved; ARIA visibility still works; animation is free with transition-all |
| Local component filter state | Lifted to shared context | React patterns | FILT-08 (persistence across week navigation) is free — no synchronization needed |

**No deprecated approaches identified for this phase.**

---

## Open Questions

1. **Should inactive coaches appear in the sidebar Coach filter?**
   - What we know: 2 of 18 coaches are inactive (coach-014, coach-017) and have `workshopsThisWeek: 0` in the mock data.
   - What's unclear: Whether coordinators need to filter for inactive coaches (to confirm they have no workshops).
   - Recommendation: Include all 18 coaches in the filter list. Filtering by an inactive coach will reliably produce the personalized empty state ("No workshops for [Name] this week") which demonstrates the feature. Excluding them would hide data.

2. **Should the Sidebar filter sections be collapsible (accordion) or always expanded?**
   - What we know: 18 coaches in the Coach section creates a long list; the sidebar has fixed height with `flex-col overflow-hidden`.
   - What's unclear: Whether 18 checkboxes + 5 + 3 + 4 = 30 items fits comfortably in the sidebar without scrolling.
   - Recommendation: Make each section collapsible with a chevron toggle and an internal `max-h` scroll limit (e.g., `max-h-48 overflow-y-auto`) for the Coach section. The other three sections are short enough to show fully. This is Claude's discretion — no explicit requirement for collapsibility.

3. **Should clicking a dimmed workshop card still open the detail panel?**
   - What we know: FILT-07 says non-matching cards dim to 25% opacity. `pointer-events-none` prevents clicks.
   - What's unclear: Whether coordinators should be able to view dimmed workshop details.
   - Recommendation: Apply `pointer-events-none` on dimmed cards. The dim communicates "not relevant now" — allowing clicks on dimmed cards would be confusing UX. If a coordinator wants to view it, they can clear the filter.

4. **Placement of FilterPills: above or below the week navigation bar?**
   - What we know: ScheduleCalendar has a nav bar (`flex items-center gap-3 py-3 px-4`) with prev/next/today/view-toggle.
   - What's unclear: Whether pills go above (before the nav bar) or below it (between nav and CalendarGrid).
   - Recommendation: Below the week navigation bar, above the CalendarGrid — this mirrors the pattern used in tools like Linear and Notion where filter chips appear between the toolbar and content. The `border-b border-border` on the pills row visually separates them from the grid.

---

## Sources

### Primary (HIGH confidence)

- `/Users/adam/ww-workshop-scheduler/src/App.jsx` — Confirmed `filters` state shape, `setFilters`, and `useMemo` context value from Phase 5 implementation
- `/Users/adam/ww-workshop-scheduler/src/data/workshops.js` — Confirmed all filter dimension values (5 types, 3 statuses, 4 markets); confirmed `coCoachId` nullability
- `/Users/adam/ww-workshop-scheduler/src/data/coaches.js` — Confirmed 18 coaches, IDs coach-001 to coach-018, 2 inactive
- `/Users/adam/ww-workshop-scheduler/src/utils/conflictEngine.js` — Pattern template for filterEngine.js (pure utility, Set-based return, module-level export)
- `/Users/adam/ww-workshop-scheduler/src/components/calendar/CalendarGrid.jsx` — Confirmed current props signature; `visibleWorkshops` already filters Cancelled; absolute positioning pattern for cards
- `/Users/adam/ww-workshop-scheduler/src/components/calendar/WorkshopCard.jsx` — Confirmed `className` construction pattern for dynamic classes; `transition-all` already applied
- `/Users/adam/ww-workshop-scheduler/src/components/layout/Sidebar.jsx` — Confirmed `collapsed` prop controls visibility; `flex-1 overflow-y-auto` on nav section
- `/Users/adam/ww-workshop-scheduler/.planning/STATE.md` — Confirmed architectural decision: "Filter state lives in AppContext (not Sidebar or page-level)" and "filterEngine.js as pure utility"
- Node.js runtime query on workshops data — confirmed exact enum values for types, statuses, markets

### Secondary (MEDIUM confidence)

- Phase 5 RESEARCH.md and PLAN-01 — Pattern reference for how AppContext is extended; confirms `filters` shape is live and tested

### Tertiary (LOW confidence)

- None — all claims verified from live codebase

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; all libraries confirmed installed in package.json
- Architecture: HIGH — filter state shape confirmed live in App.jsx; filterEngine pattern confirmed from conflictEngine.js template; dim-with-opacity is CSS, not algorithmic
- Pitfalls: HIGH — all pitfalls derived from direct codebase inspection (coCoachId nullability, absolute-positioned card rendering, route-specific sidebar)
- Data enumerations: HIGH — confirmed by runtime node execution on actual data files

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (stable React + Tailwind; data shape controlled by this codebase)
