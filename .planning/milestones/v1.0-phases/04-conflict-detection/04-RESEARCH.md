# Phase 4: Conflict Detection - Research

**Researched:** 2026-03-06
**Domain:** Pure JS conflict computation + React rendering integration (no external libraries needed)
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Conflict visibility on calendar cards
- Double-booked workshops get a **2px red ring** (`ring-2 ring-red-500`) around the card — overlays on top of the existing type-colored left border, doesn't replace it
- A small **AlertTriangle icon** (lucide-react, 12px, red) appears in the top-right corner of conflicted cards — visible at a glance without reading text
- Buffer violations get an **orange ring** (`ring-2 ring-orange-400`) + orange AlertTriangle — less severe than double-booking, visually distinct
- Availability conflicts same orange treatment as buffer — both are "soft" warnings vs double-booking's "hard" red
- The existing status dot stays unchanged — conflict indicators are additive, not replacements
- Cards with multiple conflict types show the **most severe** ring color (red > orange)

#### Time slot saturation
- When 4+ workshops overlap in the same 30-min slot, show a **thin amber bar** at the top of that time row spanning the full grid width
- Bar shows text: "4 concurrent workshops" (or whatever the count is) — small, `text-xs`, amber-700 on amber-50 background
- This is a **passive density indicator**, not an error — coordinators often intentionally run many sessions at once
- Threshold is 4 (configurable later, hardcoded for now)

#### Panel conflict alerts
- Conflicts render as a **red alert box** at the very top of the form (above all fields, below the status badge) — same position as the existing conflict stub from Phase 3
- Each conflict is a list item inside the alert: icon + one-line description
  - Double-booking: "Coach [Name] also assigned to [Workshop Title] at [time]"
  - Buffer violation: "Only [X] min gap before [Workshop Title] — recommend 15+ min buffer"
  - Availability conflict: "Coach [Name] not available on [Day] at [time]"
- Group by severity: double-bookings first (red icon), then buffer/availability (orange icon)
- Alert box uses the existing conflict stub pattern from WorkshopForm (`conflicts` prop) — just wire real data into it
- If no conflicts: nothing renders (no "No conflicts" message — clean when clean)

#### Conflict computation
- **Double-booking**: Same coachId (or coCoachId) appears in two workshops whose time ranges overlap (start < other.end AND end > other.start). Check both coach AND co-coach roles.
- **Buffer violation**: Same coach in two non-overlapping workshops with less than 15 minutes gap between end of one and start of next. 15 min threshold hardcoded.
- **Availability conflict**: Workshop scheduled on a day/time when the assigned coach has no availability slot covering it. Reuse the `getCoachAvailability` utility from Phase 3.
- **Time slot saturation**: Count workshops whose time range overlaps each 30-min grid slot. Flag slots with 4+ concurrent workshops.
- Conflicts computed from current workshops array on every render (no caching needed for prototype data size). Pure functions, no side effects.
- Cancelled workshops excluded from conflict detection

### Claude's Discretion
- Exact placement/padding of the saturation bar within the grid
- Whether to memoize conflict computation with useMemo (fine either way at prototype scale)
- Internal code structure of the conflict engine (single file vs split)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CONFLICT-01 | Coach double-booking: red border + warning icon on overlapping workshops | Interval overlap check (start < other.end AND end > other.start); `ring-2 ring-red-500` + AlertTriangle in WorkshopCard |
| CONFLICT-02 | Time slot saturation: amber bar when 4+ workshops at same time with count | 30-min slot bucketing loop over visibleWorkshops in CalendarGrid; absolute-positioned bar in time gutter row |
| CONFLICT-03 | Buffer violation: orange warning when coach has <15 min gap between workshops | Gap check on sorted, non-overlapping coach workshops; `ring-2 ring-orange-400` treatment |
| CONFLICT-04 | Availability conflict: warning when workshop scheduled during coach's unavailable time | Reuse existing `getCoachAvailability(coach, date, hour, minute)` from Phase 3 |
| CONFLICT-05 | Conflicts are informational (warnings, not blocking) — save/publish always allowed | No guard logic, no disabled states on action buttons; conflict data is display-only |
</phase_requirements>

---

## Summary

