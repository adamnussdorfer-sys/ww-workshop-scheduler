# Phase 9: Draft Manager Page - Research

**Researched:** 2026-03-09
**Domain:** React bulk-select table with conflict-aware publish modal
**Confidence:** HIGH — all findings verified directly from project source code

## Summary

Phase 9 builds the Draft Manager page, the third and final secondary page in the v1.1 milestone. The core interaction is a checkbox-driven bulk publish flow: coordinators select draft workshops from a table, click Publish, see a conflict warning in a modal, and confirm. The workshops are then status-mutated in the shared AppContext state and disappear from the list, confirmed by a toast.

The page follows the same structural pattern established in Phase 8 (CoachRoster): a self-contained page component using `useApp()` to read from context, `useMemo` for derived state, and a page-local modal (not a slide panel) for the publish confirmation. The key difference is that DraftManager must write back to context state (changing workshop status from 'Draft' to 'Published'), whereas CoachRoster is read-only.

Conflict detection for the selected set is the main algorithmic concern. The existing `buildConflictMap` in `conflictEngine.js` covers the full workshop corpus. For the Draft Manager, the relevant question is: of the workshops the coordinator has checked, how many have existing conflict entries in that map? No new conflict logic is needed — only filtering the already-computed result.

**Primary recommendation:** Build DraftManager as a single self-contained page file with inline modal markup, mirroring the CoachRoster pattern. Read `workshops` from `useApp()`, filter to status 'Draft' with `useMemo`, compute conflict counts from `buildConflictMap`, and mutate via `setWorkshops` on confirm.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DRAF-01 | Draft Manager page lists all draft workshops in a table | Filter workshops by status === 'Draft' via useMemo; render as table with columns for title, coach, day/time, type |
| DRAF-02 | Coordinator can select multiple draft workshops via checkboxes (with select-all) | Controlled checkbox state with Set or array of selected IDs; select-all toggles entire visible list |
| DRAF-03 | Coordinator can publish selected workshops via a confirmation modal showing item count | Modal open/close boolean state; modal body shows count of selected workshops; confirm calls setWorkshops to change status |
| DRAF-04 | Publish button displays a conflict count badge when selected workshops have conflicts | Call buildConflictMap on full workshop corpus; count selected IDs that have hasConflicts === true |
| DRAF-05 | Confirmation modal warns about conflicts and allows override ("publish anyway") | Modal conditionally shows conflict warning section; two actions: Cancel and Publish anyway (same handler) |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 | 19.2.0 | Page component, hooks | Already in project |
| Tailwind CSS v4 | 4.2.1 | Styling via @theme tokens | Already in project |
| lucide-react | 0.577.0 | Icons (checkbox stand-in is native HTML, but icons for badge/warning) | Already in project |
| sonner | 2.0.7 | Toast on publish confirm | Already in project, toast exposed via useApp() |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | 4.1.0 | Format startTime for table display | Already in project; use `format(parseISO(...), 'EEE MMM d, h:mm a')` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native HTML `<input type="checkbox">` | Headless UI / Radix Checkbox | No new dependencies needed; native checkbox is fully accessible for this use case |
| Inline modal markup | React Portal / Dialog library | Portal avoids z-index stacking issues but project pattern (WorkshopPanel, CoachRoster panel) has used inline fixed positioning consistently and successfully |

**Installation:** No new packages required.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── pages/
│   └── DraftManager.jsx      # Full page: table + modal (replace stub)
└── utils/
    └── conflictEngine.js     # Already exists — import buildConflictMap
```

No new files are needed beyond replacing the DraftManager stub.

### Pattern 1: Data Flow — Derived State via useMemo
**What:** Read `workshops` and `coaches` from `useApp()`. Derive `draftWorkshops` with useMemo filtering by `status === 'Draft'`. Compute `conflictMap` with useMemo calling `buildConflictMap(workshops, coaches)`.
**When to use:** Whenever data is derived from context — avoids local state copies that can go stale.
**Example:**
```jsx
// Source: project pattern from CoachRoster.jsx + conflictEngine.js API
const { workshops, coaches, setWorkshops, toast } = useApp();

const draftWorkshops = useMemo(
  () => workshops.filter((w) => w.status === 'Draft'),
  [workshops]
);

