# Phase 10: Availability Overlay - Research

**Researched:** 2026-03-09
**Domain:** Calendar UI overlay rendering, CSS positioning, React state toggle
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| OVER-01 | Coordinator can toggle a coach availability overlay on the calendar grid | Toggle button in nav bar; boolean state in ScheduleCalendar; prop-drilled to CalendarGrid |
| OVER-02 | Overlay renders semi-transparent colored bands behind workshop cards showing each coach's available hours — bands do not obscure or interfere with clicking workshop cards | Absolutely-positioned divs with `pointer-events-none` and `z-index` below workshop cards; top/height computed from existing `PX_PER_HOUR`/`PX_PER_MIN` constants; color assigned per coach from a fixed palette |
</phase_requirements>

---

## Summary

Phase 10 adds a visual overlay to the calendar grid that shows each coach's available time as semi-transparent colored bands behind the workshop cards. The feature is behind a toggle button in the nav bar; when off, the calendar is unchanged. The two requirements (OVER-01 and OVER-02) map cleanly to two concerns: toggle state management and overlay rendering.

The existing `CalendarGrid.jsx` already has all the infrastructure needed. It uses `position: relative` day columns with absolute-positioned elements (`SLOT_LINES`, saturation bars, workshop cards) all stacked via `z-index`. The overlay bands fit into this same layer model as absolutely-positioned divs placed below workshop cards (`z-0` or `z-1`). The grid height and time-to-pixel math (`PX_PER_HOUR = 64`, `GRID_START_HOUR = 6`) is already established — band `top` and `height` values are computed from the same formula used for workshop cards.

Coach color assignment is the one design decision that needs a plan. The project uses Tailwind colors (hardcoded in `WorkshopCard.jsx`) with no existing per-coach color mapping. A fixed palette of 10–12 Tailwind semi-transparent background colors (e.g. `bg-blue-100/60`, `bg-purple-100/60`) assigned by coach index or ID hash is sufficient and safe for Tailwind JIT (requires a static lookup table, not dynamic class construction).

**Primary recommendation:** Add a boolean `showOverlay` state to `ScheduleCalendar`, pass it to `CalendarGrid`, compute availability bands per day per coach inside CalendarGrid using the existing `GRID_START_HOUR`/`PX_PER_HOUR` constants, render as `pointer-events-none` absolute divs at `z-0`, and assign coach colors from a static Tailwind class lookup table.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React (useState) | Already installed | Toggle state for overlay on/off | Consistent with all other boolean UI states in this codebase |
| date-fns (format) | Already installed | Convert availability `day` string to day-of-week for matching | Already used in `coachAvailability.js` for the same purpose |
| Tailwind CSS v4 | Already installed (@tailwindcss/vite) | Semi-transparent band colors via static class lookup | All styling in this project uses Tailwind |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | Already installed | Icon for toggle button (e.g. `Eye` / `EyeOff`) | Consistent with ChevronLeft/ChevronRight already in nav bar |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Static Tailwind class lookup table | Dynamic inline styles (rgba) | Inline styles work fine but bypass Tailwind consistency; static lookup is the established pattern in this codebase (see `TYPE_CARD_STYLES`, `STATUS_DOT_COLORS` in WorkshopCard.jsx) |
| Per-coach color by index mod palette | Per-coach color by ID hash | Both work; index mod is simpler and deterministic given the 18-coach fixed dataset |

**Installation:** No new packages required. All libraries are already present.

---

## Architecture Patterns

### Recommended Project Structure

No new files are strictly required. All changes fit into existing files:

```
src/
├── pages/
│   └── ScheduleCalendar.jsx    # Add showOverlay state + toggle button in nav bar
└── components/
    └── calendar/
        └── CalendarGrid.jsx    # Accept showOverlay prop; render availability bands per day
```

One optional utility addition (follows project pattern of pure utility modules):

```
src/
└── utils/
    └── availabilityBands.js    # (optional) Pure fn: coaches + day -> band {top, height, color} array
```

### Pattern 1: Toggle State in ScheduleCalendar

**What:** A single boolean `showOverlay` state owned in `ScheduleCalendar`, toggled by a button in the nav bar, and passed as a prop to `CalendarGrid`.

**When to use:** All UI toggle state in this codebase lives at the page level (not AppContext) unless it must persist across pages. The overlay only affects the calendar view; it has no cross-page relevance.