This phase is pure application logic — no new libraries, no new infrastructure. All conflict detection is a set of pure JavaScript functions that inspect the workshops array and coaches array to produce typed conflict objects. Those objects are then threaded into two existing render paths: WorkshopCard (visual ring + icon) and WorkshopForm (alert box).

The conflict engine is the new heart of this phase. It needs four functions: `getDoubleBookings`, `getBufferViolations`, `getAvailabilityConflicts`, and `getSaturatedSlots`. The first three return maps keyed by workshop ID so that WorkshopCard and WorkshopForm can look up conflicts by ID in O(1). The fourth returns an array of slot descriptors for CalendarGrid to render saturation bars.

The wiring pattern is straightforward: ScheduleCalendar already has access to the full `workshops` and `coaches` arrays from `useApp()`. It computes the conflict map once (optionally memoized), then passes conflict arrays down to CalendarGrid (which passes them to WorkshopCard) and to WorkshopPanel (which passes them to WorkshopForm). The WorkshopForm `conflicts` prop already exists — Phase 3 built the stub. Phase 4 just provides real data.

**Primary recommendation:** Build `src/utils/conflictEngine.js` as a single file of pure functions. Compute all conflict types in ScheduleCalendar, pass results down as props. No state, no context, no effects needed.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| date-fns | ^4.1.0 | parseISO, differenceInMinutes, format, getHours, getMinutes | Already imported throughout codebase; all needed functions already in use |
| lucide-react | ^0.577.0 | AlertTriangle icon (12px) for card conflict badges | Already imported in WorkshopForm; AlertTriangle already in use |
| React (useMemo) | ^19.2.0 | Optional memoization of conflict computation in ScheduleCalendar | Standard React hook, already used in CalendarGrid |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| getCoachAvailability (internal) | Phase 3 utility | Availability conflict detection | Import from `../../utils/coachAvailability` — reuse exactly as Phase 3 built it |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Pure JS interval math | A scheduling library (e.g., `@fullcalendar/*`) | Massive overkill; all interval logic is 3-10 lines of math |
| Single conflictEngine.js | Split into separate files per conflict type | No benefit at this scale; single file easier to reason about |
| useMemo for conflict map | Compute inline on every render | Either works; useMemo is marginally cleaner given coachMap already uses it |

**Installation:** No new packages needed. All dependencies already installed.

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── utils/
│   ├── coachAvailability.js    # Existing Phase 3 utility — import as-is
│   └── conflictEngine.js       # NEW: pure conflict detection functions
├── components/
│   ├── calendar/
│   │   ├── CalendarGrid.jsx    # MODIFY: accept conflictMap prop, render saturation bars
│   │   └── WorkshopCard.jsx    # MODIFY: accept conflicts prop, render ring + icon
│   └── panel/
│       └── WorkshopForm.jsx    # MODIFY: conflicts prop already exists, just receives real data
└── pages/
    └── ScheduleCalendar.jsx    # MODIFY: compute conflicts, pass down
```

### Pattern 1: Conflict Map by Workshop ID

**What:** The conflict engine returns a `Map<workshopId, ConflictResult>` where each entry lists all conflicts for that workshop. WorkshopCard and WorkshopForm both look up by ID.

**When to use:** Any time multiple components need to query "does workshop X have conflicts?" without repeating computation.

**Example:**
```javascript
// src/utils/conflictEngine.js

/**
 * @typedef {Object} Conflict
 * @property {'double-booking'|'buffer'|'availability'} type
 * @property {'red'|'orange'} severity  // red = double-booking, orange = buffer/availability
 * @property {string} message           // human-readable one-liner for panel
 * @property {string} workshopId        // the other workshop involved (double-booking/buffer)
 */

/**
 * @typedef {Object} ConflictResult
 * @property {Conflict[]} conflicts
 * @property {'red'|'orange'|null} ringColor   // most severe color for card ring
 * @property {boolean} hasConflicts
 */

/**
 * Build a Map<workshopId, ConflictResult> for all non-cancelled workshops.
 * @param {Object[]} workshops - All workshops from state
 * @param {Object[]} coaches   - All coaches
 * @returns {Map<string, ConflictResult>}
 */
