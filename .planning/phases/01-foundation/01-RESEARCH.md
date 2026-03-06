# Phase 1: Foundation - Research

**Researched:** 2026-03-05
**Domain:** React SPA shell, Tailwind CSS v4 design system, mock data architecture
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LAYOUT-01 | App has left sidebar (240px, collapsible) with navigation and filters | CSS Grid/Flex layout pattern; collapsible via React state toggle |
| LAYOUT-02 | Top bar (56px) shows app name, current user (Kathleen Toth), and notifications bell with badge count | Tailwind utility classes; Lucide React Bell icon; hardcoded user |
| LAYOUT-03 | Three navigable pages: Schedule Calendar, Coach Roster, Draft Manager | React Router v7 library mode with BrowserRouter + Routes + Route |
| LAYOUT-04 | WeightWatchers brand colors applied consistently (navy, blue, coral, success, warning) | Tailwind v4 @theme CSS directive creates utility classes from custom tokens |
| LAYOUT-05 | Inter or system font stack, 14px base, generous whitespace | @fontsource/inter npm package + Tailwind @theme font config |
| DATA-01 | 15-20 coaches with mix of Coach Creators and Legacy Coaches, each with name, type, email, initials, availability, timezone | JSON file in src/data/; imported into top-level App state |
| DATA-02 | 40-50 workshops across the week with realistic times, types, coaches, co-coaches, mix of Draft/Published | JSON file in src/data/; references coach IDs |
| DATA-03 | 2-3 intentional conflicts (coach double-bookings) for demo | Specific overlapping time slots for same coach in workshop data |
| DATA-04 | Attendance data (15-200 range) with 5-week trend for published workshops | Embedded as array on each published workshop object |
</phase_requirements>

---

## Summary

Phase 1 replaces a bare Vite + React 19 scaffold with a complete app shell. The scaffold currently has no Tailwind, no router, no icons, no date utilities, and no application code — it is the default Vite "counter" demo. All four required packages (Tailwind CSS, Lucide React, date-fns, React Router) must be installed and configured from scratch.

Tailwind CSS has released v4, which is a significant departure from v3. There is NO `tailwind.config.js`. Instead, configuration lives in CSS using the `@theme` directive. The Vite integration uses `@tailwindcss/vite` as a Vite plugin (not PostCSS). This is the current standard as of 2025-2026 and is confirmed by official Tailwind documentation.

The state architecture for this prototype is intentionally simple: all app data (coaches, workshops) lives in a single `useState` at the top-level `App` component, passed down via props or a thin React Context. No external state library is needed or appropriate for a prototype of this scope.

**Primary recommendation:** Install all four packages in one pass, configure Tailwind v4 with the `@theme` directive and WW brand tokens, build the shell layout as a single CSS Grid wrapper, use React Router v7 in declarative library mode for three routes, and store mock data as static JSON files imported into App state.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tailwindcss | ^4.x | Utility-first CSS framework | Project constraint; v4 is current stable release as of 2025 |
| @tailwindcss/vite | ^4.x | Vite plugin for Tailwind v4 | Replaces PostCSS approach entirely in v4 |
| react-router | ^7.x | Client-side routing (SPA) | Current major version; declarative library mode ideal for this use case |
| lucide-react | ^0.577.x | Icon library (Bell, ChevronLeft, etc.) | Project constraint; React 19 compatible |
| date-fns | ^4.1.0 | Date utilities | Project constraint; v4 is current with timezone support |
| @fontsource/inter | ^5.x | Self-hosted Inter font | Privacy-first, works offline, no CDN needed for prototype |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React Context API | built-in | Share coaches/workshops state across pages | When prop drilling spans 3+ levels (router pages cannot receive props directly) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @tailwindcss/vite plugin | PostCSS + tailwindcss | PostCSS is the v3 approach; v4 Vite plugin is simpler and faster |
| react-router | useState-based tab switcher | Simpler but loses URL-based navigation; not worth breaking browser back/forward |
| @fontsource/inter | Google Fonts CDN link | CDN approach requires network; Fontsource is bundled, works offline |
| date-fns | dayjs | date-fns is the project constraint; dayjs would also work but wasn't specified |