const conflictMap = useMemo(
  () => buildConflictMap(workshops, coaches),
  [workshops, coaches]
);
```

### Pattern 2: Checkbox Selection State
**What:** Track selected workshop IDs in a `Set` wrapped in useState. Use functional updates to add/remove. Compute derived booleans: `allSelected`, `someSelected`, `selectedConflictCount`.
**When to use:** Multi-select tables — Set gives O(1) has/add/delete.
**Example:**
```jsx
const [selectedIds, setSelectedIds] = useState(new Set());

function toggleAll() {
  setSelectedIds((prev) =>
    prev.size === draftWorkshops.length
      ? new Set()
      : new Set(draftWorkshops.map((w) => w.id))
  );
}

function toggleOne(id) {
  setSelectedIds((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
}

const allSelected = draftWorkshops.length > 0 && selectedIds.size === draftWorkshops.length;
const someSelected = selectedIds.size > 0 && !allSelected;

const selectedConflictCount = useMemo(
  () => [...selectedIds].filter((id) => conflictMap.get(id)?.hasConflicts).length,
  [selectedIds, conflictMap]
);
```

### Pattern 3: Publish Handler — Mutate Context State
**What:** On confirm, map workshops: if ID is in selectedIds and status is 'Draft', set status to 'Published'. Call setWorkshops. Clear selectedIds. Close modal. Fire toast.
**When to use:** All write-back operations against shared workshop state.
**Example:**
```jsx
function handlePublishConfirm() {
  setWorkshops((prev) =>
    prev.map((w) =>
      selectedIds.has(w.id) ? { ...w, status: 'Published' } : w
    )
  );
  const count = selectedIds.size;
  setSelectedIds(new Set());
  setModalOpen(false);
  toast(`${count} workshop${count !== 1 ? 's' : ''} published`);
}
```

### Pattern 4: Modal — Inline Fixed Overlay
**What:** Modal uses the same fixed + z-index overlay pattern as WorkshopPanel and CoachRoster's slide panel. A boolean `modalOpen` state controls display. The modal itself is a centered dialog with backdrop.
**When to use:** Project-standard modal approach — no portal library.
**Example:**
```jsx
// Overlay + centered modal box — consistent with existing panels
{modalOpen && (
  <>
    <div
      className="fixed inset-0 bg-black/30 z-20"
      onClick={() => setModalOpen(false)}
    />
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        {/* modal content */}
      </div>
    </div>
  </>
)}
```

### Pattern 5: Status Field — Exact Case Matters
**What:** The status field in workshops.js uses title-case: `'Draft'`, `'Published'`, `'Cancelled'`. Filter and mutation must use exact case.
**When to use:** Any status comparison or update.

```js
// CORRECT: title-case
workshops.filter(w => w.status === 'Draft')
{ ...w, status: 'Published' }

// WRONG: lowercase (won't match)
workshops.filter(w => w.status === 'draft')
```

### Pattern 6: Conflict Badge on Publish Button
**What:** When `selectedConflictCount > 0`, the Publish button displays a badge with the count. This is text-only within the button, not a separate component.
**Example:**
```jsx
<button
  onClick={() => setModalOpen(true)}
  disabled={selectedIds.size === 0}
  className="..."
>
  Publish
  {selectedConflictCount > 0 && (
    <span className="ml-2 bg-ww-coral text-white text-xs px-1.5 py-0.5 rounded-full">
      {selectedConflictCount} conflict{selectedConflictCount !== 1 ? 's' : ''}
    </span>
  )}
</button>
```

### Anti-Patterns to Avoid
- **Local workshops copy:** Don't copy workshops to local state. Read from context; stale state causes bugs when other pages also mutate.
- **Filtering cancelled/published into draft list:** Only `status === 'Draft'` should appear. Status is title-case — verify exact string comparison.
- **Running buildConflictMap inside the publish handler:** It's expensive. Compute once in useMemo and reuse.
- **React setState with a mutation of existing Set:** Always `new Set(prev)` before modifying — React uses reference equality to detect state changes.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Conflict detection | Custom overlap checker | `buildConflictMap` from `conflictEngine.js` | Already handles double-booking, buffer, and availability conflicts |
| Toast notification | Custom toast | `toast()` from `useApp()` (re-exported from sonner) | Already wired, auto-dismisses, stacks correctly |
| Date formatting | Custom formatter | `format(parseISO(w.startTime), 'EEE MMM d, h:mm a')` from date-fns | Already in project, handles timezone correctly |

**Key insight:** Every infrastructure piece is already built. Phase 9 is purely a new UI surface consuming existing services.

## Common Pitfalls

### Pitfall 1: indeterminate Checkbox State for Select-All
**What goes wrong:** When some (not all) rows are checked, the select-all checkbox should show an indeterminate visual state. Failing to set this leaves the UI ambiguous.
**Why it happens:** HTML `indeterminate` is a property, not an attribute — it cannot be set via JSX prop. Must use a ref or direct DOM manipulation.
**How to avoid:** Use a `useEffect` or `useCallback` ref to set `checkboxRef.current.indeterminate = someSelected`.
**Warning signs:** Select-all checkbox shows unchecked when partial selection exists.

```jsx
// Use a ref callback to handle indeterminate
<input
  type="checkbox"
  ref={(el) => { if (el) el.indeterminate = someSelected; }}
  checked={allSelected}
  onChange={toggleAll}
/>
```

### Pitfall 2: selectedIds Containing IDs No Longer in Draft List
**What goes wrong:** If a workshop is published externally and removed from `draftWorkshops`, its ID may still be in `selectedIds`. The conflict count and publish handler will operate on a stale set.
**Why it happens:** No auto-reconciliation of selection state when source data changes.
**How to avoid:** Derive `effectiveSelectedIds` as the intersection of `selectedIds` and `draftWorkshops.map(w => w.id)`. Use this for counts and the publish handler.
**Warning signs:** Count mismatch between "N selected" label and actual visible rows.

```jsx
const effectiveSelectedIds = useMemo(
  () => new Set([...selectedIds].filter((id) => draftWorkshops.some((w) => w.id === id))),
  [selectedIds, draftWorkshops]
);
```

> Note: In this single-session prototype with no external mutations, this pitfall is lower risk. But the publish action itself removes workshops from the draft list, so stale IDs after one publish cycle are a real edge case if the modal is opened twice rapidly.

### Pitfall 3: Modal Closing on Backdrop Click During Accidental Drag
**What goes wrong:** Clicking inside the modal dialog and dragging to the backdrop fires mouseup on the backdrop element, closing the modal unexpectedly.
**Why it happens:** `onClick` on the backdrop fires for any click that ends on it, including drag-release events.
**How to avoid:** Stop event propagation on the modal box: `onClick={e => e.stopPropagation()}` on the inner dialog `div`.

### Pitfall 4: Empty Draft List State
**What goes wrong:** After publishing all drafts, the table is empty. No message is shown, which looks broken.
**Why it happens:** No empty state branch in the render.
**How to avoid:** Add an empty state message below the table when `draftWorkshops.length === 0`.

```jsx
{draftWorkshops.length === 0 && (
  <div className="text-center py-12 text-slate-500">
    <p>No draft workshops</p>
  </div>
)}
```

### Pitfall 5: Publish Button Disabled State
**What goes wrong:** The Publish button is enabled with zero selected workshops, allowing the modal to open with confusing "0 workshops" messaging.
**How to avoid:** `disabled={selectedIds.size === 0}` with appropriate disabled styles.

## Code Examples

Verified patterns from project source:

### Draft Workshop Count — Derived from workshop data
```js
// Source: workshops.js analysis — status field is title-case
// Draft workshops in data: ws-007, ws-013, ws-015, ws-020, ws-022, ws-024, ws-028,
//                          ws-032, ws-036, ws-040, ws-044, ws-047
// Total: 12 draft workshops in the current dataset
const draftWorkshops = workshops.filter(w => w.status === 'Draft');
// => 12 workshops
```

### Conflict-Flagged Drafts — Known from data
```
// From workshops.js conflict annotations:
// ws-022 (coach-005 double-booked with ws-021 on Tue 10:00-11:30) — DRAFT, status: 'Draft'
// ws-028 (coach-012 buffer violation with ws-027 on Wed 12:05) — DRAFT, status: 'Draft'
// These will show hasConflicts: true in buildConflictMap output
// All other draft workshops are conflict-free
```

### Full buildConflictMap API
```js
// Source: src/utils/conflictEngine.js
import { buildConflictMap } from '../utils/conflictEngine';

// Returns: Map<workshopId, { conflicts: [], ringColor: 'red'|'orange'|null, hasConflicts: boolean }>
const conflictMap = buildConflictMap(workshops, coaches);

// Check if a specific workshop has conflicts:
conflictMap.get('ws-022')?.hasConflicts  // => true
conflictMap.get('ws-007')?.hasConflicts  // => false
```

### Toast Usage Pattern (from AppContext)
```js
// Source: App.jsx — toast is re-exported on contextValue
const { toast } = useApp();
toast('12 workshops published');  // plain call, not toast.success()
// Project decision from Phase 5: plain toast() for WW brand alignment
```

### Table Column Layout Recommendation
```
Columns for DraftManager table:
1. Checkbox (select-all in header, individual in rows)
2. Title (text-left, font-medium)
3. Coach (derived from coachId → coaches lookup)
4. Day & Time (formatted with date-fns)
5. Type (workshop type, can be a pill badge)
6. Conflicts (badge if hasConflicts, blank otherwise)
```

### AppShell Layout Constraint
```jsx
// Source: AppShell.jsx — main has overflow-auto and p-6
// DraftManager renders inside <main className="overflow-auto bg-surface p-6">
// CoachRoster overrides this with its own flex column + h-full
// DraftManager should follow the same pattern:
<div className="flex flex-col h-full">
  {/* header bar */}
  {/* table area — flex-1 overflow-auto */}
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Portal-based modals (react-modal etc.) | Inline fixed positioning | Phase 8 established | No new deps; z-index management via consistent z-20/z-30 layering |
| Separate files for subcomponents | Inline module-level functions | Phase 8 established | Reduces file count; acceptable at small scale |

**Deprecated/outdated:**
- None for this phase. The project stack is current.

## Open Questions

1. **Should table columns be sortable?**
   - What we know: CoachRoster has sortable columns (Phase 8 pattern)
   - What's unclear: DRAF-01 only says "lists all draft workshops in a table" — no sort requirement stated
   - Recommendation: Omit sortable columns; requirements don't call for it and it adds complexity. Keep table simple unless added to requirements.

2. **Should the modal list the conflicting workshop titles or just the count?**
   - What we know: DRAF-05 says modal "warns about conflicts and allows override" — no detail on depth
   - What's unclear: Whether to name specific conflicting workshops or just count them
   - Recommendation: Show count only ("2 of your selected workshops have scheduling conflicts") for simplicity; matches the confirmation modal scope in the success criteria.

3. **Should there be a search/filter on the draft list?**
   - What we know: CoachRoster has search. DRAF-01 through DRAF-05 have no search requirement.
   - Recommendation: Omit. No requirement, and with 12 draft workshops, search is unnecessary.

## Sources

### Primary (HIGH confidence)
- `/src/data/workshops.js` — Status field casing confirmed ('Draft', 'Published', 'Cancelled'), draft workshop count (12), conflict-flagged drafts (ws-022, ws-028)
- `/src/utils/conflictEngine.js` — `buildConflictMap` API: parameters `(workshops, coaches)`, return `Map<id, {conflicts, ringColor, hasConflicts}>`
- `/src/App.jsx` — Context shape: `{coaches, setCoaches, workshops, setWorkshops, filters, setFilters, toast}`, route `/drafts` → `DraftManager`
- `/src/context/AppContext.jsx` — `useApp()` hook interface
- `/src/pages/CoachRoster.jsx` — Page structure pattern: flex-col h-full, useCallback for handlers, useEffect for Escape key, inline panel markup
- `/src/pages/DraftManager.jsx` — Existing stub confirmed (minimal placeholder, safe to fully replace)
- `/src/components/panel/WorkshopPanel.jsx` — Modal overlay pattern: `fixed inset-0 bg-black/30 z-20` + `fixed right-0 top-0 ... z-30`
- `/src/index.css` — Design tokens: ww-navy, ww-blue, ww-coral, ww-success, ww-warning, surface, surface-2, border
- `package.json` — No new packages required; all needed libs present

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` decision: "DraftManager reads workshops from useApp() + useMemo — never local state copy (prevents stale data)"

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libs verified in package.json, no new installs needed
- Architecture: HIGH — patterns directly derived from CoachRoster.jsx source code and conflictEngine.js API
- Data shape: HIGH — verified directly from workshops.js (status casing, draft count, conflict IDs)
- Pitfalls: HIGH for indeterminate checkbox (documented browser behavior); MEDIUM for stale selectedIds (low-risk in prototype but real edge case)

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (stable project, no external dependencies changing)
