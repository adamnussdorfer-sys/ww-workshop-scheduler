# Phase 11: Micro-interactions + Empty States - Research

**Researched:** 2026-03-09
**Domain:** CSS animations, Tailwind v4 custom keyframes/easing, React empty state patterns
**Confidence:** HIGH

---

## Summary

Phase 11 delivers four isolated, surgical changes: card hover lift (INTR-06), panel slide easing (INTR-07), conflict dot pulse (INTR-08), and empty week state (EMPT-01). All four use pure CSS/Tailwind — no animation library is needed. The project already uses Tailwind CSS v4 (via `@tailwindcss/vite` plugin) with a `@theme` block in `src/index.css`, which is the correct place to register custom `--animate-*` keyframes and `--ease-*` cubic-bezier tokens.

The existing `WorkshopCard.jsx` already applies `transition-all` on the card wrapper div. That must be refactored: `transition-all` causes unnecessary reflows when box-shadow is animated alongside transform. The correct pattern is `transition-[transform,box-shadow]` (or separate `transition-transform` + `transition-shadow` utilities combined) with an explicit `duration-150` and a custom ease token. The conflict status dot currently renders as a plain `<span>` with a background color — adding the pulse animation requires only adding `animate-conflict-pulse` to that span after registering the keyframe in `@theme`.

The panel (WorkshopPanel.jsx) currently uses `transition-transform duration-200 ease-in-out`. Replacing `ease-in-out` with a custom `--ease-panel-open` cubic-bezier token achieves the snappy open / graceful close distinction. Because open and close use the same transition on the same element, a single asymmetric cubic-bezier cannot produce different easing for each direction natively. The standard approach is to use two different named easing tokens and swap them with a conditional class based on `isOpen`, or accept one well-tuned curve that reads as "snappy" in both directions. The recommended value `cubic-bezier(0.32, 0.72, 0, 1)` (used by Radix UI / shadcn) reads as fast entry, smooth exit and is acceptable for both. If the planner wants truly asymmetric timing (snappier open, slower close), the panel must carry two separate ease classes toggled by `isOpen`.

The empty-week state (EMPT-01) is different in kind from the filter empty state already implemented (EMPT-02/03 in ScheduleCalendar.jsx). EMPT-01 fires when `workshops` for the week contains zero non-Cancelled entries and no filter is active. The existing filter empty state branch already handles `anyFilterActive && weekMatchCount === 0`. The new branch covers `!anyFilterActive && weekWorkshopsCount === 0`. This check lives in ScheduleCalendar.jsx before the CalendarGrid render — no changes to CalendarGrid required.

**Primary recommendation:** All four changes are pure CSS + JSX edits. Define two tokens in `src/index.css` (`--animate-conflict-pulse`, `--ease-panel`), update three component files (WorkshopCard, WorkshopPanel, ScheduleCalendar). No new dependencies.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INTR-06 | Workshop cards lift on hover (2px translate-y + shadow elevation) | CSS `translate-y-[-2px]` + `shadow-md` on hover, `transition-[transform,box-shadow]` — no reflow, GPU-composited |
| INTR-07 | Detail panel uses cubic-bezier easing for slide entrance/exit | Custom `--ease-panel` token in `@theme`, replace `ease-in-out` on `.transition-transform` in WorkshopPanel |
| INTR-08 | Conflict status dot pulses subtly on 2-second cycle | Custom `@keyframes conflict-pulse` in `@theme`, `animate-conflict-pulse` on the conflict dot span |
| EMPT-01 | Empty calendar week shows "No workshops scheduled" + "Create Workshop" CTA | New conditional branch in ScheduleCalendar before CalendarGrid render; week workshop count computed from `visibleWorkshops` filtered to current weekDays |
</phase_requirements>

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS v4 | 4.2.1 (installed) | Utility classes, `@theme` custom tokens, `@keyframes` | Already in project; v4 CSS-first config is the correct approach |
| CSS `@keyframes` + `@theme` | Native | Define `--animate-*` and `--ease-*` tokens | Tailwind v4 tree-shakes unused keyframes — define inside `@theme` for utility generation |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `transition-[transform,box-shadow]` | Tailwind built-in | Scope hover transition to GPU-composited properties only | Always, instead of `transition-all` on cards |
| `motion-reduce:` variant | Tailwind built-in | Disable animations for users who prefer reduced motion | Add to all animated elements |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS `@keyframes` in `@theme` | Framer Motion | Framer is correct for complex orchestration; single 2-second loop needs no JS |
| Custom `--ease-*` token | Arbitrary `ease-[cubic-bezier(...)]` inline | Token is reusable and named; inline is fine for one-off if token feels over-engineered |
| Tailwind `animate-ping` built-in | Custom `@keyframes conflict-pulse` | `animate-ping` scales and fully fades — too aggressive for a "subtle" dot; custom pulse controls opacity floor |