**Installation:**
```bash
npm install tailwindcss @tailwindcss/vite react-router lucide-react date-fns @fontsource/inter
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── AppShell.jsx        # Grid wrapper: sidebar + topbar + main
│   │   ├── Sidebar.jsx         # 240px nav sidebar, collapsible
│   │   └── TopBar.jsx          # 56px top bar with user + bell
│   └── nav/
│       └── NavItem.jsx         # Reusable nav link with active state
├── pages/
│   ├── ScheduleCalendar.jsx    # Route /  (placeholder for Phase 2)
│   ├── CoachRoster.jsx         # Route /roster (placeholder for Phase 6)
│   └── DraftManager.jsx        # Route /drafts (placeholder for Phase 7)
├── data/
│   ├── coaches.js              # 15-20 coach objects
│   └── workshops.js            # 40-50 workshop objects (imports coach IDs)
├── context/
│   └── AppContext.jsx          # React context providing coaches + workshops state
├── App.jsx                     # Root: initializes state from data files, provides context
├── main.jsx                    # Entry: BrowserRouter wraps App
└── index.css                   # @import "tailwindcss"; @theme { WW brand tokens }
```

### Pattern 1: Tailwind v4 Theme Configuration

**What:** Brand tokens defined in CSS via `@theme` directive — no config file needed.
**When to use:** Any custom color, font, or spacing that must generate Tailwind utility classes.

```css
/* src/index.css */
/* Source: https://tailwindcss.com/docs/installation */
@import "tailwindcss";

@theme {
  /* WeightWatchers brand colors */
  --color-ww-navy: #1A2332;
  --color-ww-blue: #0066CC;
  --color-ww-coral: #E85D4A;
  --color-ww-success: #22C55E;
  --color-ww-warning: #F59E0B;
  --color-ww-amber: #F59E0B;

  /* Background and surface colors */
  --color-surface: #F8FAFC;
  --color-surface-2: #F1F5F9;
  --color-border: #E2E8F0;

  /* Typography */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-size-base: 14px;
}
```

These `@theme` declarations auto-generate classes like `bg-ww-navy`, `text-ww-coral`, `bg-surface`, etc.

### Pattern 2: CSS Grid Shell Layout

**What:** Single CSS Grid wrapper for the three-zone layout (sidebar, topbar, content).
**When to use:** Fixed sidebar + fixed topbar + scrolling content is a classic admin app pattern.

```jsx
// src/components/layout/AppShell.jsx
// Grid: [sidebar col | main area] with [topbar row | content row]
export default function AppShell({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const sidebarWidth = sidebarCollapsed ? '64px' : '240px';

  return (
    <div
      className="h-screen grid"
      style={{
        gridTemplateColumns: `${sidebarWidth} 1fr`,
        gridTemplateRows: '56px 1fr',
      }}
    >
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(p => !p)} />
      <TopBar />
      <main className="overflow-auto bg-surface col-start-2 row-start-2">
        {children}
      </main>
    </div>
  );
}
```

Note: CSS Grid `gridTemplateColumns` must be inline style (not Tailwind class) when the value is dynamic (depends on state). Tailwind's JIT cannot generate arbitrary dynamic values at runtime.

### Pattern 3: React Router v7 Declarative Mode

**What:** Wrap app in `<BrowserRouter>`, define routes with `<Routes>/<Route>`.
**When to use:** Client-side SPA with URL-based navigation. This is the library mode (not framework mode).

```jsx
// src/main.jsx
import { BrowserRouter } from 'react-router';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

// src/App.jsx
import { Routes, Route } from 'react-router';
import AppShell from './components/layout/AppShell';
import ScheduleCalendar from './pages/ScheduleCalendar';
import CoachRoster from './pages/CoachRoster';
import DraftManager from './pages/DraftManager';

export default function App() {
  const [coaches, setCoaches] = useState(initialCoaches);
  const [workshops, setWorkshops] = useState(initialWorkshops);

  return (
    <AppContext.Provider value={{ coaches, setCoaches, workshops, setWorkshops }}>
      <AppShell>
        <Routes>
          <Route path="/" element={<ScheduleCalendar />} />
          <Route path="/roster" element={<CoachRoster />} />
          <Route path="/drafts" element={<DraftManager />} />
        </Routes>
      </AppShell>
    </AppContext.Provider>
  );
}
```