export function buildConflictMap(workshops, coaches) {
  const active = workshops.filter(w => w.status !== 'Cancelled');
  const coachMap = new Map(coaches.map(c => [c.id, c]));
  const result = new Map();

  // Initialize all entries
  active.forEach(w => result.set(w.id, { conflicts: [], ringColor: null, hasConflicts: false }));

  // Double-booking detection
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i];
      const b = active[j];
      const sharedCoaches = getSharedCoaches(a, b);
      if (sharedCoaches.length === 0) continue;
      const overlap = timesOverlap(a.startTime, a.endTime, b.startTime, b.endTime);
      if (!overlap) continue;
      // record conflict on both workshops
      sharedCoaches.forEach(coachId => {
        const coachName = coachMap.get(coachId)?.name ?? coachId;
        addConflict(result, a.id, {
          type: 'double-booking', severity: 'red',
          message: `Coach ${coachName} also assigned to "${b.title}" at ${formatTime(b.startTime)}`
        });
        addConflict(result, b.id, {
          type: 'double-booking', severity: 'red',
          message: `Coach ${coachName} also assigned to "${a.title}" at ${formatTime(a.startTime)}`
        });
      });
    }
  }

  // Buffer violation detection
  // Group non-overlapping workshops by coach, sort by start, check gaps
  const byCoach = groupByCoach(active);
  byCoach.forEach((coachWorkshops, coachId) => {
    const coachName = coachMap.get(coachId)?.name ?? coachId;
    const sorted = [...coachWorkshops].sort((a, b) =>
      new Date(a.startTime) - new Date(b.startTime)
    );
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i];
      const b = sorted[i + 1];
      if (timesOverlap(a.startTime, a.endTime, b.startTime, b.endTime)) continue; // double-booking handles this
      const gapMin = differenceInMinutes(new Date(b.startTime), new Date(a.endTime));
      if (gapMin < 15) {
        addConflict(result, a.id, {
          type: 'buffer', severity: 'orange',
          message: `Only ${gapMin} min gap before "${b.title}" — recommend 15+ min buffer`
        });
        addConflict(result, b.id, {
          type: 'buffer', severity: 'orange',
          message: `Only ${gapMin} min gap after "${a.title}" — recommend 15+ min buffer`
        });
      }
    }
  });

  // Availability conflict detection
  active.forEach(w => {
    const coachIds = [w.coachId, w.coCoachId].filter(Boolean);
    coachIds.forEach(coachId => {
      const coach = coachMap.get(coachId);
      if (!coach) return;
      const start = parseISO(w.startTime);
      const { available, reason } = getCoachAvailability(coach, start, getHours(start), getMinutes(start));
      if (!available) {
        addConflict(result, w.id, {
          type: 'availability', severity: 'orange',
          message: `Coach ${coach.name} not available: ${reason}`
        });
      }
    });
  });

  return result;
}
```

### Pattern 2: Time Slot Saturation

**What:** For each 30-min grid slot (indexed by slot number 0-31), count how many active workshops have time ranges that overlap it. Return saturated slots for CalendarGrid to render bars.

**When to use:** CalendarGrid already iterates over SLOT_LINES (32 slots). Saturation bars are rendered in the same pass.

**Key insight:** A workshop overlaps slot `i` if its start is before the slot's end and its end is after the slot's start.
- Slot `i` represents: `GRID_START_HOUR * 60 + i * 30` to `GRID_START_HOUR * 60 + (i+1) * 30` minutes

```javascript
const SATURATION_THRESHOLD = 4;
const GRID_START_HOUR = 6;

/**
 * Returns an array of slot indices (0-31) where 4+ workshops overlap.
 * @param {Object[]} workshops - Active (non-cancelled) workshops for a specific day
 * @returns {Array<{slotIndex: number, count: number}>}
 */