**Installation:** No new packages required.

---

## Architecture Patterns

### Recommended Project Structure

No new files required. All changes are edits to existing files:

```
src/
├── index.css                   # Add --animate-conflict-pulse @keyframes + --ease-panel token
├── components/
│   ├── calendar/
│   │   └── WorkshopCard.jsx    # Hover lift + shadow + scoped transition
│   └── panel/
│       └── WorkshopPanel.jsx   # Swap ease-in-out for custom ease token
└── pages/
    └── ScheduleCalendar.jsx    # Add EMPT-01 empty week branch
```

### Pattern 1: Custom Keyframe in Tailwind v4 @theme

**What:** Define `--animate-*` + nested `@keyframes` inside `@theme` in `src/index.css`. Tailwind v4 generates the `animate-*` utility class and tree-shakes the keyframe if unused.

**When to use:** Any repeating CSS animation needed as a reusable utility class.

**Example:**
```css
/* src/index.css — add inside or after @theme block */
@theme {
  --animate-conflict-pulse: conflict-pulse 2s ease-in-out infinite;

  @keyframes conflict-pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.4; }
  }
}
```

Usage in JSX:
```jsx
<span className={`flex-shrink-0 w-2 h-2 rounded-full ${dotColor} ${hasConflicts ? 'animate-conflict-pulse' : ''}`} />
```

Source: https://tailwindcss.com/docs/animation — "Customizing your theme" section confirms `--animate-*` in `@theme` with nested `@keyframes`.

### Pattern 2: Custom Easing Token in @theme

**What:** Define `--ease-*` CSS variable in `@theme`; Tailwind generates `ease-*` utility class.

**When to use:** Any transition that needs a named cubic-bezier different from the four built-in values.

**Example:**
```css
@theme {
  --ease-panel: cubic-bezier(0.32, 0.72, 0, 1);
}
```

Usage in JSX (WorkshopPanel.jsx):
```jsx
/* Replace: ease-in-out */
/* With:    ease-panel   */
className={`... transition-transform duration-250 ease-panel ...`}
```

The value `cubic-bezier(0.32, 0.72, 0, 1)` is the easing used by Radix UI primitives (Dialog, Sheet). It produces a fast deceleration (snappy arrival) with a gentle tail. It works acceptably for both open and close directions.

If the planner wants truly asymmetric easing (snappier open, slower close), use two tokens and toggle them:
```css
@theme {
  --ease-panel-open:  cubic-bezier(0.32, 0.72, 0, 1);
  --ease-panel-close: cubic-bezier(0.4, 0, 0.6, 1);
}
```
```jsx
className={`... ease-${isOpen ? 'panel-open' : 'panel-close'} ...`}
```

Source: https://tailwindcss.com/docs/transition-timing-function — `--ease-*` in `@theme` section.

### Pattern 3: Card Hover Lift (no reflow, no click target expansion)

**What:** Apply `hover:-translate-y-0.5 hover:shadow-md` with `transition-[transform,box-shadow]`. Translate-y-0.5 in Tailwind is 2px. Scoping the transition to `transform` and `box-shadow` prevents unnecessary reflow from unrelated property triggers.

**Critical constraint:** `translate-y` moves the rendered card visually but does NOT change layout box, so click target stays fixed. Do not use `margin-top` or `top` offsets — those trigger layout.

**Example:**
```jsx
// WorkshopCard.jsx — the outer div className
className={`
  h-full overflow-hidden rounded text-xs px-1.5 py-1 cursor-pointer relative
  transition-[transform,box-shadow] duration-150 ease-out
  hover:-translate-y-0.5 hover:shadow-md
  ${cardStyle} ${ringClass}
  ${isFiltered ? ' opacity-25 pointer-events-none' : ''}
`}
```

Note: Remove `hover:brightness-95` (already on the card). The lift + shadow elevation is the replacement hover signal. `brightness-95` is a filter operation and triggers compositing of a new layer — it can interact with shadow visually. Keep one hover signal, not two.

Source: MDN CSS transitions, Tailwind docs — `translate-*` uses CSS `transform: translateY()` which is GPU-composited and does not trigger layout.

### Pattern 4: Empty Week State in ScheduleCalendar

