# Phase 3: Workshop Detail - Research

**Researched:** 2026-03-06
**Domain:** React slide-in panel, controlled forms, SVG sparklines, coach availability logic
**Confidence:** HIGH

## Summary

Phase 3 adds the central editing surface of the app: a 400px panel that slides in from the right when a workshop card is clicked, and opens in create mode when an empty calendar slot is clicked. The panel hosts a full editable form, status badge, attendance sparkline, conflict warnings, and action buttons that mutate global state.

The project already has all needed infrastructure: React 19, Tailwind v4 (CSS-first config via `@theme`), `date-fns`, `lucide-react`, and global `workshops`/`coaches` state in `AppContext` with `setWorkshops`. No new packages are required. The slide-in animation is achievable with pure Tailwind transition utilities (`translate-x-full` / `translate-x-0` toggled by an `isOpen` boolean). The attendance sparkline should be a hand-rolled SVG `<polyline>` — no charting library needed for 5 data points. Coach availability checking is pure data logic against the existing `coaches[].availability` array.

The three plans already described (shell/animation, form/state, create mode) map cleanly onto distinct implementation concerns. The critical decision that affects all three plans is where panel open/close state lives: it must live in `ScheduleCalendar` (or a dedicated hook) so both `CalendarGrid` (click on card OR empty slot) and the panel itself can read and mutate it.

**Primary recommendation:** Keep all panel state (selected workshop ID, panel mode, draft form values) in `ScheduleCalendar`. Pass an `onWorkshopClick` prop down to `CalendarGrid` and `WorkshopCard`, and an `onSlotClick` prop to each day column cell. No context changes needed for phase 3.

## Standard Stack

### Core (no new installs)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2 | Panel state, form controlled inputs | Already in project |
| Tailwind v4 | 4.2 | Slide animation, panel layout, form styles | Already in project, CSS-first @theme |
| lucide-react | 0.577 | Close icon, chevrons, alert icon in panel | Already in project |
| date-fns | 4.1 | Format panel date/time display | Already in project |

### Supporting (no new installs)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Native SVG + polyline | — | 5-point attendance sparkline | Always; 5 points needs no charting library |
| React 19 `useId` | built-in | Accessible form label/input associations | For all form field pairs |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled SVG sparkline | recharts, react-sparklines, MUI SparkLineChart | Libraries add bundle weight; 5 static points need 8 lines of SVG math, not a library |
| Pure CSS transition (translate-x) | Headless UI `<Transition>` | Headless UI adds ~15KB and is not installed; pure CSS toggle is sufficient for 200ms ease |
| `ScheduleCalendar` owns panel state | Context-level panel state | Context state is appropriate when multiple pages need panel; here only ScheduleCalendar does |

**Installation:** No new packages needed for this phase.

## Architecture Patterns

### Recommended Project Structure

```
src/
├── components/
│   ├── calendar/
│   │   ├── CalendarGrid.jsx        # Add onSlotClick prop to day column divs
│   │   └── WorkshopCard.jsx        # Add onClick prop → calls onWorkshopClick(workshop.id)
│   └── panel/
│       ├── WorkshopPanel.jsx       # Outer shell: slide animation, overlay, Escape key
│       ├── WorkshopForm.jsx        # All editable fields + action buttons
│       └── AttendanceSparkline.jsx # SVG polyline for 5-week attendance
├── pages/
│   └── ScheduleCalendar.jsx        # Add: selectedId, panelMode, draftValues state
└── context/
    └── AppContext.jsx              # No changes needed in Phase 3
```

### Pattern 1: Slide-In Panel with Pure CSS Transition

**What:** The panel is `fixed right-0 top-0 h-screen w-[400px]` and uses `translate-x-0` (open) vs `translate-x-full` (closed) with `transition-transform duration-200 ease-in-out`. An overlay backdrop `fixed inset-0 bg-black/30` sits behind the panel when open.

**When to use:** When you need a single-axis slide animation and don't need JS animation callbacks.