export function getSaturatedSlots(dayWorkshops) {
  const saturated = [];
  for (let i = 0; i < 32; i++) {
    const slotStartMin = GRID_START_HOUR * 60 + i * 30;
    const slotEndMin = slotStartMin + 30;
    const count = dayWorkshops.filter(ws => {
      const wsStart = timeToMinutes(ws.startTime);
      const wsEnd = timeToMinutes(ws.endTime);
      return wsStart < slotEndMin && wsEnd > slotStartMin;
    }).length;
    if (count >= SATURATION_THRESHOLD) {
      saturated.push({ slotIndex: i, count });
    }
  }
  return saturated;
}
```

### Pattern 3: Ring Color Derivation

**What:** Cards have at most one ring, showing the most severe conflict. The severity hierarchy is: `red` (double-booking) > `orange` (buffer/availability) > no ring.

```javascript
// Inside buildConflictMap — after all conflicts are computed:
result.forEach((entry) => {
  if (entry.conflicts.some(c => c.severity === 'red')) {
    entry.ringColor = 'red';
  } else if (entry.conflicts.length > 0) {
    entry.ringColor = 'orange';
  }
  entry.hasConflicts = entry.conflicts.length > 0;
});
```

### Pattern 4: Prop Threading (no context needed)

**What:** ScheduleCalendar computes conflictMap from workshops + coaches, passes it to CalendarGrid as a prop. CalendarGrid passes per-workshop conflict arrays to WorkshopCard. WorkshopPanel passes conflicts for the selected workshop to WorkshopForm.

**Why not context:** Conflict data is derived state, not shared mutable state. Prop-drilling two levels is simpler and more predictable than context for display data.

```jsx
// ScheduleCalendar.jsx — compute once, pass down
const conflictMap = useMemo(
  () => buildConflictMap(workshops, coaches),
  [workshops, coaches]
);

// CalendarGrid receives conflictMap, WorkshopCard receives per-workshop conflicts
<CalendarGrid
  weekDays={weekDays}
  workshops={workshops}
  coaches={coaches}
  conflictMap={conflictMap}
  onWorkshopClick={openWorkshop}
  onSlotClick={openCreate}
/>

// WorkshopPanel (and WorkshopForm) receive the selected workshop's conflicts
<WorkshopPanel
  ...
  conflicts={conflictMap.get(selectedWorkshopId)?.conflicts ?? []}
/>
```

### Pattern 5: WorkshopCard Ring Rendering

**What:** Ring overlays on the existing card via Tailwind's `ring-*` utilities. The card currently uses `rounded` — ring utilities render flush inside the border-radius.

```jsx
// WorkshopCard.jsx
export default function WorkshopCard({ workshop, coachMap, conflicts = [], onClick }) {
  const ringClass =
    conflicts.some(c => c.severity === 'red')
      ? 'ring-2 ring-red-500'
      : conflicts.some(c => c.severity === 'orange')
      ? 'ring-2 ring-orange-400'
      : '';

  const hasConflicts = conflicts.length > 0;
  const iconColor = conflicts.some(c => c.severity === 'red') ? 'text-red-500' : 'text-orange-400';

  return (
    <div
      className={`h-full overflow-hidden rounded text-xs px-1.5 py-1 cursor-pointer hover:brightness-95 transition-all relative ${cardStyle} ${ringClass}`}
      onClick={...}
    >
      {/* Conflict icon — top-right corner, absolute position */}
      {hasConflicts && (
        <div className={`absolute top-0.5 right-0.5 ${iconColor}`}>
          <AlertTriangle size={12} />
        </div>
      )}
      {/* existing content unchanged */}
    </div>
  );
}
```

### Pattern 6: Saturation Bar in CalendarGrid

**What:** The saturation bar spans the full width of the grid body (across all 7 day columns) per 30-min row. It renders as an absolutely-positioned element inside the time gutter area or as a row overlay.

**Placement decision (Claude's discretion):** Render the saturation bar as a per-day overlay inside each day column, at the correct `top` position. The bar spans `right: 0, left: 0` within the day column div. This avoids restructuring the grid layout.

```jsx
// Inside CalendarGrid, inside the day column render:
const saturationMap = useMemo(() => {
  const result = new Map();
  weekDays.forEach(day => {
    const dayWs = visibleWorkshops.filter(ws => isSameDay(parseISO(ws.startTime), day));
    result.set(day.toISOString(), getSaturatedSlots(dayWs));
  });
  return result;
}, [visibleWorkshops, weekDays]);