**Example:**
```jsx
// In ScheduleCalendar.jsx
const [showOverlay, setShowOverlay] = useState(false);

// In nav bar JSX
<button
  onClick={() => setShowOverlay((v) => !v)}
  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded border border-border transition-colors ${
    showOverlay ? 'bg-ww-blue text-white border-ww-blue' : 'hover:bg-surface-2'
  }`}
  aria-label="Toggle availability overlay"
>
  {showOverlay ? <EyeOff size={16} /> : <Eye size={16} />}
  <span>Availability</span>
</button>

// Pass to CalendarGrid
<CalendarGrid
  ...
  showOverlay={showOverlay}
/>
```

### Pattern 2: Availability Band Computation

**What:** For each day column and each coach, convert the coach's availability slot for that day into `{ top, height }` pixel values using the same math as `getEventPosition`.

**When to use:** Inside CalendarGrid, in a `useMemo` keyed on `[coaches, weekDays, showOverlay]`. Only compute when overlay is on (short-circuit when `showOverlay === false`).

**Data shape verified from coaches.js:**
```js
coach.availability = [
  { day: 'monday', start: '09:00', end: '17:00' },
  // ...
]
```
- `day` is always lowercase full day name ('monday', 'tuesday', ..., 'saturday', 'sunday')
- `start` and `end` are always `'HH:MM'` strings (24-hour, zero-padded)
- A coach may have zero or multiple slots for a given day (data shows at most one per day, but the computation should handle multiple)
- Inactive coaches have availability entries but should be skipped (status === 'inactive')

**Example band computation:**
```js
// availabilityBands.js (pure utility)
import { format } from 'date-fns';

const GRID_START_HOUR = 6;
const PX_PER_HOUR = 64;
const PX_PER_MIN = PX_PER_HOUR / 60;
const GRID_HEIGHT = (22 - 6) * PX_PER_HOUR; // 1024px — must match CalendarGrid

function parseTimeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export function getAvailabilityBands(coaches, day) {
  const dayName = format(day, 'EEEE').toLowerCase();
  const bands = [];

  coaches.forEach((coach, idx) => {
    if (coach.status === 'inactive') return;
    const slots = coach.availability.filter((a) => a.day === dayName);
    slots.forEach((slot) => {
      const startMins = parseTimeToMinutes(slot.start);
      const endMins = parseTimeToMinutes(slot.end);
      const gridStartMins = GRID_START_HOUR * 60;

      // Clamp to grid bounds
      const clampedStart = Math.max(startMins, gridStartMins);
      const clampedEnd = Math.min(endMins, 22 * 60);
      if (clampedEnd <= clampedStart) return;

      const top = (clampedStart - gridStartMins) * PX_PER_MIN;
      const height = (clampedEnd - clampedStart) * PX_PER_MIN;

      bands.push({ coachId: coach.id, coachIndex: idx, top, height });
    });
  });

  return bands;
}
```

### Pattern 3: Per-Coach Color Assignment (Static Lookup)

**What:** Assign each coach a semi-transparent Tailwind background color from a fixed palette, by array index mod palette length.

**Why static lookup:** The project already uses static class objects for type and status colors (`TYPE_CARD_STYLES`, `STATUS_DOT_COLORS`, `CONFLICT_RING` in WorkshopCard.jsx). Dynamic class construction like `` `bg-${color}-100/60` `` is not safe with Tailwind JIT — classes must appear verbatim in source.

**Example:**
```js
// In CalendarGrid.jsx (or availabilityBands.js)
const COACH_OVERLAY_COLORS = [
  'bg-blue-200/50',
  'bg-purple-200/50',
  'bg-green-200/50',
  'bg-rose-200/50',
  'bg-amber-200/50',
  'bg-teal-200/50',
  'bg-orange-200/50',
  'bg-cyan-200/50',
  'bg-indigo-200/50',
  'bg-lime-200/50',
  'bg-pink-200/50',
  'bg-sky-200/50',
];
// Usage: COACH_OVERLAY_COLORS[coachIndex % COACH_OVERLAY_COLORS.length]
```

The `ww-blue` and `ww-coral` brand colors are not defined as Tailwind utility classes that support `/opacity` modifier syntax in Tailwind v4 with @theme CSS variables. Use standard Tailwind palette colors (blue-200, purple-200, etc.) for the overlay — these are readable and familiar.

### Pattern 4: Band Rendering in CalendarGrid

**What:** Render band divs inside each day column, below workshop cards, with `pointer-events-none` to prevent click interception.

**Layer model in each day column (current):**
```
z-auto  — day column div (position: relative)
z-auto  — SLOT_LINES (border divs, no z-index)
z-10    — saturation bars (amber overlay, pointer-events-none)
z-1..n  — workshop card wrappers (zIndex: idx + 1)
```

**Overlay bands must sit BELOW workshop cards.** Since workshop cards start at `zIndex: 1`, bands should be `z-0` (or no explicit z-index, relying on DOM order before the cards). `pointer-events-none` is mandatory.

**Example JSX inside each day column:**
```jsx
{/* Availability bands — rendered before workshop cards so they sit below in z-order */}
{showOverlay && availabilityBands.get(day.toISOString())?.map((band) => (
  <div
    key={`avail-${band.coachId}`}
    className={`absolute left-0 right-0 pointer-events-none ${COACH_OVERLAY_COLORS[band.coachIndex % COACH_OVERLAY_COLORS.length]}`}
    style={{ top: band.top, height: band.height, zIndex: 0 }}
    aria-hidden="true"
  />
))}
```

### Anti-Patterns to Avoid

- **Dynamic Tailwind class construction:** `` `bg-${color}-200/50` `` will be purged at build time. Use a static lookup object.
- **Putting showOverlay in AppContext:** The overlay is local to the calendar view. AppContext is for state that must persist across navigation (filters, workshops, coaches). A local useState is correct.
- **Rendering bands above workshop cards:** Using z-index >= workshop card z-indices (1+) would put the overlay on top. Always render bands before cards in DOM order and use z-index: 0.
- **Not clamping to grid bounds:** A coach available from 05:00 would produce a negative `top` value. Always clamp availability hours to `[GRID_START_HOUR, GRID_END_HOUR]` (6–22).
- **Re-computing bands without memoization:** 18 coaches × 7 days = 126 band computations per render. Wrap in `useMemo` keyed on `[coaches, weekDays, showOverlay]`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Time string to pixel conversion | Custom parser | Existing `GRID_START_HOUR`, `PX_PER_HOUR`, `PX_PER_MIN` constants in CalendarGrid | Already defined; copy/import them |
| Day name lookup | Custom date logic | `date-fns format(day, 'EEEE').toLowerCase()` | Already used in `coachAvailability.js` for exactly this |
| Coach color management | Per-coach color state | Static palette array, index mod length | 18 coaches fit in any 12-color palette with repetition; no dynamic assignment needed |

**Key insight:** The hardest part of this phase (time-to-pixel math, day name matching) is already solved in the codebase. This phase is primarily DOM structure and CSS layering.

---

## Common Pitfalls

### Pitfall 1: Tailwind JIT Class Purging

**What goes wrong:** Dynamic class names like `` `bg-${colorVar}-200/50` `` are not present verbatim in source, so Tailwind's JIT compiler strips them. The overlay bands render with no background color.

**Why it happens:** Tailwind v4 with `@tailwindcss/vite` scans source for complete class strings at build time. Dynamically constructed strings are invisible to the scanner.

**How to avoid:** Define a complete static array of class strings. Every string must appear verbatim. This is the documented Tailwind pattern — same approach as `TYPE_CARD_STYLES` in WorkshopCard.jsx.

**Warning signs:** Colors work in dev (sometimes), fail in production build, or fail intermittently.

### Pitfall 2: Overlay Bands Blocking Clicks

**What goes wrong:** Users can't click on workshop cards because the overlay band's DOM element captures pointer events.

**Why it happens:** Absolutely-positioned divs receive pointer events by default. Even with `z-index: 0`, a wide absolute div in the same column intercepts clicks if it's the topmost element at that screen position.

**How to avoid:** Add `pointer-events-none` class to every band div. This is the same pattern used for saturation bars (`pointer-events-none` in CalendarGrid line 157).

**Warning signs:** Clicking a workshop card does nothing; clicking the column background opens create-workshop form when a band is visible.

### Pitfall 3: Grid Constant Duplication

**What goes wrong:** If `availabilityBands.js` defines its own `GRID_START_HOUR = 6` / `PX_PER_HOUR = 64` separately from CalendarGrid, they can diverge.

**Why it happens:** Copy-paste without extracting shared constants.

**How to avoid:** Two valid solutions: (A) Export the constants from CalendarGrid and import in the utility (though mixing component and utility exports is awkward). (B) Define the constants in the utility file and import them into CalendarGrid — utility is already a pure module. Either works; pick one and note it in the plan.

**Warning signs:** Band positions are off by a fixed pixel offset, or band heights don't match workshop card heights for the same duration.

### Pitfall 4: Off-by-One on Grid Clamp

**What goes wrong:** A coach available until 22:00 exactly (grid end) renders a band that runs to or past the bottom of the grid, causing overflow or visual glitch.

**Why it happens:** Grid height is `(GRID_END_HOUR - GRID_START_HOUR) * PX_PER_HOUR = 1024px`. A band with `top + height = 1024` is exactly flush, which is fine. A band with `top + height > 1024` overflows.

**How to avoid:** Clamp `endMins` to `GRID_END_HOUR * 60` (22 * 60 = 1320 minutes) before computing height.

### Pitfall 5: Multiple Availability Slots Per Day (Future-Proofing)

**What goes wrong:** If a coach has two slots on the same day (not in current data, but possible), rendering overlapping bands looks broken.

**Why it happens:** The `.filter(a => a.day === dayName)` returns all slots, producing two overlapping divs.

**How to avoid:** Current data has at most one slot per coach per day — verified from coaches.js. The computation iterates all matching slots, so multiple bands are handled correctly as separate divs. They will overlap visually, but since they're semi-transparent, this is acceptable and arguably correct (both time ranges are available).

---

## Code Examples

Verified patterns from existing codebase:

### Existing time-to-pixel math (CalendarGrid.jsx, lines 21-28)
```js
// Source: /src/components/calendar/CalendarGrid.jsx
const GRID_START_HOUR = 6;
const GRID_END_HOUR = 22;
const PX_PER_HOUR = 64;
const PX_PER_MIN = PX_PER_HOUR / 60;
const GRID_HEIGHT = (GRID_END_HOUR - GRID_START_HOUR) * PX_PER_HOUR; // 1024px