**Example:**
```jsx
// WorkshopPanel.jsx
// No additional imports needed — pure Tailwind transition utilities

export default function WorkshopPanel({ isOpen, onClose, workshop, coaches }) {
  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    document.addEventListener(
      'keydown',
      (e) => { if (e.key === 'Escape') onClose(); },
      { signal: controller.signal }
    );
    return () => controller.abort();
  }, [isOpen, onClose]);

  return (
    <>
      {/* Overlay backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 z-20 transition-opacity duration-200
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      {/* Slide panel */}
      <div
        className={`fixed right-0 top-0 h-screen w-[400px] bg-white z-30 shadow-2xl
          transition-transform duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* panel contents */}
      </div>
    </>
  );
}
```

**Confidence:** HIGH — verified against Tailwind v4 `translate-x-full` and `transition-transform` docs and multiple working examples.

### Pattern 2: ScheduleCalendar as Panel State Owner

**What:** `ScheduleCalendar` holds three pieces of panel state:
- `selectedWorkshopId` (string | null) — which workshop is being viewed/edited
- `panelMode` ('view' | 'create') — determines panel title and whether fields pre-populate
- `slotContext` ({ date, hour, minute } | null) — pre-fills date/time when creating from a slot

These are passed as props to `WorkshopPanel` and `CalendarGrid`.

**When to use:** When only one page needs the panel (which is true here — roster and drafts pages don't need this panel).

**Example:**
```jsx
// ScheduleCalendar.jsx additions
const [selectedWorkshopId, setSelectedWorkshopId] = useState(null);
const [panelMode, setPanelMode] = useState('view');
const [slotContext, setSlotContext] = useState(null);

const openWorkshop = useCallback((id) => {
  setSelectedWorkshopId(id);
  setPanelMode('view');
  setSlotContext(null);
}, []);

const openCreate = useCallback((date, hour, minute) => {
  setSelectedWorkshopId(null);
  setPanelMode('create');
  setSlotContext({ date, hour, minute });
}, []);

