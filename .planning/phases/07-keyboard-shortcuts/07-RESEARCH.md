# Phase 7: Keyboard Shortcuts - Research

**Researched:** 2026-03-09
**Domain:** React keyboard event handling, global hotkey patterns, input focus guards
**Confidence:** HIGH

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INTR-02 | Left/Right arrow keys navigate to previous/next week | `prevWeek` and `nextWeek` callbacks already exist in ScheduleCalendar; hook calls them on ArrowLeft/ArrowRight keydown |
| INTR-03 | T key jumps to current week | `goToToday` callback already exists in ScheduleCalendar; hook calls it on `key === 't'` (lowercase) |
| INTR-04 | Escape closes the detail panel; does not fire when focus is in text input | WorkshopPanel already has an Escape listener in its own useEffect; must be replaced/unified; input guard checks `e.target.tagName` |
| INTR-05 | N key opens create-workshop flow with next available slot pre-filled | `openCreate(date, hour, minute)` callback already exists; need a `findNextAvailableSlot(workshops)` utility |
</phase_requirements>

---

## Summary

Phase 7 is a pure React phase — no new npm packages are needed. The project already contains every callback required for INTR-02, INTR-03, and INTR-04: `prevWeek`, `nextWeek`, `goToToday`, and `closePanel` all live in `ScheduleCalendar`. The panel open callback `openCreate(date, hour, minute)` is also already there for INTR-05.

The architectural decision recorded in STATE.md is decisive: use a **centralized `useKeyboardShortcuts` hook with the ref pattern** to prevent listener leaks and Escape conflicts. This is the right approach. The existing `WorkshopPanel` component already has its own inline Escape listener (a `useEffect` that attaches a `keydown` listener when `isOpen` is true) — that listener must be removed and its logic folded into the centralized hook to avoid double-firing.

INTR-05 (N key opens create flow with next available slot) is the most complex requirement. It requires a new `findNextAvailableSlot(workshops)` utility that scans from the current time forward through the current week's grid hours (6:00–22:00, 30-min increments) to find the first 30-minute window that has no existing workshop starting in it. The slot is expressed as `{ date, hour, minute }` to match `openCreate`'s signature. If no slot is found in the current week, fall back to the next day at a sensible default (e.g., next weekday 09:00).

The input focus guard for INTR-04 (Escape does not fire when cursor is inside a text input or textarea) is a standard check: `if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return`. This also protects the N key from firing when typing in the title field.

**Primary recommendation:** Create `src/hooks/useKeyboardShortcuts.js`, create `src/utils/slotFinder.js`, mount the hook in `ScheduleCalendar`, and remove the inline Escape listener from `WorkshopPanel`. No new npm packages required.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React (built-in hooks) | 19.x (already installed) | `useEffect`, `useCallback`, `useRef` for the keyboard hook | No external library needed for this feature scope |
| `date-fns` | 4.1.x (already installed) | `addDays`, `startOfWeek`, `isWeekend`, `parseISO`, `isSameDay` for slot-finder utility | Already used throughout the project |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `AbortController` (Web API) | Built-in | Clean event listener teardown — already used in WorkshopPanel's Escape listener | Same pattern to use in the centralized hook |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom `useKeyboardShortcuts` hook | `react-hotkeys-hook` (npm) | External package adds bundle weight for a problem that's 30 lines of vanilla code; project has no precedent for adding npm packages for trivial problems |
| Custom `useKeyboardShortcuts` hook | `@react-aria/interactions` | WAY overkill for 4 shortcuts; designed for accessible component libraries |
| Inline `useEffect` in ScheduleCalendar | Centralized hook | STATE.md has already decided centralized hook; prevents listener leaks and Esc conflicts with WorkshopPanel |

**Installation:** None required.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── hooks/
│   └── useKeyboardShortcuts.js    # NEW — centralized keyboard hook
├── utils/
│   └── slotFinder.js              # NEW — finds next open calendar slot
├── pages/
│   └── ScheduleCalendar.jsx       # MODIFIED — mounts hook, removes nothing else
└── components/panel/
    └── WorkshopPanel.jsx          # MODIFIED — remove inline Escape useEffect
```

### Pattern 1: Centralized Keyboard Hook with AbortController

**What:** A single `useKeyboardShortcuts(handlers)` hook that attaches one `keydown` listener on `document` using `AbortController` for cleanup. All shortcut logic lives in one place.

**When to use:** When multiple components would otherwise each attach their own `document` listeners for the same event type — risks double-firing and cleanup bugs.

**Implementation:**

```js
// src/hooks/useKeyboardShortcuts.js
import { useEffect } from 'react';