// Inside the day column JSX, after slot lines and before workshop cards:
{saturationMap.get(day.toISOString())?.map(({ slotIndex, count }) => (
  <div
    key={slotIndex}
    className="absolute left-0 right-0 bg-amber-50 border-t border-amber-300 flex items-center px-1 z-10 pointer-events-none"
    style={{ top: slotIndex * 32, height: 32 }}
  >
    <span className="text-[9px] text-amber-700 font-medium">{count} concurrent</span>
  </div>
))}
```

### Anti-Patterns to Avoid

- **Mutating workshop objects to add conflict flags:** Conflict data is derived and ephemeral — never write it back to workshops state. Keep it in a local derived Map.
- **Computing conflicts inside WorkshopCard:** Cards render per-workshop with no access to sibling workshops. Computation must happen above CalendarGrid.
- **Using the existing `Conflict` status dot:** The `STATUS_DOT_COLORS.Conflict` entry in WorkshopCard is a pre-existing artifact. Do not set workshop.status = 'Conflict'. The status dot stays as-is (Draft/Published). Conflict rings are additive visual overlays.
- **Forgetting co-coach in double-booking:** The overlap check must cover coachId AND coCoachId for both workshops in a pair (four possible shared-coach combinations).
- **Double-counting buffer violations as double-bookings:** Skip buffer check when workshops overlap — only check gap when the workshops are temporally sequential (non-overlapping).
- **Including cancelled workshops in conflict detection:** Filter to `status !== 'Cancelled'` before all checks. ws-026 and ws-048 are cancelled and must be excluded.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Time overlap check | Custom date comparison | `start < other.end && end > other.start` (2 comparisons using raw Date objects from parseISO) | date-fns `parseISO` gives JS Date; subtraction works natively |
| Gap in minutes | Custom subtraction | `differenceInMinutes(new Date(b.startTime), new Date(a.endTime))` from date-fns | Already imported in CalendarGrid |
| Availability check | Rebuild hour parsing | `getCoachAvailability(coach, date, hour, minute)` from Phase 3 | Already verified, tested with mock data |
| Icon for conflict badge | Custom SVG | `AlertTriangle` from `lucide-react` | Already imported in WorkshopForm |

**Key insight:** The only algorithmic complexity is the O(n²) double-booking check across workshop pairs. With 45 workshops (~43 active), that's at most ~900 comparisons — trivial for JS, runs in microseconds.

---

## Common Pitfalls

### Pitfall 1: Conflict map not updating when workshops change
**What goes wrong:** If conflictMap is computed outside React's render cycle (e.g., at module level), it won't update when the user edits/creates workshops.
**Why it happens:** workshops state is in AppContext, updated via setWorkshops. If conflictMap isn't derived inside a component or hook, it won't react.
**How to avoid:** Compute in ScheduleCalendar with `useMemo([workshops, coaches])`. Since coaches never change in this prototype, workshops alone is sufficient as the dependency.
**Warning signs:** Conflict rings not appearing after creating a new workshop that causes a conflict.

### Pitfall 2: Co-coach conflicts missed or double-reported
**What goes wrong:** Only checking coachId-to-coachId pairs misses coach-as-coCoach scenarios. Reporting both directions without deduplication shows duplicate messages.
**Why it happens:** Each workshop has coachId AND coCoachId. Overlap check needs to compare all coaches on workshop A against all coaches on workshop B.
**How to avoid:**
```javascript
function getSharedCoaches(a, b) {
  const aCoaches = [a.coachId, a.coCoachId].filter(Boolean);
  const bCoaches = [b.coachId, b.coCoachId].filter(Boolean);
  return aCoaches.filter(id => bCoaches.includes(id));
}
```
Report conflict once per shared coach per pair — the function returns unique coach IDs.

### Pitfall 3: Saturation bar obscures workshop cards
**What goes wrong:** The amber bar renders on top of workshop cards, blocking click events and title text.
**Why it happens:** The bar is absolutely positioned in the same stacking context as the cards.
**How to avoid:** Add `pointer-events-none` to the saturation bar div so clicks pass through to cards/slots below.

### Pitfall 4: Ring class Tailwind JIT purge
**What goes wrong:** `ring-2 ring-red-500` and `ring-2 ring-orange-400` are dynamically assembled strings and get purged by Tailwind's JIT scanner.
**Why it happens:** Tailwind v4 (CSS-first mode) scans source for complete class strings. Partially dynamic strings (`ring-${color}`) are not detected.
**How to avoid:** Use a lookup object with complete class strings — same pattern as TYPE_CARD_STYLES in WorkshopCard.js:
```javascript
const CONFLICT_RING = {
  red: 'ring-2 ring-red-500',
  orange: 'ring-2 ring-orange-400',
  null: '',
};
// Then: className={`... ${CONFLICT_RING[ringColor ?? 'null']}`}
```
This is the established project pattern from [02-01] decision.

### Pitfall 5: WorkshopPanel doesn't receive workshops for conflict lookup
**What goes wrong:** WorkshopPanel only receives the selected workshop, not the full workshops array, so it can't compute conflicts itself.
**Why it happens:** WorkshopPanel is a display component; it has no access to AppContext in its current design.
**How to avoid:** Compute conflicts in ScheduleCalendar (which has workshops + coaches via useApp()) and pass the result array directly as a `conflicts` prop to WorkshopPanel, which passes it to WorkshopForm. The WorkshopForm `conflicts` prop already exists — just pass real data.

### Pitfall 6: Buffer check runs on overlapping workshops (producing wrong gap)
**What goes wrong:** `differenceInMinutes(b.startTime, a.endTime)` can be negative when workshops overlap, producing a confusing negative gap message like "-30 min gap".
**Why it happens:** Buffer violation only applies to sequential (non-overlapping) workshops.
**How to avoid:** Guard the buffer check with `if (timesOverlap(...)) continue` — skip to next pair when there is overlap (that's handled by double-booking detection).

---

## Code Examples

### Helper utilities for conflictEngine.js

```javascript
// Source: verified against date-fns v4 API (differenceInMinutes, parseISO, getHours, getMinutes all confirmed in codebase)