### Pattern 4: NavLink Active State

**What:** React Router's `<NavLink>` automatically applies className based on active route.
**When to use:** Sidebar navigation items that highlight the current page.

```jsx
// src/components/nav/NavItem.jsx
import { NavLink } from 'react-router';

export default function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-ww-blue/10 text-ww-blue'
            : 'text-slate-600 hover:bg-surface-2 hover:text-ww-navy'
        }`
      }
    >
      <Icon size={18} />
      {label}
    </NavLink>
  );
}
```

### Pattern 5: Mock Data File Shape

**What:** Static JS files exporting coach and workshop arrays, imported directly into App state.
**When to use:** No backend; data never changes at runtime except through user interactions.

```js
// src/data/coaches.js
export const coaches = [
  {
    id: 'coach-001',
    name: 'Sarah Mitchell',
    type: 'Coach Creator',       // or 'Legacy Coach'
    email: 'sarah.mitchell@ww.com',
    initials: 'SM',
    timezone: 'America/New_York',
    status: 'active',
    availability: [
      { day: 'monday', start: '09:00', end: '17:00' },
      { day: 'tuesday', start: '09:00', end: '17:00' },
      // ... other days
    ],
  },
  // 14-19 more coaches...
];

// src/data/workshops.js
import { addDays, startOfWeek, setHours, setMinutes } from 'date-fns';

// Use a fixed reference date so conflicts are reproducible
const WEEK_START = startOfWeek(new Date('2026-03-02'), { weekStartsOn: 1 }); // Monday

