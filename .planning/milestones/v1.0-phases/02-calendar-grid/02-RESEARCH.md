# Phase 2: Calendar Grid - Research

**Researched:** 2026-03-05
**Domain:** React calendar grid, CSS absolute positioning for time-based events, date-fns week navigation, Tailwind color mapping
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CAL-01 | Weekly calendar grid (Mon-Sun columns, 6:00 AM - 10:00 PM ET rows, 30-min increments) | Absolute-positioned event blocks over a relative-positioned day column; 16 hours × 64px/hr = 1024px grid height; 32px per 30-min slot row |
| CAL-02 | View toggles: Day \| Week \| Month (Week default, others simplified) | Simple `viewMode` state string in ScheduleCalendar; Week renders CalendarGrid; Day/Month render placeholder tabs |
| CAL-03 | Week navigation with left/right arrows and "Today" button | `currentWeekStart` state (Date); `addWeeks`/`subWeeks` from date-fns; "Today" resets to `startOfWeek(new Date(), { weekStartsOn: 1 })` |
| CAL-04 | Header displays "Week of [date range]" with nav arrows | `format(weekStart, 'MMM d') + ' - ' + format(weekEnd, 'MMM d, yyyy')` via date-fns; ChevronLeft/ChevronRight from lucide-react |
| CAL-05 | Workshop events appear as colored blocks on the calendar grid | `position: absolute`, `top` = `(startMinsFromGridStart * PX_PER_MIN)px`, `height` = `(durationMins * PX_PER_MIN)px`; day column has `position: relative` |
| CARD-01 | Cards show time, title, coach name, co-coach (if applicable) | `format(parseISO(startTime), 'h:mm a')` from date-fns; coach name from `coachMap.get(coachId)`; conditional co-coach display |
| CARD-02 | Status indicator dot/badge: Draft (yellow), Published (green), Conflict (red pulse) | 8px circle `rounded-full`; `bg-ww-warning` for Draft, `bg-ww-success` for Published; Conflict deferred to Phase 4 |
| CARD-03 | Workshop type color coding: Weekly=blue, All In=purple, Special Event=coral, Coaching Corner=teal, Movement/Fitness=green | Full-class lookup object (not dynamic string interpolation); standard Tailwind palette colors for purple/teal/green |
</phase_requirements>

---

## Summary

Phase 2 builds the core visual interface: a weekly calendar grid where workshop events appear as colored, absolutely-positioned blocks. No new npm packages are required — all needed tools (date-fns, lucide-react, Tailwind CSS v4) are already installed and configured from Phase 1.

The calendar grid uses a proven layout pattern: a sticky day-name header row plus a vertically scrollable body that contains a time-axis gutter (left) and seven day columns (right). Each day column is `position: relative` with a fixed pixel height (1024px for 16 hours at 64px/hour). Workshop event cards are `position: absolute` within their day column, with `top` and `height` computed from the workshop's start time and duration in minutes. This is the same approach used by Google Calendar and FullCalendar.

Week navigation is pure React state: `currentWeekStart` holds a Date object (always Monday). Advancing/retreating weeks uses `addWeeks`/`subWeeks` from date-fns. The "Today" button resets to `startOfWeek(new Date(), { weekStartsOn: 1 })`. Workshop filtering by week uses `isSameDay(parseISO(ws.startTime), dayDate)` to assign workshops to their correct day column. Color coding uses a full-class lookup object to satisfy Tailwind's JIT scanner requirement — dynamic class string interpolation will not work.

**Primary recommendation:** Build three focused components — `CalendarGrid` (grid structure + time axis), `WorkshopCard` (colored event block with status dot and coach info), and a nav/header bar in `ScheduleCalendar` (week navigation + view toggle tabs). No new packages needed; all computation is pure date-fns and JavaScript.

---

## Standard Stack

### Core (All Already Installed — No New Packages Needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| date-fns | ^4.1.0 | Week math, time formatting, event positioning | Already in project; verified: startOfWeek, addWeeks, subWeeks, addDays, format, parseISO, isSameDay, differenceInMinutes, getHours, getMinutes all confirmed present |
| lucide-react | ^0.577.0 | Navigation icons (ChevronLeft, ChevronRight, Calendar) | Already in project; all three icons verified present |
| tailwindcss | ^4.2.1 | Utility classes for layout and color | Already configured with WW brand tokens; standard colors (purple-600, teal-500, green-500) available from default palette |
| React built-ins | 19.x | useState, useMemo, useCallback, useContext | No external state library needed |