**What:** Before rendering `<CalendarGrid>`, check if the current week has zero visible (non-Cancelled) workshops when no filter is active.

**Where:** ScheduleCalendar.jsx, inside the `viewMode === 'week'` branch, alongside the existing filter empty state check.

**Example:**
```jsx
// Derive week workshop count — add near other filter computed values
const weekWorkshopsCount = useMemo(() => {
  return weekDays.reduce((count, day) => {
    return count + workshops.filter(
      ws => ws.status !== 'Cancelled' && isSameDay(parseISO(ws.startTime), day)
    ).length;
  }, 0);
}, [workshops, weekDays]);

// In render — existing filter empty state check:
anyFilterActive && weekMatchCount === 0 ? (
  <FilterEmptyState />
) : !anyFilterActive && weekWorkshopsCount === 0 ? (
  <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
    <p className="text-slate-500 text-sm">No workshops scheduled this week.</p>
    <button
      type="button"
      onClick={openNewWithNextSlot}
      className="px-4 py-2 bg-ww-blue text-white text-sm font-medium rounded hover:bg-ww-navy transition-colors"
    >
      Create Workshop
    </button>
  </div>
) : (
  <CalendarGrid ... />
)
```

Note: `openNewWithNextSlot` is already defined in ScheduleCalendar and wired to keyboard shortcut N. Reuse it directly.

### Anti-Patterns to Avoid

- **`transition-all` on cards:** Triggers transition on any CSS property change including those that cause reflow (padding, border-width). Scope to `transition-[transform,box-shadow]`.
- **`height` or `margin` for lift effect:** Both trigger layout recalculation. Use `translate-y` only.
- **`animate-ping` for conflict dot:** It scales to 2x and fades completely — too loud for "subtle" status indication. Use custom keyframe controlling only opacity floor.
- **`transform: scale()` for pulse:** Scale causes layout jitter when the card is in a tightly constrained absolute position container. Opacity-only pulse is safer in the grid context.
- **Inline arbitrary `ease-[...]`:** Acceptable for one-offs but a named token is more maintainable across WorkshopPanel's two class strings (backdrop and slide panel).
- **Defining `@keyframes` outside `@theme`:** Valid CSS but Tailwind v4 won't generate the utility class automatically. Must pair `--animate-name: name duration easing iteration` inside `@theme` with the `@keyframes` block.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Repeating CSS animation | JS-driven rAF loop | CSS `@keyframes` + `animate-*` | Browser compositor handles loop; no JS overhead |
| Pulse animation | Custom React component with `useState` interval | CSS `@keyframes` with `infinite` | CSS loops are decoupled from React render cycle |
| Panel easing curve | JS spring physics library | CSS `cubic-bezier()` | Native CSS is sufficient for single-axis slide; Framer needed only for complex gesture/spring chains |

**Key insight:** For animations that are independent of React state (looping pulse, hover lift), CSS is the correct tool. JS animation is only needed when the animation value must react to live data mid-animation.

---

## Common Pitfalls

### Pitfall 1: transition-all causes shadow + transform to fight at different rates

**What goes wrong:** When `transition-all` is used, every CSS property on the element transitions on state change. If another class or browser default also transitions (e.g., `opacity: 0.25` for filtered state), the timing conflicts visually.

**Why it happens:** `transition-all` creates a transition for every animatable CSS property.

**How to avoid:** Scope to `transition-[transform,box-shadow]` so only the two targeted properties animate on hover. The `isFiltered` opacity change will be instant (acceptable) or can have its own separate `transition-opacity`.

**Warning signs:** Card appears to "snap" on filter state change while hover still plays.

### Pitfall 2: Conflict dot animation applies to all status dots, not just conflict ones

**What goes wrong:** If `animate-conflict-pulse` is added to the status dot span unconditionally (or keyed only off `dotColor`), it pulses for Draft and Published workshops too.

**Why it happens:** `dotColor` reflects status; conflict is tracked separately via `conflicts` prop.

**How to avoid:** Gate the animation class on `hasConflicts`, not on `dotColor`. The existing `hasConflicts` boolean is already computed in WorkshopCard.jsx.

**Warning signs:** Green Published dots pulsing.

### Pitfall 3: Panel easing class toggled on the wrong element

**What goes wrong:** WorkshopPanel.jsx has two animated elements: the backdrop div and the slide panel div. Applying the ease class to the wrong one produces wrong visual result.

**Why it happens:** Two separate `transition-*` declarations for backdrop (opacity) and panel (transform).

