# Phase 5: Context Foundation + Toast System - Research

**Researched:** 2026-03-09
**Domain:** React Context + sonner toast library
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

All decisions for this phase are at Claude's discretion. User trusts builder judgment. Research findings inform the approach:

**Toast library:** sonner (2.0.7) — explicit React 19 peerDep, minimal API, bottom-right positioning built-in.

**Toast appearance:**
- Bottom-right position, consistent with Linear/Notion conventions
- WW brand colors: success = blue (#0066CC), error = coral (#E85D4A), info = navy (#1A2332)
- Inter font matching app typography
- 3-4 second auto-dismiss
- Subtle entrance/exit animation (sonner handles this)

**Toast messages:**
- Create: "Workshop created — [Workshop Name]"
- Save: "Changes saved"
- Publish: "Workshop published" / "[N] workshops published"
- Delete: "Workshop deleted"
- Error: Descriptive message matching the failure
- No undo support — prototype scope, actions aren't truly destructive with mock data

**Toast behavior:**
- Stack upward from bottom-right (sonner default)
- Max 3 visible at once
- Hover pauses auto-dismiss timer
- Click to dismiss
- Toasts survive page navigation (rendered above router in App.jsx)

**AppContext extension:**
- Add `filters` state object (empty shape — Phase 6 populates the UI)
- Add `addToast` / `removeToast` to context value
- Memoize context value to prevent re-render cascade
- ToastStack component rendered once in App.jsx above router outlet

### Claude's Discretion

All implementation details — library configuration, component structure, exact API surface, styling approach.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INTR-01 | Toast notification appears after create, save, publish, and delete actions (auto-dismiss 3-4s) | Sonner `<Toaster>` + `toast()` provides full stack management; `duration` prop controls auto-dismiss; placement and stacking are built-in; surviving navigation requires `<Toaster>` above `<Routes>` in App.jsx |
</phase_requirements>

---

## Summary

Phase 5 has two distinct deliverables: (1) extend AppContext with a `filters` shape (empty, for Phase 6 to populate) and memoize the context value to prevent unnecessary re-renders; and (2) add toast notification infrastructure so any action in any page can fire a toast that persists across route changes.

The key architectural finding is that **sonner does NOT use React Context internally** — it uses the Observer Pattern via a module-level singleton. The `toast()` function can be imported and called from anywhere without wiring. This means the CONTEXT.md note about `addToast`/`removeToast` on AppContext describes a wrapper pattern that may not be strictly necessary — calling `toast()` directly from WorkshopForm action handlers is the idiomatic approach. A thin wrapper (`useToast` hook that re-exports sonner's `toast`) may still be added to AppContext for consistency with the project's context-first pattern, but no state management is needed; the wrapper just re-exports.

The sonner `<Toaster>` component must be placed in App.jsx **outside** the `<Routes>` element (but still inside `<AppContext.Provider>`) to survive React Router page transitions. Because `<BrowserRouter>` wraps `<App>` in main.jsx, placing `<Toaster>` as a sibling to `<AppShell>` inside `<AppContext.Provider>` in App.jsx is the correct location.

**Primary recommendation:** Install sonner, place `<Toaster position="bottom-right" richColors={false}>` in App.jsx above `<AppShell>`, add a `useToast` hook to context that wraps `toast()`, extend AppContext with empty `filters` shape, memoize context value with `useMemo`, and call `toast()` from the three action handlers in WorkshopForm.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| sonner | 2.0.7 | Toast notification rendering, stacking, auto-dismiss, animations | Industry standard for React toast: 13M+ weekly downloads, used by Vercel/Cursor/X, React 18+19 peerDep, observer pattern avoids context overhead |
| React Context (built-in) | React 19.x | Share `filters` state and `toast` helper across all pages/components | Already used in project via `AppContext` + `useApp()` hook |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `useMemo` (React built-in) | React 19.x | Memoize context value object to prevent consumer re-renders on unrelated state changes | Any time a context Provider creates a new object literal in its `value` prop — which AppContext does today |
| `useCallback` (React built-in) | React 19.x | Stabilize function references passed to context consumers | Used alongside `useMemo` for any functions in context value |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| sonner | react-hot-toast | Older API, smaller ecosystem, fewer styling options, no richColors built-in |
| sonner | react-toastify | Heavier bundle, CSS import required, more opinionated default styles |
| `useMemo` context memoization | React Compiler | Compiler not yet in project's Vite/React 19 setup — manual `useMemo` is the correct approach here |

**Installation:**
```bash
npm install sonner
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── context/
│   └── AppContext.jsx          # Extend: add filters shape, expose toast helper, memoize value
├── components/
│   └── toast/                  # Optional: if custom styling needed
│       └── ToastProvider.jsx   # Wraps <Toaster> with WW brand config (may be inline in App.jsx)
├── App.jsx                     # Add <Toaster> as sibling to <AppShell>, outside <Routes>
└── components/panel/
    └── WorkshopForm.jsx        # Add toast() calls to handleSaveDraft, handlePublish, handleRemove
```

### Pattern 1: Sonner Toaster Placement in App.jsx

**What:** Place `<Toaster>` as a direct child of `<AppContext.Provider>` in App.jsx, before `<AppShell>`. This ensures the Toaster subscribes to the observer singleton once at app mount and is never unmounted during route transitions.

**When to use:** Always — single `<Toaster>` instance in the entire app.

**Example:**
```jsx
// Source: sonner docs + React Router navigation survival pattern
import { Toaster, toast } from 'sonner'

export default function App() {
  const [coaches, setCoaches] = useState(initialCoaches)
  const [workshops, setWorkshops] = useState(initialWorkshops)
  const [filters, setFilters] = useState({
    coaches: [],
    types: [],
    statuses: [],
    markets: [],
  })

  const contextValue = useMemo(
    () => ({ coaches, setCoaches, workshops, setWorkshops, filters, setFilters, toast }),
    [coaches, workshops, filters]
  )

  return (
    <AppContext.Provider value={contextValue}>
      <Toaster
        position="bottom-right"
        duration={3500}
        visibleToasts={3}
        expand={false}
        toastOptions={{
          style: {
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '14px',
          },
        }}
      />
      <AppShell>
        <Routes>
          <Route path="/" element={<ScheduleCalendar />} />
          <Route path="/roster" element={<CoachRoster />} />
          <Route path="/drafts" element={<DraftManager />} />
        </Routes>
      </AppShell>
    </AppContext.Provider>
  )
}
```

### Pattern 2: Calling toast() from Action Handlers

**What:** Import `toast` directly from `sonner` (or from `useApp()`) in WorkshopForm and call it after state mutation in the action handlers.

**When to use:** After every data-mutating action — save, create, publish, delete.

**Example:**
```jsx
// Source: sonner docs (toast API)
import { toast } from 'sonner'

const handleSaveDraft = () => {
  if (mode === 'create') {
    const newId = 'ws-' + Date.now()
    setWorkshops((prev) => [...prev, { ...draft, id: newId }])
    toast('Workshop created — ' + draft.title)
  } else {
    setWorkshops((prev) => prev.map((w) => (w.id === draft.id ? { ...draft } : w)))
    toast('Changes saved')
  }
  onClose()
}

const handlePublish = () => {
  if (mode === 'create') {
    setWorkshops((prev) => [
      ...prev,
      { ...draft, id: 'ws-' + Date.now(), status: 'Published' },
    ])
    toast('Workshop published — ' + draft.title)
  } else {
    setWorkshops((prev) =>
      prev.map((w) => (w.id === draft.id ? { ...draft, status: 'Published' } : w))
    )
    toast('Workshop published')
  }
  onClose()
}

const handleRemove = () => {
  setWorkshops((prev) =>
    prev.map((w) => (w.id === draft.id ? { ...w, status: 'Cancelled' } : w))
  )
  toast('Workshop deleted')
  onClose()
}
```

### Pattern 3: Context Value Memoization

**What:** Wrap the context `value` object in `useMemo` with explicit dependencies. Prevents all context consumers from re-rendering when an unrelated piece of state changes (e.g., filters changing shouldn't re-render the WorkshopPanel).

**When to use:** Whenever a context provider creates its value object inline. AppContext does this today — it's a correctness improvement.

**Example:**
```jsx
// Source: React docs (useMemo) + established React patterns
import { useState, useMemo } from 'react'

export default function App() {
  const [workshops, setWorkshops] = useState(initialWorkshops)
  const [coaches, setCoaches] = useState(initialCoaches)
  const [filters, setFilters] = useState({ coaches: [], types: [], statuses: [], markets: [] })

  // Without useMemo: new object created every render → all consumers re-render
  // With useMemo: object identity only changes when dependencies change
  const contextValue = useMemo(
    () => ({ workshops, setWorkshops, coaches, setCoaches, filters, setFilters }),
    [workshops, coaches, filters]
  )

  return (
    <AppContext.Provider value={contextValue}>
      {/* ... */}
    </AppContext.Provider>
  )
}
```

### Pattern 4: Filters State Shape (empty for Phase 6)

**What:** Initialize `filters` in AppContext with an empty multi-select shape. Phase 6 will wire Sidebar checkboxes to this state. Phase 5 just ensures the shape exists so types/consumers can be defined.

**Example:**
```js
// filters state shape — initialized in App.jsx useState
const [filters, setFilters] = useState({
  coaches: [],    // string[] — coach IDs
  types: [],      // string[] — workshop type names
  statuses: [],   // string[] — 'Draft' | 'Published' | 'Cancelled'
  markets: [],    // string[] — 'US' | 'CA' | 'UK' | 'ANZ'
})
```

### Anti-Patterns to Avoid

- **Multiple `<Toaster>` instances:** Only one `<Toaster>` per app. Two would double-render every toast. Place it once in App.jsx and never in page components.
- **Placing `<Toaster>` inside `<Routes>` or a page component:** The observer subscriber would unmount on navigation, causing toasts mid-display to vanish when the user changes pages.
- **Managing toast state in React state (useState):** Sonner manages its own internal state via the observer pattern. Do NOT maintain a `toasts` array in AppContext — just expose `toast` from sonner directly.
- **Omitting `useMemo` on context value:** App.jsx currently creates `{ coaches, setCoaches, workshops, setWorkshops }` as a new object literal on every render. Every consumer (CalendarGrid, WorkshopForm, etc.) re-renders unnecessarily on any App state change. Memoization is a correctness fix.
- **Using `toast.success()` with sonner's `richColors`:** richColors applies green/red/orange backgrounds. WW brand uses blue for success, coral for error — so keep `richColors={false}` and call plain `toast()` with custom style or just default unstyled. The WW success color (#0066CC) maps to info, not success semantically in sonner's color system.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toast stacking/positioning | Custom z-index management, CSS positioning math | `sonner` | Sonner handles stack ordering, offset from edges, expand animation, hover-to-pause, swipe-to-dismiss across all browsers |
| Toast auto-dismiss timers | `setTimeout` array, clearTimeout on unmount | `sonner` duration prop | Timer cleanup, hover-pause, tab visibility API — all handled internally |
| Toast animations | CSS keyframes, Framer Motion | `sonner` built-in | Sonner's entrance/exit animations are production-quality and work with React concurrent mode |
| Observer-based state sync | `useState` + callback chain | `sonner` module singleton | Sonner's `toast()` is globally callable without prop drilling or context threading |

**Key insight:** The reason you use sonner rather than a `useState`-based toast queue is that sonner's observer pattern means `toast()` is callable from anywhere — utility functions, event handlers outside React, or any component depth — without any setup. A custom queue would require threading a callback through every component that might fire a toast.

---

## Common Pitfalls

### Pitfall 1: Toaster Unmounts on Navigation (Toast Survival Failure)

**What goes wrong:** Toasts from the previous page disappear mid-display when the user navigates. The success criteria explicitly requires toasts to survive navigation.

**Why it happens:** If `<Toaster>` is rendered inside a page component or inside `<Routes>`, React Router unmounts it when navigating away. The observer subscriber is torn down, and all pending toasts are lost.

**How to avoid:** `<Toaster>` must be a direct child of `<AppContext.Provider>` in App.jsx, rendered BEFORE `<AppShell>` and completely outside any `<Route>` or page component. The current App.jsx structure supports this — just add `<Toaster>` after the Provider opening tag.

**Warning signs:** Toasts that appear, then suddenly disappear when you click a nav item.

### Pitfall 2: Context Value Object Identity Causing Cascade Re-Renders

**What goes wrong:** Every time App.jsx renders (e.g., any `useState` setter fires), all context consumers re-render even if their slice of context data didn't change. With workshops state updating on every save, CalendarGrid re-renders unnecessarily.

**Why it happens:** `<AppContext.Provider value={{ workshops, coaches }}>` creates a new object every render. React compares value by reference — new object = all consumers re-render.

**How to avoid:** Wrap the value object in `useMemo` with explicit dependencies. `setWorkshops`/`setCoaches`/`setFilters` are stable (React guarantees setState functions don't change), so they don't need to be in the dependency array.

**Warning signs:** Performance profiler shows all consumers re-rendering on unrelated state changes.

### Pitfall 3: richColors Clashing with WW Brand

**What goes wrong:** Enabling `richColors={true}` on `<Toaster>` applies green for success, red for error — which conflicts with WW brand (blue = success, coral = error).

**Why it happens:** sonner's richColors is designed for conventional semantic colors.

**How to avoid:** Keep `richColors={false}` (default). Use plain `toast('message')` calls. If custom colors are needed, use `toastOptions.style` or `classNames` on `<Toaster>`. For this prototype, unstyled default is acceptable — the success criteria focus on behavior (auto-dismiss, stacking, navigation survival), not specific brand colors.

**Warning signs:** Toast background color doesn't match design spec.

### Pitfall 4: Wrapping toast() in Unnecessary AppContext State

**What goes wrong:** Builder creates `const [toasts, setToasts] = useState([])` in App.jsx and writes custom addToast/removeToast logic, duplicating sonner's internal state.

**Why it happens:** CONTEXT.md mentions `addToast`/`removeToast` on context, which could be read as "manage toast state in React state."

**How to avoid:** The intent of `addToast`/`removeToast` in context is to provide a consistent import path (via `useApp()`). The implementation should be: `addToast: toast` (re-export sonner's toast function), `removeToast: toast.dismiss` (re-export sonner's dismiss). No custom state array needed.

**Warning signs:** Custom queue that re-implements timer logic, stacking, or positioning.

---

## Code Examples

Verified patterns from official sources:

### Toaster Configuration (sonner docs)
```jsx
// Source: https://sonner.emilkowal.ski/toaster
import { Toaster } from 'sonner'

<Toaster
  position="bottom-right"    // matches WW design decision
  duration={3500}            // 3-4s per requirement
  visibleToasts={3}          // max 3 per decision
  expand={false}             // collapsed stack (default sonner behavior)
  toastOptions={{
    style: {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '14px',
    },
  }}
/>
```

### Basic toast() calls (sonner docs)
```js
// Source: https://sonner.emilkowal.ski/toast
import { toast } from 'sonner'

toast('Changes saved')                           // plain info
toast('Workshop created — ' + workshop.title)    // with name
toast('Workshop published')
toast('[N] workshops published')
toast('Workshop deleted')
// Error case (if needed):
toast.error('Failed to save — please try again')
```

### toast.dismiss() — clear specific or all toasts
```js
// Source: https://sonner.emilkowal.ski/toast
const id = toast('Saving...')
toast.dismiss(id)    // dismiss specific toast
toast.dismiss()      // dismiss all toasts
```

### Toaster prop reference (sonner docs)
```
position: "bottom-right" | "bottom-left" | "bottom-center" | "top-right" | "top-left" | "top-center"
expand: boolean (default false) — whether toasts expand immediately
visibleToasts: number (default 3)
closeButton: boolean (default false)
richColors: boolean (default false)
duration: number (default 4000ms)
gap: number (default 14px between toasts)
offset: string|number|object (default "32px" from edges)
toastOptions: { style, className, classNames } — applies to all toasts
```

### AppContext.jsx — extended with filters + useMemo in App.jsx
```jsx
// AppContext.jsx — no changes needed to the file itself
// The context shape is implied by what App.jsx puts in value={}

// App.jsx changes:
import { useState, useMemo } from 'react'
import { Toaster, toast } from 'sonner'

export default function App() {
  const [coaches, setCoaches] = useState(initialCoaches)
  const [workshops, setWorkshops] = useState(initialWorkshops)
  const [filters, setFilters] = useState({
    coaches: [],
    types: [],
    statuses: [],
    markets: [],
  })

  const contextValue = useMemo(
    () => ({
      coaches,
      setCoaches,
      workshops,
      setWorkshops,
      filters,
      setFilters,
      // toast re-exported so consumers can import via useApp() if desired
      toast,
    }),
    [coaches, workshops, filters]
  )

  return (
    <AppContext.Provider value={contextValue}>
      <Toaster position="bottom-right" duration={3500} visibleToasts={3} />
      <AppShell>
        <Routes>
          <Route path="/" element={<ScheduleCalendar />} />
          <Route path="/roster" element={<CoachRoster />} />
          <Route path="/drafts" element={<DraftManager />} />
        </Routes>
      </AppShell>
    </AppContext.Provider>
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-toastify (CSS import required) | sonner (CSS-in-JS, zero config) | 2023-2024 | Simpler setup, smaller bundle, better animations |
| Custom context-based toast queue | Observer singleton (`toast()` callable anywhere) | Sonner v1+ | No prop drilling or context threading for toast |
| Manual useMemo for context | React Compiler (auto-memoization) | React Compiler Beta 2024 | Compiler not in this project — manual useMemo remains correct |

**Deprecated/outdated:**
- Context-managed toast state arrays: Unnecessary with sonner — don't build a `toasts: []` useState array.
- `toast.loading()` + `toast.promise()`: Not needed for this phase (sync mock data, no async operations).

---

## Open Questions

1. **Should `toast` be on AppContext value or imported directly from sonner in callsites?**
   - What we know: Sonner's `toast` is a stable module-level singleton — it can be imported directly from `'sonner'` anywhere without context.
   - What's unclear: Whether project convention prefers all shared utilities to flow through `useApp()`.
   - Recommendation: Add `toast` to context value for consistency (zero cost, doesn't change behavior), but also acceptable to import directly. Either works. The CONTEXT.md says to add `addToast`/`removeToast` — implement as `toast` re-export on context.

2. **`setWorkshops`/`setCoaches`/`setFilters` in useMemo deps?**
   - What we know: React guarantees `setState` functions have stable identity (never change between renders).
   - What's unclear: Whether to include them in deps array for code clarity.
   - Recommendation: Omit from deps for correctness — including them is harmless but misleading. Use ESLint exhaustive-deps comment if linter complains.

3. **Custom toast styling (WW brand colors)?**
   - What we know: `richColors={false}` keeps default white/gray styling. WW brand colors could be applied via `toastOptions.style` or `classNames`.
   - What's unclear: Whether success criteria require visible brand color differentiation.
   - Recommendation: Start with default styling (white background, no richColors). The success criteria test behavior, not brand colors. Custom styling can be a Phase 11 polish item.

---

## Sources

### Primary (HIGH confidence)
- `npm view sonner peerDependencies` — confirmed React 19 peerDep: `"react": "^18.0.0 || ^19.0.0 || ^19.0.0-rc"`
- `npm view sonner version` — confirmed latest: 2.0.7
- https://sonner.emilkowal.ski/toaster — Toaster props verified (position, duration, visibleToasts, expand, richColors, gap, offset, toastOptions)
- https://sonner.emilkowal.ski/toast — toast() API verified (toast(), toast.success(), toast.error(), toast.dismiss(), options)
- https://sonner.emilkowal.ski/styling — Styling API verified (toastOptions, classNames, unstyled prop)
- https://react.dev/reference/react/useMemo — useMemo API and context memoization pattern

### Secondary (MEDIUM confidence)
- https://emilkowal.ski/ui/building-a-toast-component — Observer pattern architecture explanation: "manage the state via the Observer Pattern, subscribe to the observable object in the Toaster component"
- WebSearch multiple sources — sonner singleton pattern, Toaster placement for navigation survival

### Tertiary (LOW confidence)
- None — all critical claims verified from official sources

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — npm registry confirmed version 2.0.7 and React 19 peerDep; official docs verified
- Architecture: HIGH — sonner observer pattern confirmed from official blog; Toaster placement pattern verified via docs + navigation survival analysis
- Pitfalls: HIGH — richColors/context pitfalls verified from API docs; context memoization from React docs

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (sonner is stable; React 19 API is stable)