**Installation:** No new packages required.

---

## Architecture Patterns

### Recommended Component Structure

```
src/
├── components/
│   └── calendar/
│       ├── CalendarGrid.jsx      # Plan 02-01: grid shell, time axis, day columns, slot rows
│       └── WorkshopCard.jsx      # Plan 02-02: event block, type color, status dot, coach info
├── pages/
│   └── ScheduleCalendar.jsx      # Plan 02-03: week nav state, view toggle, header display
```

No additional sub-components (TimeAxis, DayColumn) are needed as separate files — they are simple enough to be inline JSX within CalendarGrid.

### Pattern 1: Event Pixel Positioning

**What:** Each workshop event card is `position: absolute` inside a `position: relative` day column. Top and height are computed from time, not percentage.
**Why pixels over percentages:** Pixel math avoids floating point rounding errors and is easier to reason about. A fixed `PX_PER_HOUR` constant controls the entire grid scale.

**Constants:**
```js
const GRID_START_HOUR = 6;    // 6:00 AM
const GRID_END_HOUR = 22;     // 10:00 PM
const PX_PER_HOUR = 64;       // 64px per hour
const PX_PER_MIN = PX_PER_HOUR / 60;  // ~1.067px per minute
const GRID_HEIGHT = (GRID_END_HOUR - GRID_START_HOUR) * PX_PER_HOUR; // 1024px
```

**Positioning function:**
```js
// Source: Verified with date-fns v4 getHours/getMinutes/differenceInMinutes
import { parseISO, getHours, getMinutes, differenceInMinutes } from 'date-fns';

function getEventPosition(startTimeISO, endTimeISO) {
  const start = parseISO(startTimeISO);
  const end = parseISO(endTimeISO);
  const startMinsFromGridStart =
    (getHours(start) - GRID_START_HOUR) * 60 + getMinutes(start);
  const durationMins = differenceInMinutes(end, start);
  return {
    top: Math.round(startMinsFromGridStart * PX_PER_MIN),
    height: Math.max(Math.round(durationMins * PX_PER_MIN), 20), // min 20px
  };
}
```

**Verified sample outputs (64px/hr):**
- 7:00 AM - 8:00 AM (60 min) → top: 64px, height: 64px
- 9:00 AM - 10:30 AM (90 min) → top: 192px, height: 96px
- 12:00 PM - 12:30 PM (30 min) → top: 384px, height: 32px
- 8:00 PM - 9:30 PM (90 min) → top: 896px, height: 96px

### Pattern 2: Week Navigation State

**What:** `currentWeekStart` useState holds the Monday Date of the displayed week. All seven day columns derive from this single date.

```jsx
// Source: date-fns v4 — all functions confirmed present
import { startOfWeek, addWeeks, subWeeks, addDays, format, isSameWeek } from 'date-fns';

const [currentWeekStart, setCurrentWeekStart] = useState(
  () => startOfWeek(new Date(), { weekStartsOn: 1 })
);

const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
const weekEnd = weekDays[6];

const headerText = format(currentWeekStart, 'MMM d') + ' – ' + format(weekEnd, 'MMM d, yyyy');

const prevWeek = () => setCurrentWeekStart(d => subWeeks(d, 1));
const nextWeek = () => setCurrentWeekStart(d => addWeeks(d, 1));
const goToToday = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

const isCurrentWeek = isSameWeek(currentWeekStart, new Date(), { weekStartsOn: 1 });
// Use isCurrentWeek to disable "Today" button styling when already on current week
```

### Pattern 3: Workshop-to-Day Assignment

**What:** Filter the global workshops array to find events for a given day column.

```jsx
// Source: date-fns v4 isSameDay, parseISO — confirmed present
import { isSameDay, parseISO } from 'date-fns';

// Inside CalendarGrid or DayColumn:
const dayWorkshops = workshops.filter(ws =>
  isSameDay(parseISO(ws.startTime), dayDate)
);
```