const closePanel = useCallback(() => {
  setSelectedWorkshopId(null);
  setSlotContext(null);
}, []);
```

### Pattern 3: Controlled Form with Local Draft State

**What:** The panel maintains local `draftValues` state initialized from the selected workshop (or empty values for create mode). The user edits local state; Save Draft / Publish call `setWorkshops` from context to commit changes.

**Key insight:** Do NOT write to global `workshops` on every keystroke. Write only on Save Draft or Publish. This avoids expensive re-renders of the entire CalendarGrid while the user types.

**Example:**
```jsx
// WorkshopForm.jsx
function WorkshopForm({ workshop, coaches, mode, slotContext, onClose }) {
  const { workshops, setWorkshops } = useApp();

  // Initialize from workshop or empty (create mode)
  const [draft, setDraft] = useState(() =>
    mode === 'create'
      ? {
          title: '',
          type: 'Weekly Connection',
          status: 'Draft',
          coachId: '',
          coCoachId: null,
          description: '',
          recurrence: 'weekly',
          markets: ['US'],
          startTime: slotContext ? buildISO(slotContext) : '',
          endTime: '',
        }
      : { ...workshop }
  );

  // Re-initialize when a different workshop is selected
  useEffect(() => {
    if (mode === 'view' && workshop) {
      setDraft({ ...workshop });
    }
  }, [workshop?.id, mode]);

  const handleSaveDraft = () => {
    if (mode === 'create') {
      const newWorkshop = { ...draft, id: `ws-${Date.now()}` };
      setWorkshops(prev => [...prev, newWorkshop]);
    } else {
      setWorkshops(prev => prev.map(w => w.id === draft.id ? draft : w));
    }
    onClose();
  };

  const handlePublish = () => {
    const published = { ...draft, status: 'Published' };
    setWorkshops(prev =>
      mode === 'create'
        ? [...prev, { ...published, id: `ws-${Date.now()}` }]
        : prev.map(w => w.id === draft.id ? published : w)
    );
    onClose();
  };

  const handleRemove = () => {
    setWorkshops(prev => prev.filter(w => w.id !== draft.id));
    onClose();
  };
}
```

### Pattern 4: SVG Sparkline (no dependency)

**What:** A tiny `<svg>` component that maps 5 attendance numbers to a `<polyline>`. Normalize each value to the SVG coordinate space using min/max scaling.

**Example:**
```jsx
// AttendanceSparkline.jsx
export default function AttendanceSparkline({ data, width = 80, height = 24 }) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1; // avoid divide-by-zero if all values equal

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        className="text-ww-blue"
      />
      {/* Last point dot */}
      <circle
        cx={data.reduce((_, v, i, arr) => (i / (arr.length - 1)) * width, 0)}
        cy={height - ((data[data.length - 1] - min) / range) * height}
        r="2"
        fill="currentColor"
        className="text-ww-blue"
      />
    </svg>
  );
}
```

**Confidence:** HIGH — SVG polyline normalization pattern verified from multiple official sources.

### Pattern 5: Click-to-Create on Empty Slots

**What:** Each day column cell in `CalendarGrid` needs an `onClick` handler that calculates which 30-minute slot was clicked (based on `event.clientY` and the cell's bounding rect), then calls `onSlotClick(day, hour, minute)`.

**Example:**
```jsx
// In CalendarGrid.jsx — day column div
<div
  key={day.toISOString()}
  className="relative border-l border-border cursor-pointer"
  style={{ height: GRID_HEIGHT }}
  onClick={(e) => {
    // Only fire if click target is the background (not a workshop card)
    if (e.target !== e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relY = e.clientY - rect.top;
    const totalMinutes = Math.floor(relY / PX_PER_MIN);
    const slotMinutes = Math.floor(totalMinutes / 30) * 30; // snap to 30-min
    const hour = GRID_START_HOUR + Math.floor(slotMinutes / 60);
    const minute = slotMinutes % 60;
    onSlotClick(day, hour, minute);
  }}
>
```

**Key insight:** `e.target !== e.currentTarget` check prevents the slot click firing when the user clicks a workshop card inside the cell.

**Confidence:** HIGH — standard event.target vs currentTarget pattern for click delegation.

### Pattern 6: Coach Availability Dropdown

**What:** In the coach dropdown, compute each coach's availability for the selected workshop date/time. Show available coaches in normal text (green indicator), unavailable coaches grayed out with a reason string.

**Availability check logic:**
```js
function getCoachAvailability(coach, date, startHour, startMinute) {
  const dayName = format(date, 'EEEE').toLowerCase(); // 'monday', 'tuesday', etc.
  const slot = coach.availability.find(a => a.day === dayName);
  if (!slot) return { available: false, reason: 'No availability this day' };

  const startMinutes = startHour * 60 + startMinute;
  const [availStartH, availStartM] = slot.start.split(':').map(Number);
  const [availEndH, availEndM] = slot.end.split(':').map(Number);
  const availStart = availStartH * 60 + availStartM;
  const availEnd = availEndH * 60 + availEndM;

  if (startMinutes < availStart) return { available: false, reason: `Available from ${slot.start}` };
  if (startMinutes >= availEnd) return { available: false, reason: `Available until ${slot.end}` };
  if (coach.status === 'inactive') return { available: false, reason: 'Inactive coach' };

  return { available: true, reason: null };
}
```

### Anti-Patterns to Avoid

- **Putting panel state in AppContext:** Panel open/close is UI state, not domain state. It belongs in the page component, not the shared context. Context is for `workshops` and `coaches` arrays only.
- **Writing draft values to global state on each keystroke:** This re-renders CalendarGrid (expensive) on every character typed. Use local `draft` state; commit to global only on Save/Publish.
- **Rendering the panel in CalendarGrid:** Panel is a page-level concern. CalendarGrid should only fire `onWorkshopClick` and `onSlotClick` callbacks; it should not know about the panel's existence.
- **Using `translate-x-full` on a conditionally rendered element without CSS transition:** If the panel is conditionally mounted/unmounted (`{isOpen && <Panel />}`), the exit animation never plays. Either keep the panel always mounted (just visually hidden via translate) or use a mount/unmount animation strategy. The simplest approach: keep the panel always in the DOM, toggle translate classes.
- **Forgetting to remove Escape keydown listener:** Without cleanup, multiple listeners accumulate if the panel opens/closes repeatedly. Always use `controller.abort()` or `removeEventListener` in the `useEffect` return.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Chart for 5 data points | Full recharts/victory setup | Inline SVG polyline | Libraries add 80-100KB; 5 points need 8 lines of math |
| Slide animation library | React Spring, Framer Motion, Headless UI Transition | CSS transition-transform + toggle class | Already available in Tailwind v4; no extra install |
| Date/time picker | Custom calendar picker | Native `<input type="datetime-local">` or text inputs formatted with date-fns | Prototype scope; native inputs work fine |
| Form library | React Hook Form, Formik | Local useState draft pattern | Form has ~10 fields; library overhead not justified |
| ID generation | UUID library | `Date.now()` prefix or simple counter | Local state only; IDs just need to be unique within session |

**Key insight:** This phase is almost entirely achievable with what already exists in the project. The only real engineering is the panel animation, the slot click geometry math, and the availability logic.

## Common Pitfalls

### Pitfall 1: Panel Exit Animation Not Playing

**What goes wrong:** Developer conditionally renders `{isOpen && <WorkshopPanel />}`. Panel appears with slide-in animation but disappears instantly (no slide-out) when closed.

**Why it happens:** React unmounts the element immediately when `isOpen` becomes false, so CSS transition has nothing to animate.

**How to avoid:** Always render the panel in the DOM; use `translate-x-full` / `translate-x-0` classes to show/hide it visually. The panel is always present but off-screen when closed.

**Warning signs:** Panel closes with a snap instead of a slide.

### Pitfall 2: Form State Stale When Switching Workshops

**What goes wrong:** User opens Workshop A, partially edits it, then clicks Workshop B on the calendar. The panel shows Workshop B's card but the form still has Workshop A's partially-edited values.

**Why it happens:** `draft` state is only initialized once (on mount or when `workshop` first changes). Switching to a different workshop ID doesn't re-initialize because React reuses the component.

**How to avoid:** Add a `useEffect` with `workshop?.id` in the dependency array to reset `draft` whenever the selected workshop changes. Or use a `key={selectedWorkshopId}` prop on `WorkshopForm` to force full remount on workshop change.

**Warning signs:** Form fields show wrong data after clicking a second workshop card.

### Pitfall 3: Slot Click Fires When Clicking Workshop Cards

**What goes wrong:** Clicking a workshop card opens the create panel (or fires both handlers) because the day column's `onClick` bubbles up from the card's `onClick`.

**Why it happens:** Events bubble from child to parent by default. Both the card click and the column background click fire.

**How to avoid:** In WorkshopCard's click handler, call `e.stopPropagation()`. In the day column's click handler, use the `e.target !== e.currentTarget` guard as a secondary safety. Use one, prefer both.

**Warning signs:** Clicking a workshop card shows "create new" panel instead of the workshop detail panel.

### Pitfall 4: Availability Check Uses Wrong Day Name Format

**What goes wrong:** Coach availability says `{ day: 'monday' }` but the date computed for the slot is a `Date` object. Developer calls `day.toLocaleDateString('en-US', { weekday: 'long' })` which returns `'Monday'` (capitalized) — doesn't match.

**Why it happens:** `coaches.availability[].day` stores lowercase strings. JS date formatting returns title-cased day names.

**How to avoid:** Use `format(date, 'EEEE').toLowerCase()` (date-fns already in project) to get `'monday'`, `'tuesday'` etc., matching the data format exactly.

**Warning signs:** All coaches show as "unavailable" even on their available days.

### Pitfall 5: Panel Z-Index Below Calendar Sticky Header

**What goes wrong:** The panel slides in but appears behind the sticky calendar day header row, which uses `z-10`.

**Why it happens:** CalendarGrid header is `sticky top-0 z-10`. Panel needs a higher z-index. The overlay backdrop also needs to be layered correctly.

**How to avoid:** Use `z-20` for the backdrop and `z-30` for the panel. Since these are `fixed` positioned, they escape the stacking context of CalendarGrid.

**Warning signs:** Panel partially hidden by header row.

## Code Examples

Verified patterns from official and verified sources:

### CSS Transition Slide Panel (Pure Tailwind)

```jsx
// Always in DOM, toggled by class — exit animation works correctly
<div
  className={`fixed right-0 top-0 h-screen w-[400px] bg-white shadow-2xl
    transition-transform duration-200 ease-in-out z-30
    ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
>
  {/* contents */}
</div>
```

### Escape Key Listener (Modern AbortController Cleanup)

```jsx
useEffect(() => {
  if (!isOpen) return;
  const controller = new AbortController();
  document.addEventListener(
    'keydown',
    (e) => { if (e.key === 'Escape') onClose(); },
    { signal: controller.signal }
  );
  return () => controller.abort();
}, [isOpen, onClose]);
```

### Slot Click Geometry

```jsx
// In CalendarGrid day column — 30-min snapping
onClick={(e) => {
  if (e.target !== e.currentTarget) return; // don't fire from workshop cards
  const rect = e.currentTarget.getBoundingClientRect();
  const relY = e.clientY - rect.top + e.currentTarget.scrollTop;
  const totalMinutes = Math.floor(relY / PX_PER_MIN);
  const snappedMinutes = Math.floor(totalMinutes / 30) * 30;
  const hour = GRID_START_HOUR + Math.floor(snappedMinutes / 60);
  const minute = snappedMinutes % 60;
  onSlotClick(day, hour, minute);
}}
```

Note: `e.currentTarget.scrollTop` may be needed if the grid column scrolls independently. Check actual scroll container.

### SVG Sparkline (5-Point)

```jsx
function AttendanceSparkline({ data, width = 80, height = 24 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline points={points} fill="none"
        stroke="#0066CC" strokeWidth="1.5"
        strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
```

### Coach Dropdown with Availability States

```jsx
// Render pattern for select options
{coaches.map(coach => {
  const { available, reason } = getCoachAvailability(
    coach, selectedDate, startHour, startMinute
  );
  return (
    <option
      key={coach.id}
      value={coach.id}
      disabled={!available}
      className={available ? 'text-green-700' : 'text-slate-400'}
    >
      {coach.name}{!available ? ` (${reason})` : ''}
    </option>
  );
})}
```

Note: Native `<select>` options have limited CSS styling. For the green/grayed visual treatment, a custom dropdown (div-based list) will be needed if precise styling is required. For prototype scope, `disabled` attribute on `<option>` suffices.

### State Shape in ScheduleCalendar

```jsx
// Three pieces of panel state — all in ScheduleCalendar
const [selectedWorkshopId, setSelectedWorkshopId] = useState(null);
const [panelMode, setPanelMode] = useState('view'); // 'view' | 'create'
const [slotContext, setSlotContext] = useState(null); // { date, hour, minute }

const isPanelOpen = selectedWorkshopId !== null || panelMode === 'create';
const selectedWorkshop = workshops.find(w => w.id === selectedWorkshopId) ?? null;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.js` for custom colors/animations | `@theme {}` block in CSS | Tailwind v4 (2025) | Already used in this project — custom `translate-x` values available |
| `removeEventListener` in useEffect cleanup | `AbortController.abort()` | 2022+ (broad support) | Cleaner, no need to reference same function instance |
| Charting library for mini charts | Inline SVG polyline | Ongoing preference in prototypes | No install, no bundle cost |
| `react-router-dom` import | `react-router` unified import | React Router v7 (2025) | Already used in this project |

**Deprecated/outdated:**
- Headless UI `<Transition>` for simple show/hide animations: Tailwind v4's native `@starting-style` support and CSS `transition-behavior` make library transitions unnecessary for single-axis slides.

## Open Questions

1. **Scroll container for slot click Y-offset calculation**
   - What we know: `CalendarGrid` has `overflow-y-auto` on its body container (the `<div className="flex overflow-y-auto" style={{ maxHeight: '600px' }}>` wrapper), not on each day column individually.
   - What's unclear: When the calendar body is scrolled, will `e.clientY - rect.top` correctly account for scroll offset, or does `e.currentTarget.scrollTop` also need to be added?
   - Recommendation: In plan 03-03, test with `e.clientY - rect.top` first. If slot snapping is off when scrolled, add the scroll offset from the overflow container. The day column divs themselves are not scrolled; the parent flex container is. May need `e.currentTarget.parentElement.scrollTop` depending on actual DOM nesting.

2. **Native `<option>` styling for coach availability**
   - What we know: Native `<select>/<option>` elements have very limited CSS styling, especially across browsers. The disabled attribute grays out options but cannot be colored green.
   - What's unclear: Whether prototype fidelity requires true green/gray color coding inside a dropdown, or whether `disabled` greying is sufficient.
   - Recommendation: For plan 03-03, use a custom div-based dropdown list (not native `<select>`) to achieve the green/grayed design. It's ~40 lines of code with `useState` for open/close.

3. **Remove from Schedule behavior for published workshops**
   - What we know: PANEL-06 says "Remove from Schedule" is one of the three action buttons. Requirements don't specify whether "remove" means `status: 'Cancelled'` or actual deletion from the array.
   - What's unclear: Should removed workshops disappear from the calendar entirely (delete from array) or show as cancelled (like `ws-026`)?
   - Recommendation: Based on the existing data which already has `status: 'Cancelled'` workshops (and CalendarGrid filters them out with `ws.status !== 'Cancelled'`), "Remove from Schedule" should set `status: 'Cancelled'`, not delete. This preserves data integrity and matches the existing pattern.

## Sources

### Primary (HIGH confidence)

- Tailwind CSS v4 docs — `translate`, `transition-property` utilities (translate-x-full, transition-transform pattern)
- React 19 docs — `useEffect`, `useState`, `useCallback` patterns; `useId` for form labels
- date-fns v4 source — `format(date, 'EEEE')` for day name; `parseISO`, `format` already used in CalendarGrid

### Secondary (MEDIUM confidence)

- [DEV: Animated Drawer with React and Tailwind CSS](https://dev.to/morewings/lets-create-an-animated-drawer-using-react-and-tailwind-css-3ddp) — confirmed translate-x + transition-transform approach works; portal pattern documented but not needed for this use case
- [DEV: Sparkline Component in React](https://dev.to/gnykka/how-to-create-a-sparkline-component-in-react-4e1) — verified SVG polyline normalization formula
- [Tailwind transitions guide 2025](https://tailkits.com/blog/tailwind-transitions-guide/) — confirmed duration-200, ease-in-out class behavior in v4

### Tertiary (LOW confidence)

- WebSearch result: AbortController cleanup for keydown events — multiple consistent sources; pattern reliable but verify against React 19 StrictMode (double-invoke of effects)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — project dependencies already locked; no new installs needed
- Architecture: HIGH — CalendarGrid and AppContext patterns already established; panel fits naturally
- Pitfalls: HIGH — exit animation trap and scroll offset issue are well-known; form re-init pitfall verified against React controlled component docs
- Coach availability logic: HIGH — data shape is fixed and fully visible in coaches.js

**Research date:** 2026-03-06
**Valid until:** 2026-04-06 (stable stack; no fast-moving dependencies)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PANEL-01 | Right-side slide-in panel (400px) opens on workshop card click | CSS transition pattern (Pattern 1) + `onWorkshopClick` prop threading (Pattern 2) |
| PANEL-02 | Editable fields: title, date/time, coach, co-coach, type, description, recurrence, markets | Controlled form pattern (Pattern 3) with local draft state |
| PANEL-03 | Status badge display (Draft/Published/Cancelled) | Read from `draft.status`; existing STATUS_DOT_COLORS pattern from WorkshopCard can be reused |
| PANEL-04 | Attendance sparkline for published workshops (last 5 weeks) | SVG polyline component (Pattern 4); render only when `draft.status === 'Published' && draft.attendance` |
| PANEL-05 | Conflict warnings as red alert box at top of panel | Phase 4 will add conflict detection logic; Phase 3 can stub with a prop `conflicts=[]` that renders when non-empty |
| PANEL-06 | Action buttons: Save Draft, Remove from Schedule, Publish | `handleSaveDraft`, `handleRemove`, `handlePublish` in WorkshopForm (Pattern 3) wired to `setWorkshops` |
| CREATE-01 | Click empty time slot opens panel in create mode with date/time pre-filled | Slot click geometry (Pattern 5) + `slotContext` state in ScheduleCalendar (Pattern 2) |
| CREATE-02 | Coach dropdown shows available (green) vs unavailable (grayed out with reason) | `getCoachAvailability()` utility (Pattern 6) + custom div dropdown (Open Question 2) |
</phase_requirements>