function getEventPosition(startTimeISO, endTimeISO) {
  const start = parseISO(startTimeISO);
  const end = parseISO(endTimeISO);
  const startMinutes = (getHours(start) - GRID_START_HOUR) * 60 + getMinutes(start);
  const top = startMinutes * PX_PER_MIN;
  const durationMinutes = differenceInMinutes(end, start);
  const rawHeight = durationMinutes * PX_PER_MIN;
  const height = Math.min(Math.max(rawHeight, 20), GRID_HEIGHT - top);
  return { top, height };
}
```

### Existing day name pattern (coachAvailability.js, line 18)
```js
// Source: /src/utils/coachAvailability.js
const dayName = format(date, 'EEEE').toLowerCase(); // 'monday', 'tuesday', etc.
const slot = coach.availability.find((a) => a.day === dayName);
```

### Existing static color lookup pattern (WorkshopCard.jsx, lines 4-10)
```js
// Source: /src/components/calendar/WorkshopCard.jsx
const TYPE_CARD_STYLES = {
  'Weekly Connection': 'bg-blue-50 border-l-4 border-ww-blue',
  'All In': 'bg-purple-50 border-l-4 border-purple-600',
  // ...
};
// Usage: const cardStyle = TYPE_CARD_STYLES[workshop.type] ?? 'bg-slate-50 ...'
```

### Existing pointer-events-none overlay pattern (CalendarGrid.jsx, lines 154-162)
```jsx
// Source: /src/components/calendar/CalendarGrid.jsx
{saturationMap.get(day.toISOString())?.map(({ slotIndex, count }) => (
  <div
    key={`sat-${slotIndex}`}
    className="absolute left-0 right-0 bg-amber-50 border-t border-amber-300 flex items-center px-1 z-10 pointer-events-none"
    style={{ top: slotIndex * 32, height: 32 }}
  >
    <span className="text-[9px] text-amber-700 font-medium">{count} concurrent</span>
  </div>
))}
```

### Existing toggle button pattern (ScheduleCalendar.jsx view mode tabs)
```jsx
// Source: /src/pages/ScheduleCalendar.jsx — view mode toggle for reference
<button
  onClick={() => setViewMode(value)}
  className={`px-4 py-1.5 text-sm font-medium rounded transition-colors ${
    viewMode === value
      ? 'bg-ww-blue text-white'
      : 'text-slate-600 hover:bg-surface-2'
  }`}
>
  {label}