**Note:** The mock data uses `startTime` (not `start`) as the field name — confirmed from actual data file.

### Pattern 4: Type Color Lookup (Tailwind JIT Safe)

**What:** Full class name strings in a lookup object. NEVER build class names by string interpolation.

```jsx
// All class strings are static — Tailwind JIT scanner can detect them
const TYPE_STYLES = {
  'Weekly Connection': 'bg-blue-50 border-l-4 border-ww-blue text-ww-navy',
  'All In':            'bg-purple-50 border-l-4 border-purple-600 text-ww-navy',
  'Special Event':     'bg-rose-50 border-l-4 border-ww-coral text-ww-navy',
  'Coaching Corner':   'bg-teal-50 border-l-4 border-teal-500 text-ww-navy',
  'Movement/Fitness':  'bg-green-50 border-l-4 border-green-500 text-ww-navy',
};

const TYPE_DOT_COLORS = {
  'Weekly Connection': 'bg-ww-blue',
  'All In':            'bg-purple-600',
  'Special Event':     'bg-ww-coral',
  'Coaching Corner':   'bg-teal-500',
  'Movement/Fitness':  'bg-green-500',
};

const STATUS_DOT_COLORS = {
  'Published': 'bg-ww-success',   // green (#22C55E)
  'Draft':     'bg-ww-warning',   // yellow (#F59E0B)
  'Cancelled': 'bg-slate-400',
};
```

**Design choice:** Light tinted card background (`bg-blue-50`) with left colored border (`border-l-4 border-ww-blue`) is preferred over solid colored cards. This keeps text legible, shows card content clearly in compact cards, and looks professional. The solid color is reserved for the left border accent and the type dot.

### Pattern 5: Coach Name Lookup with useMemo

**What:** Build a Map from coach ID to coach object once on mount; used by every WorkshopCard.

```jsx
// In CalendarGrid or ScheduleCalendar — pass coachMap down
const { coaches, workshops } = useApp();
const coachMap = useMemo(
  () => new Map(coaches.map(c => [c.id, c])),
  [coaches]
);
```

### Pattern 6: Time Display on Cards

```jsx
import { parseISO, format } from 'date-fns';

// Short start time (e.g., "9:00 AM")
const timeLabel = format(parseISO(workshop.startTime), 'h:mm a');
// Or just start time (e.g., "9:00") for compact cards
const timeShort = format(parseISO(workshop.startTime), 'h:mm');
```

### Pattern 7: Scroll Container Layout

**What:** The calendar must scroll vertically (1024px grid vs ~796px visible height). The AppShell `main` area already has `overflow-auto` — this is sufficient. The calendar's own scroll region is the main content area itself.

**Day header must stay visible while scrolling:** Use a two-part layout:
1. Fixed-height header row (day names + dates) — does NOT scroll
2. Scrollable body with time axis + event columns

```jsx
// ScheduleCalendar layout (inside AppShell main which has overflow-auto p-6)
<div className="flex flex-col h-full -m-6"> {/* escape AppShell padding */}
  <WeekNav ... />           {/* navigation bar, fixed height */}
  <div className="flex-1 overflow-auto"> {/* scrollable calendar body */}
    <CalendarGrid ... />
  </div>
</div>
```

**Alternative (simpler):** Don't escape the padding; let the main area scroll normally. The day headers scroll away but the UX remains functional for Phase 2 (sticky header polish is a Phase 7 concern).

### Anti-Patterns to Avoid