/**
 * Attaches global keyboard shortcuts.
 * @param {Object} handlers - { onPrevWeek, onNextWeek, onToday, onClosePanel, onNewWorkshop }
 * @param {boolean} handlers.isPanelOpen - gate for Escape (close only if panel is open)
 */
export function useKeyboardShortcuts({ onPrevWeek, onNextWeek, onToday, onClosePanel, onNewWorkshop, isPanelOpen }) {
  useEffect(() => {
    const controller = new AbortController();

    document.addEventListener(
      'keydown',
      (e) => {
        // Input guard: never fire shortcuts when user is typing
        const tag = e.target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        // Also guard contenteditable
        if (e.target.isContentEditable) return;

        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            onPrevWeek();
            break;
          case 'ArrowRight':
            e.preventDefault();
            onNextWeek();
            break;
          case 't':
          case 'T':
            onToday();
            break;
          case 'Escape':
            if (isPanelOpen) onClosePanel();
            break;
          case 'n':
          case 'N':
            onNewWorkshop();
            break;
        }
      },
      { signal: controller.signal }
    );

    return () => controller.abort();
  }, [onPrevWeek, onNextWeek, onToday, onClosePanel, onNewWorkshop, isPanelOpen]);
}
```

**Usage in ScheduleCalendar.jsx:**

```js
useKeyboardShortcuts({
  onPrevWeek: prevWeek,
  onNextWeek: nextWeek,
  onToday: goToToday,
  onClosePanel: closePanel,
  onNewWorkshop: openNewWithNextSlot,
  isPanelOpen,
});
```

### Pattern 2: Next Available Slot Finder

**What:** A pure utility function that scans from the current time (or from the current week's start, if the current time is before grid start) through 30-minute slots to find the first unoccupied slot.

**When to use:** Called once when the user presses N to pre-fill the create form.

**Definition of "available":** A slot `{ date, hour, minute }` is available if no non-cancelled workshop has a `startTime` falling in the same 30-minute window on the same day AND the slot is still in the future (or at least today during business hours).

**Implementation:**

```js
// src/utils/slotFinder.js
import { startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';

const GRID_START_HOUR = 6;
const GRID_END_HOUR = 22;

/**
 * Find the next available 30-minute slot from now within the calendar grid.
 * Returns { date: Date, hour: number, minute: number }
 *
 * @param {Array} workshops - All workshops from AppContext
 * @returns {{ date: Date, hour: number, minute: number }}
 */
export function findNextAvailableSlot(workshops) {
  const now = new Date();
  const monday = startOfWeek(now, { weekStartsOn: 1 });

  // Build a Set of occupied slot keys: "YYYY-MM-DD:HH:MM"
  const occupied = new Set();
  workshops
    .filter((ws) => ws.status !== 'Cancelled')
    .forEach((ws) => {
      const d = parseISO(ws.startTime);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}:${d.getHours()}:${d.getMinutes()}`;
      occupied.add(key);
    });

  // Scan 7 days starting from today
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const day = addDays(monday, dayOffset);
    const isToday = isSameDay(day, now);

    // Start scanning from current hour:30 if today, otherwise from GRID_START_HOUR
    let startHour = isToday ? Math.max(GRID_START_HOUR, now.getHours()) : GRID_START_HOUR;
    let startMinute = isToday && now.getMinutes() >= 30 ? 30 : 0;
    if (isToday && now.getMinutes() >= 30) startHour = Math.max(GRID_START_HOUR, now.getHours() + 1);

    for (let h = startHour; h < GRID_END_HOUR; h++) {
      for (const m of [0, 30]) {
        if (h === startHour && m < startMinute) continue;
        const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}:${h}:${m}`;
        if (!occupied.has(key)) {
          return { date: day, hour: h, minute: m };
        }
      }
    }
  }

  // Fallback: next Monday 09:00 (should rarely hit)
  return { date: addDays(monday, 7), hour: 9, minute: 0 };
}
```

### Pattern 3: Mounting Location

The hook mounts in `ScheduleCalendar` because that is the component that owns all the callbacks (`prevWeek`, `nextWeek`, `goToToday`, `closePanel`, `openCreate`) and all the state (`isPanelOpen`, `workshops`). The hook is not in `App.jsx` because week navigation state is local to `ScheduleCalendar` — lifting it to App just for keyboard shortcuts would be over-engineering.

### Anti-Patterns to Avoid

- **Multiple `document.addEventListener` for the same event:** WorkshopPanel currently has an inline Escape listener. If the centralized hook also handles Escape, both will fire. Remove the WorkshopPanel listener before or as part of this phase.
- **Putting `isPanelOpen` in a ref and reading it in the handler:** Unnecessary complexity. The `useEffect` re-runs whenever `isPanelOpen` changes (it's a dep), so the handler always has the current value via closure.
- **Using `e.preventDefault()` on all keys:** Only arrow keys need `preventDefault()` to stop page scroll. T, N, and Escape do not need it (T and N are not browser-reserved; Escape's default browser behavior is benign in this SPA context).
- **Guarding by `role="textbox"` instead of tagName check:** The tagName check (`INPUT`, `TEXTAREA`, `SELECT`) is simpler and covers all form inputs in this project. `role="textbox"` would miss native `<input>` unless explicitly set.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Event listener cleanup | Manual `removeEventListener` with named function reference | `AbortController` + `{ signal }` | Already established pattern in WorkshopPanel; avoids stale reference bugs; single abort cleans up all listeners attached with same signal |
| Shortcut library features (sequences, combos, hold) | Custom key sequence tracker | N/A — not needed | The 4 shortcuts in this phase are all single keys; no combos, no sequences |

**Key insight:** Keyboard shortcut implementations look trivial and often are — but the cleanup bug (listener accumulating on re-renders) is the real failure mode. `AbortController` eliminates it completely.

---

## Common Pitfalls

### Pitfall 1: Double Escape Handler

**What goes wrong:** WorkshopPanel has its own `useEffect` Escape listener. If the centralized hook also handles Escape, both fire — panel closes twice (second call is a no-op, but it's brittle).

**Why it happens:** The existing WorkshopPanel listener was added before the centralized hook architecture was decided in STATE.md.

**How to avoid:** Remove the Escape `useEffect` from `WorkshopPanel.jsx` entirely. The centralized hook in `ScheduleCalendar` handles it. `WorkshopPanel` becomes a pure presentational component for this purpose.

**Warning signs:** Pressing Escape causes a React warning about "can't call setState on an unmounted component" or produces two console log events.

### Pitfall 2: Arrow Keys Scroll the Page

**What goes wrong:** `ArrowLeft` and `ArrowRight` are captured by the browser for horizontal page scroll. Without `e.preventDefault()`, the week changes AND the page scrolls.

**Why it happens:** Default browser behavior for arrow keys.

**How to avoid:** Call `e.preventDefault()` inside the `ArrowLeft` and `ArrowRight` cases only.

**Warning signs:** Visible page jank or scroll position change on arrow key press.

### Pitfall 3: Shortcuts Fire Inside the Panel Form

**What goes wrong:** User types "T" in the workshop title field; the calendar jumps to today. User types "N" in the description; the create panel opens (closing the current one).

**Why it happens:** The `keydown` listener is on `document` — it fires for all keypresses including those inside form fields.

**How to avoid:** The input guard at the top of the handler: check `e.target.tagName` for `INPUT`, `TEXTAREA`, `SELECT`, and `e.target.isContentEditable`.

**Warning signs:** Typing in the form causes unexpected navigation or panel changes.

### Pitfall 4: `useCallback` Missing on Handler Props

**What goes wrong:** Every render of `ScheduleCalendar` recreates `prevWeek`, `nextWeek`, `goToToday`, `closePanel`, and `openCreate` as new function references. The `useEffect` in the hook has these as deps, so it re-runs on every render, tearing down and reattaching the event listener constantly.

**Why it happens:** Functions defined inline in a component body get new references on every render.

**How to avoid:** Inspect existing callbacks. In `ScheduleCalendar.jsx`, `closePanel` and `openCreate` are already wrapped in `useCallback`. `prevWeek`, `nextWeek`, and `goToToday` are NOT (they are plain arrow functions). Wrap them in `useCallback` before passing to the hook, or define the hook's effect to be stable by using a ref-based handler pattern.

**The simpler fix:** Wrap `prevWeek`, `nextWeek`, and `goToToday` in `useCallback` with `[setCurrentWeekStart]` as their deps. `setCurrentWeekStart` is a setState setter — React guarantees its identity is stable.

**Warning signs:** React DevTools shows the keyboard listener being attached/detached on every render.

### Pitfall 5: Next Available Slot Logic Edge Cases

**What goes wrong:** User presses N at 9:45 PM on a Friday. Slot finder scans to the end of the current week and finds nothing. The fallback returns next Monday at 09:00 — but the slot finder only scanned 7 days from `startOfWeek(now)` (i.e., Monday of current week), so it already covers all 7 days.

**Why it happens:** Off-by-one in the scan window or incorrect reference for "today."

**How to avoid:** Ensure the scan starts from the current day (not the start of the week) and ends after 7 complete days from Monday. If no slot is found, the fallback to next Monday 09:00 is correct.

---

## Code Examples

Verified patterns from the existing codebase:

### AbortController Pattern (from WorkshopPanel.jsx — to be migrated)

```js
// Source: /src/components/panel/WorkshopPanel.jsx lines 7-18
useEffect(() => {
  if (!isOpen) return;
  const controller = new AbortController();
  document.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Escape') onClose();
    },
    { signal: controller.signal }
  );
  return () => controller.abort();
}, [isOpen, onClose]);
```

This is the exact pattern to generalize in `useKeyboardShortcuts`. The centralized hook removes the `if (!isOpen)` gate and instead passes `isPanelOpen` into the switch case for Escape.

### useCallback on State Setters (pattern from ScheduleCalendar.jsx lines 34-50)

```js
// Source: /src/pages/ScheduleCalendar.jsx
const closePanel = useCallback(() => {
  setSelectedWorkshopId(null);
  setPanelMode('view');
  setSlotContext(null);
}, []);

