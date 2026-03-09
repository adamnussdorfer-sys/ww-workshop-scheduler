# Stack Research

**Domain:** React scheduling UI — interactive polish milestone (filters, sortable tables, batch ops, toast notifications, keyboard shortcuts, micro-interactions)
**Researched:** 2026-03-09
**Confidence:** HIGH

## Context

This is a subsequent-milestone research file. The core stack is locked:

- React 19.2.0, Vite 8, Tailwind CSS v4, date-fns 4.1, Lucide React 0.577, vitest 4.0
- No state library — all state in React hooks
- No backend — mock data only
- 2,629 LOC shipped

This document covers ONLY additions needed for v1.1 features. Do not re-evaluate the existing stack.

## Recommended Stack

### New Libraries to Add

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| sonner | 2.0.7 | Toast notifications | Explicitly supports React 19 (`"^18.0.0 \|\| ^19.0.0"` in peerDeps). Opinionated design that matches Linear/Notion aesthetic. Zero config. Lighter than react-toastify. 4KB gzipped. |
| react-hotkeys-hook | 5.2.4 | Keyboard shortcuts | Standard hook-based API (`useHotkeys`). Peer dep `>=16.8` works fine with React 19 (no compatibility issues reported). Simple: `useHotkeys('arrowleft', callback)`. Scope-aware. |
| @tanstack/react-table | 8.21.3 | Sortable coach roster table | Headless — no UI opinions, pairs perfectly with Tailwind v4. Tree-shakable (import only sort + core row models). 15KB vs 50KB+ for opinionated alternatives. Peer dep `>=16.8`. Standard in React ecosystem. |

### What Requires NO New Library

| Feature | Approach | Why No Library Needed |
|---------|----------|----------------------|
| Sidebar filters | `useState` + `useMemo` derived arrays | Filtering 18 coaches / 48 workshops is trivial — no virtualization or debouncing needed. Pattern: `filteredWorkshops = useMemo(() => workshops.filter(...)`, deps on filter state. |
| Highlight/dim on filter | Tailwind `opacity-30` conditional class | Pure CSS — add `opacity-30 pointer-events-none` to non-matching cards, `ring-2` to matches. No library. |
| Batch publish checkboxes | `useState(new Set())` for `selectedIds` | Select-all/deselect pattern with `Set` is 10 lines of vanilla React. No form library needed. |
| Confirmation modal | Controlled `useState(false)` + portal-free modal | Already have a modal pattern from WorkshopPanel. Reuse overlay + translate-x approach. |
| Micro-interactions (hover lift, button press) | Tailwind transition utilities | Already used in project: `transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md`. Tailwind v4 `@starting-style` variant supports entry animations without JS. |
| Status transitions | CSS transitions on color/opacity | Tailwind `transition-colors duration-300` handles status badge color changes. No JS animation lib needed. |
| Empty states | Static JSX with Lucide icons | Purely presentational — conditional render when `workshops.length === 0`. Lucide icons already in stack. |
| Coach availability overlay | Computed grid slots from existing availability data | The conflict engine already parses availability windows. Render tinted `<div>` cells at correct grid rows using existing `GRID_START_HOUR` math. |

## Installation

```bash
# New additions only — existing stack unchanged
npm install sonner react-hotkeys-hook @tanstack/react-table
```

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| sonner | react-toastify | react-toastify 11.x has a larger bundle (~12KB), more opinionated styling that conflicts with custom design systems, and more complex API. Sonner's minimal API fits prototype needs. |
| sonner | react-hot-toast 2.6.0 | react-hot-toast works (peerDep `>=16`), but sonner explicitly declares React 19 support in peerDeps and has a cleaner default visual style matching the app's aesthetic. |
| @tanstack/react-table | Manual sort with useState | Manual sort for 2 columns is fine; for a roster page with 5+ sortable columns and expand/collapse coach detail panel, TanStack Table's `useReactTable` hook removes ~100 lines of boilerplate sort state management. Headless design means zero style override battles. |
| @tanstack/react-table | Material React Table, AG Grid | Both bring opinionated UI components that would fight the WW brand system. AG Grid is massively oversized for 18-row static data. |
| Tailwind transitions | motion (formerly framer-motion) | motion 12.x is 85KB. The micro-interactions needed (hover lift, slide transitions, fade-in) are fully achievable with Tailwind's built-in `transition-*`, `translate-*`, `opacity-*`, and `@starting-style`. The panel slide animation already proves this approach works. Adding a 85KB dependency to animate 5 effects is not justified. |
| useHotkeys | Native `useEffect` + `keydown` listener | Rolling keyboard shortcut management manually means handling modifier detection, cleanup, focus traps, and cross-platform key codes. react-hotkeys-hook handles all of this in one hook call. The 5KB cost is worth it for 3-5 shortcuts. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| motion / framer-motion | 85KB for hover lift effects that Tailwind v4 handles natively. Adds a major dependency for zero additional capability. | Tailwind `transition-transform hover:-translate-y-0.5 hover:shadow-md` |
| Redux / Zustand / Jotai | Filter state, selected IDs, and toast queue are all component-local or app-level with simple shapes. A state library adds ceremony with no benefit in a prototype with no async data fetching. | `useState` + `useContext` (AppContext already exists) |
| react-select / Downshift | Sidebar filters use simple checkbox lists and multi-select pills, not autocomplete dropdowns. These libraries solve a harder problem. | Native `<input type="checkbox">` with Tailwind styling |
| React Query / SWR | No network requests. All data is local mock state. | `useState` + mock data arrays |
| date-fns-tz / luxon | No timezone requirements in scope. date-fns 4.x already handles all date operations used in the project. | Existing date-fns 4.1 |