- **Dynamic Tailwind classes via interpolation:** `bg-${color}-500` will NOT work. Always use full string class names in lookup objects.
- **Percentage-based event heights:** Floating point errors create misaligned events. Use pixels.
- **Storing Date objects in state:** Store ISO strings in workshop data; parse with `parseISO` only for display/calculation. (Already done in mock data.)
- **Using `w.start` instead of `w.startTime`:** The actual mock data field is `startTime`/`endTime`, not `start`/`end`. The Phase 1 research example was illustrative; the actual data uses `startTime`.
- **Not including `weekStartsOn: 1`:** `startOfWeek` defaults to Sunday (0). Always pass `{ weekStartsOn: 1 }` for Monday-anchored weeks.
- **Forgetting `Cancelled` status:** Mock data has 2 `Cancelled` workshops. The card component must handle this status gracefully (show greyed-out or skip display).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date math (week start, add weeks) | Custom date arithmetic | date-fns `startOfWeek`, `addWeeks`, `subWeeks` | DST edge cases, month boundaries; already installed |
| Time difference calculation | `(end - start) / 60000` | date-fns `differenceInMinutes` | Handles DST transitions correctly |
| Date formatting | Custom format strings | date-fns `format` with format tokens | Locale-aware, tested, consistent |
| Overlap detection (Phase 4 prep) | Custom interval logic | date-fns `areIntervalsOverlapping` | Handles edge cases (adjacent intervals) correctly — `areIntervalsOverlapping(w1, w2)` returns `false` for adjacent (touching but not overlapping) intervals |
| Navigation icons | Custom SVG chevrons | lucide-react `ChevronLeft`, `ChevronRight` | Already installed; consistent with TopBar icons |
| Calendar library | react-big-calendar, FullCalendar | Custom implementation | These are heavyweight (100KB+); requirements are simple enough for a custom grid; no need for DnD or complex features in Phase 2 |

**Key insight:** A custom calendar grid for this specific use case (fixed time range, no drag-drop in Phase 2, simple event layout) is ~150 lines of JSX. Using FullCalendar or react-big-calendar would add 100KB+ bundle weight and fighting against their default styling — not worth it.

---

## Common Pitfalls

### Pitfall 1: startTime Field Name

**What goes wrong:** Using `workshop.start` (from Phase 1 research schema example) instead of `workshop.startTime` (actual mock data field name).
**Why it happens:** Phase 1 research showed an illustrative schema with `start`/`end`; the actual implemented data uses `startTime`/`endTime`.
**How to avoid:** Always reference the actual mock data file. Confirmed fields: `id`, `title`, `type`, `status`, `coachId`, `coCoachId`, `startTime`, `endTime`, `markets`, `description`, `recurrence`, `attendance`.
**Warning signs:** Events don't render; `parseISO(undefined)` throws or returns Invalid Date.

### Pitfall 2: Tailwind Dynamic Class Names

**What goes wrong:** `className={\`bg-${typeColorMap[workshop.type]}\`}` produces no styles in production build.
**Why it happens:** Tailwind v4 (like v3) scans source files as plain text. Dynamically assembled strings are invisible to the scanner.
**How to avoid:** Use a full-class-string lookup object: `const TYPE_STYLES = { 'Weekly Connection': 'bg-blue-50 border-l-4 border-ww-blue', ... }`. Then `className={TYPE_STYLES[workshop.type]}`.
**Warning signs:** Cards appear unstyled; colors work in dev (where classes may exist from elsewhere) but not in production build.

### Pitfall 3: Missing weekStartsOn Option

**What goes wrong:** `startOfWeek(new Date())` returns Sunday instead of Monday, shifting all day columns by one day.
**Why it happens:** date-fns defaults `weekStartsOn: 0` (Sunday). The calendar is Mon-Sun (CAL-01).
**How to avoid:** Always pass `{ weekStartsOn: 1 }` to `startOfWeek` and `isSameWeek`. The mock data already uses this correctly.
**Warning signs:** Monday column shows Sunday workshops; entire week is off by one day.

### Pitfall 4: Event Overflow at Grid Boundaries

**What goes wrong:** A workshop ending at or after 10:00 PM (22:00) has a `top + height` exceeding 1024px, causing visible overflow below the grid.
**Why it happens:** `max(durationMins * PX_PER_MIN, 20)` doesn't clamp the bottom edge.
**How to avoid:** Clamp height: `height: Math.min(height, GRID_HEIGHT - top)`. Also: no mock workshops extend past 9:30 PM so this is a minor risk for Phase 2.
**Warning signs:** Events visually extend past the grid bottom border.

### Pitfall 5: Cancelled Workshops Appearing on Grid