</button>
```

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|------------------|-------|
| CSS `opacity` on parent to dim overlay | `bg-color/50` Tailwind opacity modifier on the band div itself | Tailwind v4 with CSS `@theme` supports `/opacity` on standard palette colors but not on custom CSS variable colors like `ww-blue` |
| SVG or canvas for time overlays | Absolutely-positioned divs with `pointer-events-none` | Simpler, easier to maintain, sufficient for this use case |

---

## Open Questions

1. **Which coaches show in the overlay?**
   - What we know: All 18 coaches are in `coaches.js`; 2 are inactive (coach-014, coach-017)
   - What's unclear: Should inactive coaches be excluded from the overlay? Should coaches without availability on the displayed day simply have no band (silently skip)?
   - Recommendation: Skip inactive coaches (status === 'inactive') and skip coaches with no availability slot for that day. No placeholder band needed — absence of a band is self-explanatory.

2. **Should the overlay respect the active coach filter?**
   - What we know: Sidebar coach filter is in AppContext `filters.coaches` array; CalendarGrid already receives `anyFilterActive` and `filteredIds`
   - What's unclear: When a coordinator filters to show only "Sarah Mitchell", should the overlay show only Sarah's availability bands, or all coaches?
   - Recommendation: Scope the overlay to filtered coaches when a coach filter is active. This makes the overlay genuinely useful when filtering. Implementation: in CalendarGrid, if `anyFilterActive && filters.coaches.length > 0`, only compute bands for coaches in `filters.coaches`. CalendarGrid would need access to `filters` from `useApp()` (it already has coachMap via prop; it can call `useApp()` directly, or ScheduleCalendar can pass a filtered coaches array).

3. **How wide are individual coach bands?**
   - What we know: The requirement says bands appear "in each day column" showing coach available hours — no width sub-division is specified
   - What's unclear: Full column width (stacked, semi-transparent bands overlap) vs. side-by-side (each coach gets 1/N of column width)?
   - Recommendation: Full column width, stacked with semi-transparency. With 18 coaches potentially overlapping, colors blend naturally. Side-by-side sub-columns would require complex width math. The success criteria says "semi-transparent colored bands" without mentioning side-by-side arrangement.

4. **GRID_START_HOUR / PX_PER_HOUR duplication across CalendarGrid and a new utility**
   - What we know: These constants are currently local to CalendarGrid.jsx
   - Recommendation: Extract them to a shared constants file (e.g. `src/utils/calendarConstants.js`) that both CalendarGrid and availabilityBands can import. This is one additional file but prevents constant drift.

---

## Sources

### Primary (HIGH confidence)

- `/Users/adam/ww-workshop-scheduler/src/components/calendar/CalendarGrid.jsx` — Grid structure, z-index layering, existing overlay pattern (saturation bars), time-to-pixel constants
- `/Users/adam/ww-workshop-scheduler/src/data/coaches.js` — Availability data shape: `availability[].{day, start, end}` confirmed; 18 coaches; 2 inactive
- `/Users/adam/ww-workshop-scheduler/src/utils/coachAvailability.js` — Day name conversion pattern (`format(date, 'EEEE').toLowerCase()`)
- `/Users/adam/ww-workshop-scheduler/src/pages/ScheduleCalendar.jsx` — Nav bar structure, AppContext usage, prop passing pattern to CalendarGrid
- `/Users/adam/ww-workshop-scheduler/src/components/calendar/WorkshopCard.jsx` — Static Tailwind class lookup pattern
- `/Users/adam/ww-workshop-scheduler/src/index.css` — Tailwind v4 @theme variables; confirmed brand colors are CSS variables (not Tailwind palette names)
- Tailwind v4 JIT behavior — static class requirement is a well-established behavior; confirmed by the existing static lookup objects in the codebase

### Secondary (MEDIUM confidence)

- General knowledge of `pointer-events-none` CSS behavior for non-interactive overlays — standard, well-documented CSS property

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — No new libraries; all tools already in use
- Architecture: HIGH — Pattern directly mirrors existing saturation bar overlay in CalendarGrid
- Availability data shape: HIGH — Directly read from source (`coaches.js`; also noted as verified in STATE.md pending todos)
- Pitfalls: HIGH — Most derived from reading actual source code (not hypothesis)
- Coach filter interaction: MEDIUM — Open question; recommendation is an interpretation of success criteria wording

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (stable codebase, no external dependencies changing)