import { parseISO, differenceInMinutes, getHours, getMinutes, format } from 'date-fns';
import { getCoachAvailability } from './coachAvailability';

/** True if two time ranges overlap (half-open intervals) */
function timesOverlap(startA, endA, startB, endB) {
  return new Date(startA) < new Date(endB) && new Date(endA) > new Date(startB);
}

/** All coach IDs shared between two workshops */
function getSharedCoaches(a, b) {
  const aCoaches = [a.coachId, a.coCoachId].filter(Boolean);
  const bCoaches = [b.coachId, b.coCoachId].filter(Boolean);
  return aCoaches.filter(id => bCoaches.includes(id));
}

/** Group active workshops by coach (primary and co-coach separately) */
function groupByCoach(workshops) {
  const map = new Map();
  workshops.forEach(w => {
    [w.coachId, w.coCoachId].filter(Boolean).forEach(id => {
      if (!map.has(id)) map.set(id, []);
      map.get(id).push(w);
    });
  });
  return map;
}

/** Convert ISO time to total minutes from midnight */
function timeToMinutes(isoString) {
  const d = new Date(isoString);
  return d.getHours() * 60 + d.getMinutes();
}

/** Format ISO string to h:mm a (e.g., "10:30 AM") */
function formatTime(isoString) {
  return format(parseISO(isoString), 'h:mm a');
}