**What goes wrong:** 2 cancelled workshops in mock data (`ws-026`, `ws-048`) render as event cards on the grid.
**Why it happens:** CalendarGrid filters workshops for a day and renders all of them.
**How to avoid:** Filter out cancelled workshops before rendering: `workshops.filter(ws => ws.status !== 'Cancelled')`. Or render them with a distinct greyed-out style — but the requirements don't call for cancelled display on the grid.
**Warning signs:** Grey/red "Cancelled: [name]" blocks appear unexpectedly on the grid.

### Pitfall 6: Overlapping Events Visual Collision

**What goes wrong:** Two workshops at the same time on the same day (e.g., the intentional conflicts) render as exactly stacked cards that are completely invisible behind each other.
**Why it happens:** Both cards have identical `top` values and `left: 0; width: 100%` within the day column.
**How to avoid:** Phase 2 doesn't need full conflict-layout resolution (Phase 4 handles conflict *detection*). A simple approach: offset overlapping cards by 4-6px horizontally, or reduce width of each by the number of overlaps. The simplest acceptable Phase 2 implementation: render them stacked with a slight left offset (`left: N*4px`) so at minimum they're visible. Full column-division algorithm is Phase 4 work.
**Warning signs:** Some workshops appear to vanish from the grid on days with intentional conflicts.

---

## Code Examples

Verified patterns from the actual codebase and date-fns v4:

### Complete Event Positioning

```jsx
// Source: Verified against date-fns v4 installed in project
import { parseISO, getHours, getMinutes, differenceInMinutes } from 'date-fns';

const GRID_START_HOUR = 6;
const PX_PER_HOUR = 64;
const PX_PER_MIN = PX_PER_HOUR / 60;
const GRID_HEIGHT = (22 - GRID_START_HOUR) * PX_PER_HOUR; // 1024px

function getEventPosition(startTimeISO, endTimeISO) {
  const start = parseISO(startTimeISO);
  const end = parseISO(endTimeISO);
  const startMinsFromGridStart =
    (getHours(start) - GRID_START_HOUR) * 60 + getMinutes(start);
  const durationMins = differenceInMinutes(end, start);
  const top = Math.round(startMinsFromGridStart * PX_PER_MIN);
  const height = Math.max(Math.round(durationMins * PX_PER_MIN), 20);
  return { top, height: Math.min(height, GRID_HEIGHT - top) };
}
```

### Week Navigation State

```jsx
// Source: date-fns v4 — all functions verified present
import {
  startOfWeek, addWeeks, subWeeks, addDays, format, isSameWeek
} from 'date-fns';
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ScheduleCalendar() {
  const [currentWeekStart, setCurrentWeekStart] = useState(
    () => startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [viewMode, setViewMode] = useState('week');

  const weekEnd = addDays(currentWeekStart, 6);
  const headerText =
    format(currentWeekStart, 'MMM d') + ' – ' + format(weekEnd, 'MMM d, yyyy');
  const isCurrentWeek = isSameWeek(currentWeekStart, new Date(), { weekStartsOn: 1 });

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  return (
    <div>
      {/* Week navigation header */}
      <div className="flex items-center gap-4 mb-4">
        <button onClick={() => setCurrentWeekStart(d => subWeeks(d, 1))}>
          <ChevronLeft size={20} />
        </button>
        <span className="font-semibold text-ww-navy">{headerText}</span>
        <button onClick={() => setCurrentWeekStart(d => addWeeks(d, 1))}>
          <ChevronRight size={20} />
        </button>
        <button
          onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
          disabled={isCurrentWeek}
        >
          Today
        </button>
      </div>
      {/* View toggle tabs */}
      <div className="flex gap-1 mb-4">
        {['day', 'week', 'month'].map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={viewMode === mode
              ? 'px-4 py-1.5 bg-ww-blue text-white rounded text-sm font-medium'
              : 'px-4 py-1.5 text-slate-600 hover:bg-surface-2 rounded text-sm'}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>
      {viewMode === 'week' && <CalendarGrid weekDays={weekDays} />}
      {viewMode !== 'week' && <div className="text-slate-400 text-sm">View coming soon</div>}
    </div>
  );
}
```

### Type Color Lookup (Tailwind JIT Safe)