const openCreate = useCallback((date, hour, minute) => {
  setSelectedWorkshopId(null);
  setPanelMode('create');
  setSlotContext({ date, hour, minute });
}, []);
```

These are already `useCallback`-wrapped. `prevWeek`/`nextWeek`/`goToToday` (lines 61-64) are NOT — they need wrapping.

### openCreate Signature (the N key target)

```js
// Source: /src/pages/ScheduleCalendar.jsx line 46
const openCreate = useCallback((date, hour, minute) => { ... }, []);
```

`findNextAvailableSlot` must return `{ date, hour, minute }` exactly matching this signature. The call site is:

```js
const slot = findNextAvailableSlot(workshops);
openCreate(slot.date, slot.hour, slot.minute);
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `addEventListener` + `removeEventListener` with named function | `addEventListener` with `AbortController` signal | Modern browsers (2021+), now universally supported | Simpler cleanup — single `controller.abort()` vs tracking named function references |
| `window.addEventListener` | `document.addEventListener` | N/A — both work | `document` is preferred for keyboard events: it receives keydown from all elements including `body`; `window` also works but `document` is more semantically correct |

**Not deprecated/outdated:** Nothing in this phase relies on legacy patterns.

---

## Open Questions

1. **Should T require uppercase only, or be case-insensitive?**
   - What we know: the requirement says "T key" without specifying case; the hook example above handles both `'t'` and `'T'`
   - What's unclear: whether caps lock state should block the shortcut
   - Recommendation: handle both lowercase and uppercase — check `e.key === 't' || e.key === 'T'` OR more idiomatically `e.key.toLowerCase() === 't'`; same for N