/** Add a conflict to an entry, updating ringColor */
function addConflict(resultMap, workshopId, conflict) {
  const entry = resultMap.get(workshopId);
  if (!entry) return;
  entry.conflicts.push(conflict);
  entry.hasConflicts = true;
  if (conflict.severity === 'red') entry.ringColor = 'red';
  else if (entry.ringColor !== 'red') entry.ringColor = 'orange';
}
```

### Mock data conflict verification

The 3 intentional conflicts in workshops.js have been verified:

| Conflict | Workshop IDs | Coach | Type | Verified |
|----------|-------------|-------|------|---------|
| A | ws-021, ws-022 | coach-005 (Diane Okafor) | Double-booking: 10:00–11:00 overlaps 10:30–11:30 | YES — `start021 < end022 && end021 > start022` is true |
| B | ws-033, ws-034 | coach-008 (Alicia Fontaine) | Double-booking: 14:00–15:00 overlaps 14:30–15:30 | YES — same interval math |
| C | ws-027, ws-028 | coach-012 (Thomas Erikson) | Buffer violation: 5 min gap (11:00–12:00 then 12:05–13:00) | YES — gap = 5 min < 15 min threshold |

Note: ws-034 also has coach-007 (Kevin Delacroix) as co-coach. ws-033 has no co-coach. The double-booking is coach-008 vs coach-008, not involving the co-coach. The detection correctly identifies this.

Note: ws-006 has coach-008 as co-coach (Monday evening). ws-033/ws-034 are Thursday. These are different days so no co-coach conflict across those. The `timesOverlap` check naturally handles this since dates differ.

### Availability conflict note

Checking ws-021 (coach-005, Tuesday 10:00 AM): coach-005 has availability `{ day: 'tuesday', start: '07:00', end: '15:00' }`. The workshop starts at 10:00, which is within 07:00–15:00, so NO availability conflict. That's correct — the conflicts in the mock data are intentionally limited to double-booking and buffer violations.

The availability conflict detection will still work for edge cases where a coordinator assigns an unavailable coach via the panel form.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Conflict as a workshop status | Conflict as derived overlay data | This phase decision | Status stays as Draft/Published/Cancelled; conflict is computed on the fly |
| Global conflict state in context | Conflict map derived locally in ScheduleCalendar | This phase design | No state complexity, no stale data issues |

**Deprecated/outdated:**
- `STATUS_DOT_COLORS.Conflict` in WorkshopCard: This entry exists but must NOT be used for Phase 4 conflicts. It was a placeholder from Phase 2. The conflict ring + icon is the correct pattern per CONTEXT.md.

---

## Open Questions

1. **Should WorkshopPanel receive the full conflictMap or just the selected workshop's conflicts?**
   - What we know: WorkshopPanel currently takes no conflicts prop; WorkshopForm has `conflicts = []`.
   - What's unclear: Should the panel re-derive from a map (for future flexibility) or receive a pre-filtered array?
   - Recommendation: Pass pre-filtered array `conflictMap.get(selectedWorkshopId)?.conflicts ?? []` — simpler, WorkshopPanel doesn't need to know about the map structure.

2. **Should conflictMap be computed in ScheduleCalendar or passed from App.jsx?**
   - What we know: Only ScheduleCalendar renders calendars and panels. CoachRoster and DraftManager don't need conflict data yet.
   - Recommendation: Compute in ScheduleCalendar. If other pages need it in Phase 6+, move to context then.

3. **Where exactly does the saturation bar render within CalendarGrid?**
   - What we know: The bar must span the full width of each day column. The day column div is `relative` with `height: GRID_HEIGHT`. Slot lines render at `i * 32` px. `PX_PER_MIN = 64/60 ≈ 1.067`. 30 min = 32px exactly.
   - Recommendation (Claude's discretion): Render bar inside each day column at `top: slotIndex * 32, height: 32`. `pointer-events-none` to let clicks through. The bar appears at the same vertical position in all 7 columns simultaneously since each column renders its own bars independently — this naturally creates a "row" effect across the grid.

---

## Sources

### Primary (HIGH confidence)
- Codebase inspection — all files in `src/` read directly; patterns confirmed from existing code
- workshops.js — 3 mock conflicts verified with runtime JS execution (node -e)
- CalendarGrid.jsx — slot coordinate system confirmed: `SLOT_LINES = 32 slots`, `i * 32 px`, `PX_PER_HOUR = 64`, `30 min = 32px`
- WorkshopForm.jsx — confirmed `conflicts = []` prop already exists and renders alert box
- WorkshopCard.jsx — confirmed `ring-*` classes not yet used; `relative` positioning not set (must add)
- coachAvailability.js — confirmed `getCoachAvailability(coach, date, hour, minute)` interface

### Secondary (MEDIUM confidence)
- Tailwind v4 JIT purge behavior for dynamic classes — inferred from [02-01] STATE.md decision ("Static TYPE_CARD_STYLES lookup object (not dynamic interpolation) ensures Tailwind JIT includes all border/bg classes at build time"). Same principle applies to ring classes.

### Tertiary (LOW confidence)
- None — all findings are from direct codebase inspection

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries; all tools already in codebase
- Architecture: HIGH — data flow is clear from reading existing components; prop threading path is fully verified
- Conflict algorithms: HIGH — math verified with Node.js execution against actual mock data
- Pitfalls: HIGH — most derived from reading existing code patterns and [02-01] Tailwind JIT decision

**Research date:** 2026-03-06
**Valid until:** N/A — this is internal codebase analysis, not external library research. Valid until codebase changes.