```jsx
// All class strings are complete — Tailwind JIT scanner detects them
const TYPE_CARD_STYLES = {
  'Weekly Connection': 'bg-blue-50 border-l-4 border-ww-blue',
  'All In':            'bg-purple-50 border-l-4 border-purple-600',
  'Special Event':     'bg-rose-50 border-l-4 border-ww-coral',
  'Coaching Corner':   'bg-teal-50 border-l-4 border-teal-500',
  'Movement/Fitness':  'bg-green-50 border-l-4 border-green-500',
};

const TYPE_DOT_COLORS = {
  'Weekly Connection': 'bg-ww-blue',
  'All In':            'bg-purple-600',
  'Special Event':     'bg-ww-coral',
  'Coaching Corner':   'bg-teal-500',
  'Movement/Fitness':  'bg-green-500',
};

const STATUS_DOT_COLORS = {
  'Published': 'bg-ww-success',
  'Draft':     'bg-ww-warning',
  'Cancelled': 'bg-slate-400',
};
```

### Day Column Structure

```jsx
// CalendarGrid.jsx — simplified structure
import { isSameDay, parseISO, format } from 'date-fns';

export default function CalendarGrid({ weekDays }) {
  const { workshops, coaches } = useApp();
  const coachMap = useMemo(
    () => new Map(coaches.map(c => [c.id, c])),
    [coaches]
  );
  const visibleWorkshops = workshops.filter(ws => ws.status !== 'Cancelled');

  // Time axis labels: 6 AM through 10 PM
  const hours = Array.from({ length: 17 }, (_, i) => i + 6); // [6, 7, ..., 22]

  return (
    <div className="flex border border-border rounded-lg overflow-hidden">
      {/* Time gutter */}
      <div className="w-14 flex-shrink-0 border-r border-border">
        {/* spacer for header row */}
        <div className="h-10 border-b border-border" />
        {/* Hour labels */}
        <div className="relative" style={{ height: GRID_HEIGHT }}>
          {hours.map(h => (
            <div
              key={h}
              className="absolute right-2 text-xs text-slate-400"
              style={{ top: (h - GRID_START_HOUR) * PX_PER_HOUR - 8 }}
            >
              {h === 12 ? '12 PM' : h < 12 ? `${h} AM` : `${h - 12} PM`}
            </div>
          ))}
        </div>
      </div>

      {/* Day columns */}
      <div className="flex-1 grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {weekDays.map(day => {
          const dayWorkshops = visibleWorkshops.filter(ws =>
            isSameDay(parseISO(ws.startTime), day)
          );
          return (
            <div key={day.toISOString()} className="border-r border-border last:border-r-0">
              {/* Day header */}
              <div className="h-10 border-b border-border flex flex-col items-center justify-center">
                <span className="text-xs text-slate-500">{format(day, 'EEE')}</span>
                <span className="text-sm font-medium text-ww-navy">{format(day, 'd')}</span>
              </div>
              {/* Event area */}
              <div className="relative" style={{ height: GRID_HEIGHT }}>
                {/* Slot row lines */}
                {Array.from({ length: 32 }, (_, i) => (
                  <div
                    key={i}
                    className={`absolute inset-x-0 border-b ${
                      i % 2 === 0 ? 'border-border' : 'border-border/50'
                    }`}
                    style={{ top: i * 32 }}
                  />
                ))}
                {/* Workshop cards */}
                {dayWorkshops.map((ws, idx) => {
                  const { top, height } = getEventPosition(ws.startTime, ws.endTime);
                  return (
                    <div
                      key={ws.id}
                      className="absolute inset-x-1"
                      style={{ top: top + 1, height: height - 2, left: idx * 4 }}
                    >
                      <WorkshopCard workshop={ws} coachMap={coachMap} />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### WorkshopCard Component

```jsx
// WorkshopCard.jsx
import { parseISO, format } from 'date-fns';