2. **What is "next available slot" when the calendar week displayed is not the current week?**
   - What we know: the requirement says "next available time slot" without specifying relative to what; the natural UX interpretation is relative to NOW (current real time), not the displayed week
   - What's unclear: if the user is viewing a past week, should N create a slot in the future (now) or in the viewed week?
   - Recommendation: always scan from now forward, regardless of the displayed `currentWeekStart`; the created workshop will be in the future which is always correct; the calendar view does NOT snap to that week (user lands in create panel with the future date pre-filled)

3. **Should the N shortcut work when the panel is already open?**
   - What we know: the requirement does not address this; the create panel opens via `openCreate` which resets panel state
   - What's unclear: is it confusing to re-open the panel to "create" mode if the user already has a workshop open in "view" mode?
   - Recommendation: allow it — `openCreate` already handles this correctly (it clears `selectedWorkshopId` and sets mode to 'create'); if the panel was open in view mode, it transitions to create mode with the new slot

---

## Sources

### Primary (HIGH confidence)

- Codebase inspection — `/src/components/panel/WorkshopPanel.jsx` — existing Escape listener pattern to remove
- Codebase inspection — `/src/pages/ScheduleCalendar.jsx` — all existing callbacks; `prevWeek`, `nextWeek`, `goToToday`, `closePanel`, `openCreate`, `isPanelOpen`
- Codebase inspection — `/src/utils/coachAvailability.js` — coach availability data shape (for slotFinder context)
- Codebase inspection — `/src/data/workshops.js` — workshop data shape; `startTime` as ISO string, `status` field
- STATE.md architectural decision — "Centralized useKeyboardShortcuts hook with ref pattern — prevents listener leaks and Esc conflicts"
- MDN Web Docs (knowledge, HIGH confidence) — `AbortController` for `addEventListener` cleanup; `KeyboardEvent.key` values; browser support is universal (2021+)

### Secondary (MEDIUM confidence)

- React 19 docs (knowledge) — `useEffect` dependency array behavior; `useCallback` for stable function references

### Tertiary (LOW confidence)

None.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; all tools already in project
- Architecture: HIGH — hook pattern, AbortController, and callback signatures verified directly from codebase
- Pitfalls: HIGH — each pitfall is grounded in actual code in the repository (e.g., existing double-listener risk in WorkshopPanel)
- Slot finder logic: MEDIUM — the algorithm is straightforward but the edge cases (end of week, past week view) have open questions documented above

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (stable — React keyboard event API has not changed in years)