**How to avoid:** Apply `ease-panel` only to the slide panel div (`transition-transform duration-250 ease-panel`). The backdrop uses `duration-200` with default `ease-out` — it does not need the custom cubic-bezier.

### Pitfall 4: Empty week state shown when filters are active with zero results

**What goes wrong:** If both `weekWorkshopsCount === 0` and `anyFilterActive` are true (filtered week with no match), the wrong empty state renders.

**Why it happens:** Priority ordering of conditional branches.

**How to avoid:** Filter empty state check must be evaluated FIRST. The structure must be:
1. `anyFilterActive && weekMatchCount === 0` → filter empty state
2. `!anyFilterActive && weekWorkshopsCount === 0` → "No workshops scheduled" state
3. Otherwise → CalendarGrid

### Pitfall 5: @keyframes defined outside @theme does not generate utility class

**What goes wrong:** The `animate-conflict-pulse` class does not exist in the compiled CSS.

**Why it happens:** Tailwind v4 generates `animate-*` utilities only when there is a corresponding `--animate-*` variable in `@theme`.

**How to avoid:** The `@keyframes` block must be nested inside `@theme` alongside its `--animate-*` variable. If the keyframe must be global (for non-utility use), define it outside `@theme` and also define the variable inside `@theme`.

---

## Code Examples

Verified patterns from official sources and codebase inspection:

### Complete @theme additions for src/index.css

```css
/* Add inside the existing @theme block in src/index.css */
@theme {
  /* Existing tokens ... */

  /* INTR-07: Panel slide easing */
  --ease-panel: cubic-bezier(0.32, 0.72, 0, 1);

  /* INTR-08: Conflict dot pulse */
  --animate-conflict-pulse: conflict-pulse 2s ease-in-out infinite;

  @keyframes conflict-pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.35; }
  }
}
```

### WorkshopCard.jsx hover lift (INTR-06 + INTR-08)

```jsx
// Outer div — replace current className
className={`
  h-full overflow-hidden rounded text-xs px-1.5 py-1 cursor-pointer relative
  transition-[transform,box-shadow] duration-150 ease-out
  hover:-translate-y-0.5 hover:shadow-md
  motion-reduce:transition-none motion-reduce:hover:transform-none
  ${cardStyle} ${ringClass}
  ${isFiltered ? ' opacity-25 pointer-events-none' : ''}
`}

// Status dot span — add conflict-pulse (INTR-08)
<span className={`
  flex-shrink-0 w-2 h-2 rounded-full ${dotColor}
  ${hasConflicts ? 'animate-conflict-pulse motion-reduce:animate-none' : ''}
`} />
```

### WorkshopPanel.jsx easing update (INTR-07)

```jsx
// Slide panel div — replace ease-in-out with ease-panel, bump duration slightly
className={`fixed right-0 top-0 h-screen w-[400px] bg-white z-30 shadow-2xl
  flex flex-col transition-transform duration-250 ease-panel
  ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
```

Note: `duration-250` is not a default Tailwind token; use `duration-[250ms]` (arbitrary) or keep `duration-200`. The difference between 200ms and 250ms is imperceptible — keep `duration-200` unless the planner wants to tweak.

### ScheduleCalendar.jsx empty week state (EMPT-01)

```jsx
// Add derived count (near weekMatchCount)
const weekWorkshopsCount = useMemo(() => {
  return weekDays.reduce((count, day) => {
    return count + workshops.filter(
      (ws) => ws.status !== 'Cancelled' && isSameDay(parseISO(ws.startTime), day)
    ).length;
  }, 0);
}, [workshops, weekDays]);