export default function WorkshopCard({ workshop, coachMap }) {
  const coach = coachMap.get(workshop.coachId);
  const coCoach = workshop.coCoachId ? coachMap.get(workshop.coCoachId) : null;
  const timeLabel = format(parseISO(workshop.startTime), 'h:mm a');

  return (
    <div
      className={`h-full overflow-hidden rounded text-xs px-1.5 py-1 cursor-pointer
        hover:brightness-95 transition-all ${TYPE_CARD_STYLES[workshop.type]}`}
    >
      {/* Status dot + time */}
      <div className="flex items-center gap-1 mb-0.5">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT_COLORS[workshop.status]}`} />
        <span className="text-slate-500 font-medium">{timeLabel}</span>
      </div>
      {/* Title */}
      <div className="font-semibold truncate text-ww-navy leading-tight">
        {workshop.title}
      </div>
      {/* Coach */}
      {coach && (
        <div className="text-slate-500 truncate">
          {coach.name}{coCoach ? ` · ${coCoach.name}` : ''}
        </div>
      )}
    </div>
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| FullCalendar / react-big-calendar | Custom grid component | 2024+ (simpler requirements) | 100KB+ bundle avoided; full control over styling |
| CSS Grid for event placement | position:absolute over relative container | Always standard | Absolute positioning handles overlapping events better than CSS Grid spans |
| `date-fns/locale` for week config | `{ weekStartsOn: 1 }` option | date-fns v2+ | Simple, no locale import needed |
| `react-router-dom` | `react-router` | React Router v7 (2024) | Already using correct package from Phase 1 |

---

## Open Questions

1. **Overlapping event visual layout depth**
   - What we know: Phase 2 requires events to be visible; Phase 4 adds conflict *detection* UI
   - What's unclear: How sophisticated should Phase 2's overlap layout be?
   - Recommendation: Simple offset (each overlapping card shifted 4px right, with slightly reduced width) is sufficient for Phase 2. Full column-splitting algorithm is Phase 4 work. The offset approach makes conflicts visible without being ugly.

2. **AppShell padding escape for calendar**
   - What we know: AppShell main has `p-6` padding; the calendar grid benefits from full-height rendering with sticky day headers
   - What's unclear: Whether to escape `p-6` with `-m-6` or accept the padded layout
   - Recommendation: For Phase 2, keep the `p-6` padding — it's simpler. The day headers will scroll away, but this is acceptable. Sticky header polish is Phase 7 work. The grid simply scrolls inside the padded area.

3. **CAL-02 view toggles (Day/Month) depth**
   - What we know: Requirements say "Week default, others simplified"
   - What's unclear: "Simplified" could mean placeholder text or a basic layout
   - Recommendation: Render "Day view coming soon" / "Month view coming soon" placeholder divs for Day/Month tabs. Only Week view needs full implementation in Phase 2.

---

## Sources

### Primary (HIGH confidence)

- Actual codebase (`/src/data/workshops.js`, `/src/index.css`, `/src/App.jsx`) — confirmed field names, theme tokens, existing structure
- date-fns v4 installed package — all required functions verified present via `require()` test: `startOfWeek`, `addWeeks`, `subWeeks`, `addDays`, `format`, `parseISO`, `isSameDay`, `differenceInMinutes`, `getHours`, `getMinutes`, `isToday`, `isSameWeek`, `areIntervalsOverlapping`
- lucide-react installed package — `ChevronLeft`, `ChevronRight`, `Calendar` confirmed present
- Positioning math — verified with actual calculations: 64px/hr gives sensible pixel values for all sample workshops

### Secondary (MEDIUM confidence)

- Web search results confirming `position: absolute` over `position: relative` as standard calendar event rendering pattern (Google Calendar, FullCalendar both use this approach)
- Web search confirming Tailwind v4 requires full static class strings (not dynamic interpolation) — consistent with Phase 1 research

### Tertiary (LOW confidence)

- Web search on overlap layout algorithms — referenced react-big-calendar's approach but not directly verified for this use case

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; all verified against installed node_modules
- Architecture: HIGH — positioning math verified with actual calculations; week nav verified with date-fns API
- Color mapping: HIGH — full Tailwind class names defined statically; standard palette colors confirmed available
- Pitfalls: HIGH — startTime field name verified against actual data file; JIT scanner requirement confirmed in Phase 1 research
- Overlap layout: MEDIUM — simple offset approach recommended; full algorithm deferred to Phase 4

**Research date:** 2026-03-05
**Valid until:** 2026-06-05 (90 days — all dependencies stable; no beta packages in this domain)