## Integration Points with Existing Stack

### sonner + Tailwind v4

Sonner's `<Toaster>` uses inline styles internally. Override via the `toastOptions` prop or the `className` prop to apply WW brand colors. Mount once in `App.jsx` above the router.

```jsx
// App.jsx
import { Toaster } from 'sonner'
// ...
<Toaster position="bottom-right" toastOptions={{ className: 'font-inter text-sm' }} />
```

Trigger from any component:
```jsx
import { toast } from 'sonner'
toast.success('3 workshops published')
toast.error('Cannot publish: 2 unresolved conflicts')
```

### react-hotkeys-hook + React Router

Mount shortcuts in the page component that owns the relevant state. Use `enableOnFormTags: false` to avoid triggering navigation when user types in workshop form fields.

```jsx
import { useHotkeys } from 'react-hotkeys-hook'

useHotkeys('arrowleft', () => setCurrentWeek(prev => subWeeks(prev, 1)))
useHotkeys('arrowright', () => setCurrentWeek(prev => addWeeks(prev, 1)))
useHotkeys('t', () => setCurrentWeek(startOfWeek(new Date())))
useHotkeys('escape', () => setSelectedWorkshop(null))
useHotkeys('n', () => openCreateModal())
```

### @tanstack/react-table + Tailwind v4

TanStack Table is headless — it returns sort state, column defs, and row models. Render with plain JSX + Tailwind. Only import the row models you need:

```jsx
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table'
```

Sort indicator: `header.column.getIsSorted()` returns `'asc' | 'desc' | false` — drive Lucide `ChevronUp`/`ChevronDown` icons directly.

### Sidebar Filters + AppContext

The existing `AppContext.jsx` is the right place to hoist filter state since both the Sidebar (filter controls) and ScheduleCalendar (filtered output) are siblings under the same layout. No new state infrastructure needed.

```jsx
// In AppContext
const [filters, setFilters] = useState({ coaches: [], types: [], statuses: [], markets: [] })
const filteredWorkshops = useMemo(() =>
  workshops.filter(w =>
    (filters.coaches.length === 0 || filters.coaches.includes(w.coachId)) &&
    (filters.types.length === 0 || filters.types.includes(w.type)) &&
    (filters.statuses.length === 0 || filters.statuses.includes(w.status))
  ), [workshops, filters])
```

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| sonner@2.0.7 | react@19.2.0 | Explicit React 19 peer dep declaration. Verified. |
| react-hotkeys-hook@5.2.4 | react@19.2.0 | peerDep `>=16.8`, no known React 19 issues. MEDIUM confidence (no explicit React 19 declaration, but broad peer dep range and active maintenance). |
| @tanstack/react-table@8.21.3 | react@19.2.0 | peerDep `>=16.8`, widely used with React 18/19. No known issues. |
| All three additions | tailwindcss@4.2.1 | None of these libraries emit CSS that conflicts with Tailwind. All are headless or use inline styles. |
| All three additions | vite@8.0.0-beta.13 | Standard ESM packages, no Vite-specific integration needed. |

## Sources

- npm registry — `npm info sonner version peerDependencies` → 2.0.7, explicit React 19 peerDep — HIGH confidence
- npm registry — `npm info react-hotkeys-hook version peerDependencies` → 5.2.4, peerDep `>=16.8` — HIGH confidence
- npm registry — `npm info @tanstack/react-table version peerDependencies` → 8.21.3, peerDep `>=16.8` — HIGH confidence
- npm registry — `npm info motion version peerDependencies` → 12.35.2, React 19 compatible but 85KB — HIGH confidence (size is the reason to avoid)
- [TanStack Table v8 Docs](https://tanstack.com/table/v8/docs) — headless architecture, tree-shaking, sort guide — HIGH confidence
- [React Hotkeys Hook Docs](https://react-hotkeys-hook.vercel.app/) — API overview, hook options — MEDIUM confidence (docs don't state React 19 explicitly)
- [Sonner GitHub](https://github.com/emilkowalski/sonner) — React 19 peer dep, changelog — HIGH confidence
- [Tailwind CSS v4 Transition Docs](https://tailwindcss.com/docs/transition-property) — built-in transition utilities, `@starting-style` support — HIGH confidence
- [LogRocket React Toast Comparison 2025](https://blog.logrocket.com/react-toast-libraries-compared-2025/) — ecosystem survey, sonner vs react-hot-toast — MEDIUM confidence
- Existing codebase inspection — `WorkshopPanel.jsx` confirms Tailwind transition pattern works for slide animations — HIGH confidence

---
*Stack research for: WW Workshop Scheduler v1.1 Interactive Polish*
*Researched: 2026-03-09*