// Render branch (replaces current filter-only branch)
{viewMode === 'week' && (
  anyFilterActive && weekMatchCount === 0 ? (
    // existing filter empty state
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <p className="text-slate-600 text-sm font-medium mb-2">{emptyMessage}</p>
      <button type="button" onClick={clearFilters} className="text-ww-blue text-sm underline hover:text-ww-navy">
        Clear filters
      </button>
    </div>
  ) : !anyFilterActive && weekWorkshopsCount === 0 ? (
    // EMPT-01 — no workshops this week
    <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
      <p className="text-slate-500 text-sm">No workshops scheduled this week.</p>
      <button
        type="button"
        onClick={openNewWithNextSlot}
        className="px-4 py-2 bg-ww-blue text-white text-sm font-medium rounded hover:bg-ww-navy transition-colors"
      >
        Create Workshop
      </button>
    </div>
  ) : (
    <CalendarGrid
      weekDays={weekDays}
      workshops={workshops}
      coaches={coaches}
      conflictMap={conflictMap}
      onWorkshopClick={openWorkshop}
      onSlotClick={openCreate}
      filteredIds={filteredIds}
      anyFilterActive={anyFilterActive}
      showOverlay={showOverlay}
    />
  )
)}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.js` for custom keyframes | `@theme` in CSS with `--animate-*` | Tailwind v4 (2024) | No JS config file needed; CSS-first is idiomatic |
| `transition-all` for card hover | `transition-[transform,box-shadow]` | Best practice always; Tailwind v4 makes it easy | Avoids reflow-triggering property transitions |
| Framer Motion for all animations | CSS `@keyframes` for simple loops | Ecosystem trend 2023+ | Reduces JS bundle; compositor handles loop |

**Deprecated/outdated:**
- `tailwind.config.js` `theme.extend.keyframes` / `theme.extend.animation`: Valid in v3 but not used in this project (v4). The CSS `@theme` block is the v4 equivalent.
- `animate-ping` for status indicators: Too aggressive (full scale + full fade); custom keyframe is the correct choice for subtle status dots.

---

## Open Questions

1. **Should the conflict dot pulse on the `AlertTriangle` icon or the status dot?**
   - What we know: The spec says "status dot" (INTR-08). The current card shows both an `AlertTriangle` icon (top-right) and a status dot (bottom-left color dot).
   - What's unclear: The "conflict status dot" in the spec might mean the triangle icon, not the round status dot. The status dot color reflects Published/Draft/Cancelled — it does not change color on conflict.
   - Recommendation: Pulse the `AlertTriangle` icon wrapper (since it is the conflict indicator), not the status dot. Alternatively, pulse both. Planner should decide; both are one-line changes.

2. **Single cubic-bezier vs. asymmetric open/close easing for panel**
   - What we know: CSS transitions run the same curve in both directions on a single element. True asymmetry requires toggling a class based on `isOpen` state.
   - What's unclear: Success criterion says "snappy open, graceful close" — this implies asymmetric intent.
   - Recommendation: Use two named ease tokens (`ease-panel-open` / `ease-panel-close`) toggled by `isOpen` prop for true asymmetry. This is a two-line change and makes the intent explicit. Document the decision clearly in the plan.

3. **`weekWorkshopsCount` computation already exists partially in `weekMatchCount`**
   - What we know: `weekMatchCount` short-circuits with `-1` when no filters active. It already iterates weekDays + workshops.
   - What's unclear: Whether to reuse `weekMatchCount` logic (by removing the `-1` early return when no filters) or add a separate `weekWorkshopsCount` memo.
   - Recommendation: Add a separate `weekWorkshopsCount` memo. It runs only when `!anyFilterActive` would show the empty state, and the name is unambiguous. Modifying `weekMatchCount` sentinel logic risks breaking the existing filter empty state branch.

---

## Sources

### Primary (HIGH confidence)

- https://tailwindcss.com/docs/animation — Confirmed `--animate-*` in `@theme` with nested `@keyframes`; built-in animate utilities; `motion-safe:`/`motion-reduce:` variants
- https://tailwindcss.com/docs/transition-timing-function — Confirmed `--ease-*` in `@theme`; arbitrary `ease-[cubic-bezier(...)]` syntax
- https://tailwindcss.com/docs/transition-property — Confirmed `transition-[transform,box-shadow]` arbitrary property scoping; `transition-transform` built-in

### Secondary (MEDIUM confidence)

- MDN CSS transitions (referenced via WebSearch results) — Confirmed `transform: translateY()` does not trigger layout reflow; composited in GPU
- CSS-Tricks cubic-bezier guide (via WebSearch) — Confirmed `cubic-bezier(0.32, 0.72, 0, 1)` as a common "snappy deceleration" curve used in UI panels

### Tertiary (LOW confidence)

- "Radix UI / shadcn use cubic-bezier(0.32, 0.72, 0, 1)" — cited from training knowledge; not directly verified against Radix source in this session. The curve value itself is verifiable with any bezier tool and is a known good value for panel easing.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Tailwind v4 official docs verified, no new packages needed
- Architecture: HIGH — All changes are additive edits to three existing files; patterns verified against current codebase
- Pitfalls: HIGH — Derived from direct inspection of WorkshopCard.jsx (`transition-all`, `hover:brightness-95`), WorkshopPanel.jsx (current `ease-in-out`), and ScheduleCalendar.jsx (conditional branch structure)

**Research date:** 2026-03-09
**Valid until:** 2026-06-09 (Tailwind v4 stable; CSS animations are stable)