export const workshops = [
  {
    id: 'ws-001',
    title: 'Monday Morning Kickoff',
    type: 'Weekly Connection',   // Weekly Connection | All In | Special Event | Coaching Corner | Movement/Fitness
    status: 'Published',         // Draft | Published | Cancelled
    coachId: 'coach-001',
    coCoachId: 'coach-003',      // optional
    start: setHours(setMinutes(WEEK_START, 0), 9).toISOString(),  // Mon 9:00 AM
    end:   setHours(setMinutes(WEEK_START, 0), 10).toISOString(), // Mon 10:00 AM
    markets: ['US', 'CA'],       // US | CA | UK | ANZ
    description: '',
    recurrence: 'weekly',
    attendance: [142, 138, 151, 129, 145],  // last 5 weeks, most recent last
  },
  // ...
];
```

### Intentional Conflicts Pattern

To satisfy DATA-03 (2-3 coach double-bookings), include workshops where the same `coachId` appears in two workshops with overlapping time ranges on the same day.

```js
// Example intentional conflict: coach-005 is double-booked Monday 10-11 AM
{ id: 'ws-021', coachId: 'coach-005', start: 'MON 10:00', end: 'MON 11:00', ... },
{ id: 'ws-022', coachId: 'coach-005', start: 'MON 10:30', end: 'MON 11:30', ... },
// Conflict is detectable: same coachId, overlapping intervals
```

### Anti-Patterns to Avoid

- **Dynamic Tailwind classes built by string concatenation:** `className={\`text-${color}\`}` will NOT work — Tailwind's JIT scanner cannot detect dynamically built class names. Use full class name strings or conditional ternaries with full class names.
- **Storing dates as Date objects in state:** Date objects don't serialize cleanly. Store ISO strings; parse with date-fns only when displaying/computing.
- **Route-level props passing:** Router `<Route element={<Page />}>` cannot pass props. Use React Context instead.
- **PostCSS config for Tailwind v4:** Tailwind v4 with the Vite plugin does NOT need `postcss.config.js`. Adding one can conflict.
- **Clearing existing @theme defaults unnecessarily:** Don't use `--color-*: initial` unless you need to strip ALL default Tailwind colors — this removes all gray, slate, etc. utility classes. Instead, just add new `--color-ww-*` tokens to extend.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Icon set | Custom SVG components | lucide-react | 1500+ icons, consistent stroke width, treeshakeable |
| Font loading | @font-face declarations | @fontsource/inter | Handles all weights, subsets, font-display; self-hosted |
| Client routing | useState page switcher | react-router NavLink/Routes | Browser history, back/forward, deep links, active state |
| Date math | Custom overlap detection | date-fns (for Phase 4) | Edge cases in DST transitions, month boundaries |
| Active nav highlight | Manual className logic | React Router NavLink isActive | Automatic, route-aware |

**Key insight:** The scaffold replacement work (removing Vite demo content) and the dependency installation are prerequisites to any app code. Do both before building any components.

---

## Common Pitfalls

### Pitfall 1: Tailwind v4 vs v3 Setup Confusion

**What goes wrong:** Developers follow v3 setup guides (PostCSS, `tailwind.config.js`, three `@tailwind` directives) and wonder why classes aren't applying or config isn't working.
**Why it happens:** Most Google results and blog posts still cover v3 as of early 2026.
**How to avoid:** The ONLY correct setup for this project is:
  1. `npm install tailwindcss @tailwindcss/vite` (NOT `tailwindcss postcss autoprefixer`)
  2. Add `tailwindcss()` to `vite.config.js` plugins array
  3. Use `@import "tailwindcss";` in index.css (NOT `@tailwind base/components/utilities`)
  4. Define custom tokens in `@theme {}` block (NOT in `tailwind.config.js`)
**Warning signs:** Tailwind classes not applying, build errors about missing PostCSS config, `tailwind.config.js` being referenced.

### Pitfall 2: Dynamic Tailwind Class Names

**What goes wrong:** `className={\`bg-${color}-500\`}` generates no styles in production. Works in dev only if class happened to exist from elsewhere.
**Why it happens:** Tailwind v4 (like v3) scans source files for complete class strings. Dynamically assembled strings are invisible to the scanner.
**How to avoid:** Use full class name strings in all conditions. For conditional colors, use a lookup object:
```js
const typeColors = {
  'Weekly Connection': 'bg-ww-blue text-white',
  'All In': 'bg-purple-600 text-white',
  'Special Event': 'bg-ww-coral text-white',
};
```
**Warning signs:** Classes work in one state but not another, or work in dev but not production build.

### Pitfall 3: Sidebar Width Transition and CSS Grid

**What goes wrong:** Animating sidebar collapse with CSS Grid `gridTemplateColumns` is tricky — CSS transitions don't apply to `grid-template-columns` in all browsers.
**Why it happens:** CSS Grid column sizing doesn't animate as smoothly as width/transform.
**How to avoid:** For Phase 1, implement the collapse as a simple toggle without animation (animation is a Phase 7 concern). Use inline `style` for the dynamic width, or use a wrapping div with `width` and `overflow: hidden` transition on the sidebar itself rather than on the grid column.
**Warning signs:** Sidebar snap instead of slide; console errors about transition.

### Pitfall 4: React Router BrowserRouter and Vite Dev Server

**What goes wrong:** Deep-linking to `/roster` on refresh returns a 404 from Vite dev server.
**Why it happens:** BrowserRouter uses HTML5 history API — the server must serve `index.html` for all routes. Vite's dev server does this automatically, but the production preview (`npm run preview`) may not.
**How to avoid:** For dev, this is not a problem. For production, add `historyApiFallback` or equivalent. For this prototype this is a non-issue since it's demo-only.
**Warning signs:** Direct URL access to `/roster` fails with 404 in preview mode.

### Pitfall 5: Mock Data Date Anchoring

**What goes wrong:** Using `new Date()` for workshop times means the mock data is always relative to today, so "conflicts" that depend on two workshops overlapping on the same day may not be on the same calendar week when the app is viewed.
**Why it happens:** Demo viewed on different days will have week-shifted data.
**How to avoid:** Use a FIXED reference date (e.g., `new Date('2026-03-02')` for the week of March 2-8, 2026) when computing workshop start/end times. The calendar in Phase 2 will default to showing the current week, so also ensure the data week matches what's "current" by using `startOfWeek(new Date(), { weekStartsOn: 1 })` dynamically — but be aware this shifts weekly.

**Recommended approach:** Use a dynamic reference (current week's Monday) so the mock data always appears in the current week. This prevents the calendar from looking empty on first load.

```js
// src/data/workshops.js — dynamic week anchor
import { startOfWeek, addDays, setHours, setMinutes, parseISO } from 'date-fns';

function getWeekDay(dayOffset, hour, minute = 0) {
  const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
  return setMinutes(setHours(addDays(monday, dayOffset), hour), minute);
}
// dayOffset: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
```

---

## Code Examples

Verified patterns from official sources:

### Tailwind v4 Vite Configuration
```js
// vite.config.js
// Source: https://tailwindcss.com/docs/installation
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

### Tailwind v4 CSS Entry Point with WW Brand Tokens
```css
/* src/index.css */
@import "tailwindcss";

@theme {
  --color-ww-navy: #1A2332;
  --color-ww-blue: #0066CC;
  --color-ww-coral: #E85D4A;
  --color-ww-success: #22C55E;
  --color-ww-warning: #F59E0B;
  --color-surface: #F8FAFC;
  --color-surface-2: #F1F5F9;
  --color-border: #E2E8F0;
  --font-sans: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}

/* Reset Vite scaffold defaults */
body {
  margin: 0;
  background-color: theme(--color-surface);
  color: theme(--color-ww-navy);
  font-family: theme(--font-sans);
  font-size: 14px;
  line-height: 1.5;
}
```

### React Router v7 Entry Setup
```jsx
// src/main.jsx
// Source: https://reactrouter.com/start/library/installation
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
```

### Inter Font Setup
```jsx
// src/main.jsx — add this import
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
```

### App Context for Shared State
```jsx
// src/context/AppContext.jsx
import { createContext, useContext } from 'react';

export const AppContext = createContext(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppContext.Provider');
  return ctx;
}
```

### Coach Data Schema
```js
// src/data/coaches.js — schema reference
{
  id: 'coach-001',           // string, used as FK in workshops
  name: 'Sarah Mitchell',    // full name
  type: 'Coach Creator',     // 'Coach Creator' | 'Legacy Coach'
  email: 'sarah.mitchell@ww.com',
  initials: 'SM',            // for avatar fallback
  timezone: 'America/New_York',
  status: 'active',          // 'active' | 'inactive'
  employment: 'Full-time',   // 'Full-time' | 'Part-time' | 'Contract'
  availability: [
    { day: 'monday', start: '09:00', end: '17:00' },
    { day: 'wednesday', start: '09:00', end: '17:00' },
    // only include days they ARE available
  ],
  // For Coach Roster (Phase 6) — include now so data is consistent:
  avgAttendance: 145,        // integer
  workshopsThisWeek: 3,      // integer
  attendanceTrend: 'up',     // 'up' | 'down' | 'flat'
}
```

### Workshop Data Schema
```js
// src/data/workshops.js — schema reference
{
  id: 'ws-001',
  title: 'Monday Morning Kickoff',
  type: 'Weekly Connection',   // 'Weekly Connection' | 'All In' | 'Special Event' | 'Coaching Corner' | 'Movement/Fitness'
  status: 'Published',          // 'Draft' | 'Published' | 'Cancelled'
  coachId: 'coach-001',         // required; references coaches[].id
  coCoachId: 'coach-003',       // optional, can be null
  startTime: '2026-03-02T09:00:00', // ISO string, full datetime
  endTime:   '2026-03-02T10:00:00', // ISO string, full datetime
  markets: ['US', 'CA'],        // array of 'US' | 'CA' | 'UK' | 'ANZ'
  description: '',
  recurrence: 'weekly',         // 'weekly' | 'biweekly' | 'none'
  attendance: [142, 138, 151, 129, 145], // last 5 weeks; null for Draft
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| PostCSS + `tailwind.config.js` | `@tailwindcss/vite` plugin + `@theme` CSS | Tailwind v4 (Jan 2025) | No config file; CSS-first theme |
| Three `@tailwind` directives | Single `@import "tailwindcss"` | Tailwind v4 (Jan 2025) | Simpler entry point |
| `react-router-dom` package name | `react-router` (unified) | React Router v7 (2024) | Single package, no separate dom package |
| CRA (Create React App) | Vite | 2022+ (CRA deprecated) | Already using Vite — no change needed |
| date-fns v2 tree-shaking quirks | date-fns v4 ESM-first | date-fns v4 (2024) | Cleaner imports, timezone support built in |

**Deprecated/outdated:**
- `react-router-dom`: v7 merged into `react-router`. Install `react-router` only.
- `tailwindcss postcss autoprefixer` trio: Not needed with Vite plugin approach in v4.
- `@tailwind base; @tailwind components; @tailwind utilities;`: Replaced by `@import "tailwindcss";` in v4.
- `tailwind.config.js`: Optional in v4 (only needed for advanced plugin/content config). Not needed for theme tokens.

---

## Open Questions

1. **Collapsible sidebar implementation detail**
   - What we know: LAYOUT-01 says "collapsible" sidebar
   - What's unclear: Phase 1 success criteria don't require the collapse to animate — it just needs to render correctly at 240px. Collapse animation is a Phase 7 concern.
   - Recommendation: Implement collapse toggle in Phase 1 as instant show/hide; save animation for Phase 7.

2. **Mock data week anchoring strategy**
   - What we know: Workshops need to appear on the calendar in Phase 2
   - What's unclear: If data uses a fixed date, it will be off-week when the app is opened in a different week. If dynamic, conflicts must still always exist.
   - Recommendation: Anchor workshops to `startOfWeek(new Date(), { weekStartsOn: 1 })` (current Monday) so they always show in the current calendar week. The intentional conflicts are day-offset-based, so they remain conflicts regardless of which week it is.

3. **Vite beta version stability**
   - What we know: The project uses `vite@^8.0.0-beta.13` (a beta version)
   - What's unclear: Whether `@tailwindcss/vite` is fully compatible with Vite 8 beta
   - Recommendation: Install `@tailwindcss/vite` and test dev server. If incompatible, check if Tailwind's Vite plugin supports Vite 8 or requires Vite 5/6. PostCSS fallback is available if needed.

---

## Sources

### Primary (HIGH confidence)
- [Tailwind CSS v4 Installation Docs](https://tailwindcss.com/docs/installation) — Vite plugin approach, `@import "tailwindcss"` syntax
- [Tailwind CSS v4 Theme Configuration](https://tailwindcss.com/docs/theme) — `@theme` directive, namespace variables, utility class generation
- [React Router v7 Library Installation](https://reactrouter.com/start/library/installation) — `react-router` package, BrowserRouter setup, declarative mode

### Secondary (MEDIUM confidence)
- [Lucide React npm](https://www.npmjs.com/package/lucide-react) — version 0.577.0, React 19 compatibility discussion
- [date-fns npm](https://www.npmjs.com/package/date-fns) — version 4.1.0 confirmed as latest
- [@fontsource/inter npm](https://www.npmjs.com/package/@fontsource/inter) — self-hosted Inter, per-weight imports

### Tertiary (LOW confidence)
- Multiple Medium/DEV.to posts confirming Tailwind v4 Vite setup steps — consistent with official docs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — confirmed from official docs and npm; package names verified
- Architecture: HIGH — standard React patterns; Tailwind v4 theme approach from official docs
- Mock data schema: HIGH — derived directly from requirements; no external dependency
- Pitfalls: HIGH — Tailwind v3/v4 config confusion is documented; dynamic class name issue is well-known
- Vite 8 beta compatibility: LOW — Vite 8 is beta; not verified against Tailwind v4 plugin compatibility

**Research date:** 2026-03-05
**Valid until:** 2026-06-05 (90 days — stable libraries, but Vite 8 beta may change)
