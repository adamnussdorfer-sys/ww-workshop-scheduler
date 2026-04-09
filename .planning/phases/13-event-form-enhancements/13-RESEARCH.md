# Phase 13: Event Form Enhancements - Research

**Researched:** 2026-04-08
**Domain:** React form state management, validation logic, conflict engine extension
**Confidence:** HIGH

---

## Summary

Phase 13 adds three features to `WorkshopForm.jsx`: a Plan Type segmented button selector (EVNT-01), relaxed draft validation that only requires title + time (EVNT-02), and a Buffer Override segmented button selector that feeds into the conflict engine (EVNT-03).

All three features are entirely front-end, no-backend changes. The UI contract is fully specified in `13-UI-SPEC.md` — no design research is required. The only real research questions are: (1) exactly how the conflict engine must change to respect per-workshop buffer overrides, (2) what the minimal, safe validation split looks like in the current `handleSaveDraft`/`handlePublish` flow, and (3) how to default-fill the two new fields on all 238 existing seed records without breaking the running app.

**Primary recommendation:** Implement all three features in a single plan as one cohesive form enhancement — they share the same `initDraft()` shape, the same `draft` state, and the same save/publish flow. Splitting into separate plans would create churn in the same file.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| EVNT-01 | Coordinator can select a plan type (Core or Core Plus) when creating or editing a workshop via single-selection control | Two segmented pill buttons; data field `planType: 'Core' \| 'Core Plus'`; default `'Core'` in `initDraft()`; persists through save/publish |
| EVNT-02 | Coordinator can save a workshop as Draft without all fields being required (title and time sufficient) | Split validation: `handleSaveDraft` validates title + startTime only; `handlePublish` validates title + startTime + coachId + markets; inline error rendering for failures |
| EVNT-03 | Coordinator can set a custom buffer time override per workshop that replaces the default 15-minute buffer in conflict detection | Six-option segmented button; data field `bufferOverride: 0\|5\|10\|15\|20\|30`; default `15`; `buildConflictMap` uses `Math.min(a.bufferOverride ?? BUFFER_MINUTES, b.bufferOverride ?? BUFFER_MINUTES)` for pair gap threshold |
</phase_requirements>

---

## Project Constraints (from CLAUDE.md)

- **Tech stack**: React 19 (Vite 8), Tailwind CSS v4, date-fns, Lucide React — no other frameworks or libraries
- **No backend**: All data lives in React state and local mock JS files — no persistence layer
- **Design**: WeightWatchers brand palette (navy `#1A2332`, blue `#0222D0`, coral) — `--color-ww-blue` is the accent
- **Viewport**: Desktop-optimized, minimum 1280px
- **No shadcn**: This project uses a fully bespoke design system in `src/components/ui/` — do not import any shadcn components
- **GSD workflow**: File changes must go through `/gsd:execute-phase`, not ad-hoc edits

---

## Standard Stack

### Core (already installed — no new packages)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.0 | Component state (`useState`), refs (`useRef`), effects (`useEffect`) | Already the app framework |
| Tailwind CSS v4 | (via `@tailwindcss/vite`) | Utility classes for segmented button styling | Already used everywhere in the form |
| date-fns | (existing) | ISO string parsing for validation | Already used in `WorkshopForm.jsx` |
| Vitest | 4.0.18 | Unit test runner for conflict engine | Already set up; `npm test` = `vitest run` |

**No new packages required for this phase.**

---

## Architecture Patterns

### Recommended Project Structure (no changes needed)

The phase touches these existing files only:

```
src/
├── components/panel/WorkshopForm.jsx   -- form fields, validation, initDraft()
├── utils/conflictEngine.js             -- buffer logic to update
├── data/workshops.js                   -- seed data to backfill new fields
└── utils/conflictEngine.test.js        -- new tests for buffer override
```

No new files needed.

---

### Pattern 1: Segmented Button Group (used for planType and bufferOverride)

**What:** A row of pill buttons where exactly one is selected at all times. Selection is stored as a value in `draft` state via `updateField()`. No radio inputs — pure button elements with conditional className.

**When to use:** Two to six mutually-exclusive static options where inline spatial comparison is more scannable than a dropdown. Established in this project's `CustomRecurrenceModal` (day-of-week pills) — see lines 407–424 of `WorkshopForm.jsx`.

**Example (from existing codebase pattern):**
```jsx
// Source: WorkshopForm.jsx lines 407-424 — day-of-week pills in CustomRecurrenceModal
{RECURRING_DAYS.map((day) => {
  const selected = localDays.includes(day);
  return (
    <button
      key={day}
      type="button"
      onClick={() => toggleDay(day)}
      className={`w-9 h-9 text-xs font-semibold rounded-full border transition-colors cursor-pointer flex items-center justify-center ${
        selected
          ? 'bg-ww-blue text-white border-ww-blue'
          : 'bg-white text-slate-600 border-border hover:border-slate-400'
      }`}
    >
      {RECURRING_DAY_LABELS[day].charAt(0)}
    </button>
  );
})}
```

**Phase 13 adaptation for planType:**
```jsx
// Single-select variant — only one selected at a time
const PLAN_TYPES = ['Core', 'Core Plus'];

<div className="space-y-1">
  <span className="text-[12px] font-normal text-[#031373]">Plan Type</span>
  <div className="flex gap-2">
    {PLAN_TYPES.map((pt) => (
      <button
        key={pt}
        type="button"
        onClick={() => updateField('planType', pt)}
        className={`px-4 py-2 text-sm font-semibold rounded-full border transition-colors cursor-pointer ${
          draft.planType === pt
            ? 'bg-ww-blue text-white border-ww-blue'
            : 'border-[#84ABFF] text-[#031373] bg-white hover:border-[#031373]'
        }`}
      >
        {pt}
      </button>
    ))}
  </div>
</div>
```

**Phase 13 adaptation for bufferOverride:**
```jsx
const BUFFER_OPTIONS = [
  { value: 0, label: 'Off' },
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 15, label: '15 min' },
  { value: 20, label: '20 min' },
  { value: 30, label: '30 min' },
];

<div className="space-y-1">
  <span className="text-[12px] font-normal text-[#031373]">Buffer Override</span>
  <div className="flex flex-wrap gap-2">
    {BUFFER_OPTIONS.map(({ value, label }) => (
      <button
        key={value}
        type="button"
        onClick={() => updateField('bufferOverride', value)}
        className={`px-3 py-2 text-[14px] font-semibold rounded-full border transition-colors cursor-pointer ${
          draft.bufferOverride === value
            ? 'bg-ww-blue text-white border-ww-blue'
            : 'border-[#84ABFF] text-[#031373] bg-white hover:border-[#031373]'
        }`}
      >
        {label}
      </button>
    ))}
  </div>
  {draft.bufferOverride !== 15 && (
    <span className="text-[11px] text-[#031373]/60 mt-1 block">
      {draft.bufferOverride === 0
        ? 'Buffer check disabled for this workshop'
        : 'Default is 15 min'}
    </span>
  )}
</div>
```

---

### Pattern 2: Split Validation (Draft vs Publish)

**What:** Two separate validation gates — one for "Save Draft" (minimal: title + startTime) and one for "Publish Workshop" (full: title + startTime + coachId + markets). Inline error `<p>` elements below failing fields, cleared on next attempt.

**Current state:** `handleSaveDraft` and `handlePublish` in `WorkshopForm.jsx` (lines 652–707) have **no validation at all** — they save unconditionally. The action buttons call these handlers directly via `onClick`. EVNT-02 adds validation gates to both paths.

**Validation state pattern (add to WorkshopForm component):**
```jsx
const [errors, setErrors] = useState({});

const handleSaveDraft = () => {
  const newErrors = {};
  if (!draft.title?.trim()) newErrors.title = 'Title is required';
  if (!draft.startTime) newErrors.startTime = 'Date and time are required';
  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return; // abort save
  }
  setErrors({});
  // ... existing save logic
};

const handlePublish = () => {
  const newErrors = {};
  if (!draft.title?.trim()) newErrors.title = 'Title is required';
  if (!draft.startTime) newErrors.startTime = 'Date and time are required';
  if (!draft.coachId) newErrors.coachId = 'Coach is required to publish';
  if (!draft.markets?.length) newErrors.markets = 'Select at least one market to publish';
  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }
  setErrors({});
  // ... existing publish logic
};
```

**Inline error rendering (place immediately after the relevant field):**
```jsx
{errors.title && (
  <p className="text-[12px] text-red-500 mt-1 px-1">Title is required</p>
)}
```

**Key insight:** `startTime` is always set by `initDraft()` (either from slot context or `defaultSlot()`), so the `!draft.startTime` guard is a safety net for edge cases where the date was cleared — it will rarely fire in practice.

---

### Pattern 3: initDraft() Default Shape Extension

**What:** Add `planType: 'Core'` and `bufferOverride: 15` to both branches of `initDraft()`.

**Current `initDraft()` — create branch (lines 130–150):**
```js
return {
  title: '',
  type: 'Weekly Workshop',
  status: 'Draft',
  coachId: '',
  coCoachId: null,
  description: '',
  // ... other fields
  zoomType: 'meeting',
  startTime: buildISO(slot, tz),
  endTime: buildEndISO(slot, tz),
};
```

**Updated create branch:**
```js
return {
  // ... all existing fields
  zoomType: 'meeting',
  planType: 'Core',         // NEW
  bufferOverride: 15,       // NEW
  startTime: buildISO(slot, tz),
  endTime: buildEndISO(slot, tz),
};
```

**Updated view/edit branch (spread-based — existing fields win, defaults fill gaps):**
```js
return {
  recurring: false,
  recurringDays: [],
  recurringWeeks: 1,
  recurrenceEndType: 'never',
  recurrenceOccurrences: 13,
  timezone: 'ET',
  planType: 'Core',         // NEW default — overridden if workshop has it
  bufferOverride: 15,       // NEW default — overridden if workshop has it
  ...workshop,              // spread last so existing values win
};
```

This spread-last pattern means that any existing seed workshop with `planType: 'Core Plus'` will correctly override the default. It also means Phase 13 does not technically require backfilling seed data — the defaults fill in transparently. However, the UI-SPEC explicitly requires seed data to be backfilled for data model completeness.

---

### Pattern 4: Conflict Engine Buffer Override

**What:** When checking buffer violations in `buildConflictMap`, use the minimum of the two workshops' `bufferOverride` values rather than the global `BUFFER_MINUTES = 15` constant.

**Current buffer check (conflictEngine.js lines 149–175):**
```js
if (gapMinutes < BUFFER_MINUTES) {
  // flag as orange conflict
}
```

**Updated buffer check with per-workshop override:**
```js
// Use the more permissive (lower) buffer of the two workshops in the pair.
// If a workshop has bufferOverride === 0, skip the buffer check entirely for this pair.
const effectiveBuffer = Math.min(
  a.bufferOverride ?? BUFFER_MINUTES,
  b.bufferOverride ?? BUFFER_MINUTES
);

if (effectiveBuffer === 0) continue; // "Off" — buffer check disabled

if (gapMinutes < effectiveBuffer) {
  // flag as orange conflict — update message to show effective buffer
  addConflict(resultMap, a.id, {
    type: 'buffer',
    severity: 'orange',
    message: `Only ${gapMinutes} min gap before "${b.title}" — recommend ${effectiveBuffer}+ min buffer`,
  });
  // ... same for b
}
```

**Design rationale for `Math.min`:** The buffer check is about whether the gap is comfortable for the coach. If workshop A has a 5 min override and workshop B has 15 min, the pair is treated as needing only 5 min — A's coordinator explicitly opted for a tighter schedule. Using `Math.min` is the most permissive interpretation that respects both overrides. The UI-SPEC says "overrides the default" per workshop — `Math.min` is the correct semantic for a pair comparison.

**Edge case — `bufferOverride === 0` ("Off"):** When either workshop in a pair has "Off" selected, skip the buffer check entirely for that pair. Do not flag a conflict regardless of gap size.

---

### Pattern 5: Seed Data Backfill

**What:** Add `planType: 'Core'` and `bufferOverride: 15` to all 238 workshop objects in `src/data/workshops.js`.

**Approach:** Bulk add both fields to every object. Because the data is a static array of literals (not generated), this requires touching each object. Given the volume (238 records), the planner should make this a standalone task with a clear before/after diff boundary.

**Fields to add per record:**
```js
{
  id: 'ws-001',
  // ... existing fields
  zoomType: 'meeting',
  planType: 'Core',       // add after zoomType
  bufferOverride: 15,     // add after planType
  attendance: [...],
}
```

**Alternative:** The `initDraft()` spread-last pattern (Pattern 3 above) means the app works correctly without the seed backfill — the defaults silently fill in when a seed workshop is opened in edit mode. However, the UI-SPEC requires the backfill for data model integrity.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Single-select pill UI | Custom state machine with radio inputs | Button + conditional className | Already established by day-of-week pills in `CustomRecurrenceModal` |
| Form validation state | Complex validation library | Plain `useState({})` errors object | 4 fields maximum; Zod/Yup adds zero value here |
| Buffer pair logic | Per-workshop override lookup table | `Math.min(a.bufferOverride ?? 15, b.bufferOverride ?? 15)` | Two-line change in existing loop |

---

## Common Pitfalls

### Pitfall 1: Forgetting the `bufferOverride === 0` ("Off") Skip

**What goes wrong:** Gap comparisons with `gapMinutes < 0` never fire, but the intent of "Off" is that no buffer warning should appear at all — the check should be skipped, not just pass the threshold.
**Why it happens:** A developer treats 0 as "threshold of 0 minutes" rather than "disable entirely."
**How to avoid:** Add a `if (effectiveBuffer === 0) continue;` guard before the gap comparison.
**Warning signs:** Buffer test for "Off" scenario shows no conflict — looks correct — but the semantic is wrong if the check still runs.

### Pitfall 2: Spreading `planType`/`bufferOverride` After `...workshop` in initDraft view branch

**What goes wrong:** If the defaults are spread AFTER `...workshop`, then a workshop with `planType: undefined` (old seed data without backfill) correctly inherits the default. But if `...workshop` comes last, any `undefined` from the workshop object would overwrite the default with `undefined`, causing `draft.planType === undefined` and the "Core" pill not appearing selected.
**How to avoid:** In the view branch, spread defaults FIRST, then `...workshop` LAST — workshop values win over defaults.
**Correct:**
```js
return { planType: 'Core', bufferOverride: 15, ...workshop };
```
**Wrong:**
```js
return { ...workshop, planType: 'Core', bufferOverride: 15 };
```

### Pitfall 3: Validation Errors Not Cleared Before Re-attempt

**What goes wrong:** User fixes title, clicks "Save Draft" again — but if errors state is only cleared on success, previous errors for other fields remain visible even after they're valid.
**How to avoid:** Call `setErrors({})` at the start of each handler (before re-validating), or recompute the full error set fresh on each attempt. The pattern above calls `setErrors({})` only on success — instead, always build `newErrors` fresh and `setErrors(newErrors)`.
**Better pattern:**
```js
const handleSaveDraft = () => {
  const newErrors = {};
  if (!draft.title?.trim()) newErrors.title = 'Title is required';
  if (!draft.startTime) newErrors.startTime = 'Date and time are required';
  setErrors(newErrors);  // always set, clears previous errors for fixed fields
  if (Object.keys(newErrors).length > 0) return;
  // ... save
};
```

### Pitfall 4: Action Button onClick vs type="submit"

**What goes wrong:** The existing action buttons use `onClick` handlers, not a form `onSubmit`. Adding validation by catching a submit event would break the existing pattern.
**How to avoid:** Keep using `onClick` on the buttons — do not convert to a `<form onSubmit>` wrapper.

### Pitfall 5: bufferOverride Strict Equality with Number Buttons

**What goes wrong:** If the seed data has `bufferOverride: '15'` (string) and `draft.bufferOverride === 15` (number), the selected pill will not highlight.
**How to avoid:** Ensure `initDraft()` defaults use number literals (`15`, not `'15'`), and `BUFFER_OPTIONS` values are numbers. The `onClick` sets `value` from the `BUFFER_OPTIONS` array which are numbers — so consistency is maintained as long as defaults are also numbers.

---

## Code Examples

### Complete initDraft() create branch (updated)

```js
// Source: WorkshopForm.jsx initDraft() function — create branch
function initDraft(workshop, mode, slotContext, tz) {
  if (mode === 'view' && workshop) {
    return {
      recurring: false,
      recurringDays: [],
      recurringWeeks: 1,
      recurrenceEndType: 'never',
      recurrenceOccurrences: 13,
      timezone: 'ET',
      planType: 'Core',      // default fills for old records
      bufferOverride: 15,    // default fills for old records
      ...workshop,           // workshop values win (spread last)
    };
  }
  // mode === 'create'
  const slot = slotContext || defaultSlot(tz);
  return {
    title: '',
    type: 'Weekly Workshop',
    status: 'Draft',
    coachId: '',
    coCoachId: null,
    description: '',
    recurrence: 'none',
    recurring: false,
    recurringDays: getDayFromSlot(slot),
    recurringWeeks: 1,
    recurrenceEndType: 'never',
    recurrenceOccurrences: 13,
    timezone: 'ET',
    markets: ['US'],
    zoomType: 'meeting',
    planType: 'Core',         // new field
    bufferOverride: 15,       // new field
    startTime: buildISO(slot, tz),
    endTime: buildEndISO(slot, tz),
  };
}
```

### buildConflictMap buffer section (updated)

```js
// Source: conflictEngine.js — buffer violation section (lines ~149–175)
for (let i = 0; i < sorted.length - 1; i++) {
  const a = sorted[i];
  const b = sorted[i + 1];

  if (timesOverlap(a.startTime, a.endTime, b.startTime, b.endTime)) continue;

  const gapMinutes = differenceInMinutes(
    new Date(b.startTime),
    new Date(a.endTime)
  );

  // Per-workshop buffer override: use the more permissive (lower) of the pair
  const effectiveBuffer = Math.min(
    a.bufferOverride ?? BUFFER_MINUTES,
    b.bufferOverride ?? BUFFER_MINUTES
  );

  // If either workshop has buffer disabled (0), skip check entirely
  if (effectiveBuffer === 0) continue;

  if (gapMinutes < effectiveBuffer) {
    addConflict(resultMap, a.id, {
      type: 'buffer',
      severity: 'orange',
      message: `Only ${gapMinutes} min gap before "${b.title}" — recommend ${effectiveBuffer}+ min buffer`,
    });
    addConflict(resultMap, b.id, {
      type: 'buffer',
      severity: 'orange',
      message: `Only ${gapMinutes} min gap after "${a.title}" — recommend ${effectiveBuffer}+ min buffer`,
    });
  }
}
```

---

## Runtime State Inventory

> Omitted — this is a greenfield feature addition (new fields, not a rename/refactor). No stored data, live service config, OS-registered state, secrets, or build artifacts reference `planType` or `bufferOverride`.

---

## Environment Availability

> Step 2.6: SKIPPED — this phase is code/config changes only. No external CLI tools, databases, or services required. Vitest is already installed and passing (13 tests).

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | none — inferred from `vite.config.js` via Vitest defaults |
| Quick run command | `npm test` (`vitest run`) |
| Full suite command | `npm test` |

Vitest is configured via Vite's default discovery: any file matching `**/*.test.{js,jsx}` is picked up automatically. Existing `src/utils/conflictEngine.test.js` passes all 13 tests.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EVNT-01 | planType field persists through save | unit | `npm test` | ❌ Wave 0 |
| EVNT-02 | Draft save succeeds with title+time only | unit | `npm test` | ❌ Wave 0 |
| EVNT-02 | Draft save fails with empty title | unit | `npm test` | ❌ Wave 0 |
| EVNT-02 | Publish fails without coach | unit | `npm test` | ❌ Wave 0 |
| EVNT-03 | bufferOverride=5 triggers conflict at 3 min gap | unit | `npm test` | ❌ Wave 0 |
| EVNT-03 | bufferOverride=0 suppresses buffer conflict entirely | unit | `npm test` | ❌ Wave 0 |
| EVNT-03 | bufferOverride=20 triggers conflict at 18 min gap | unit | `npm test` | ❌ Wave 0 |
| EVNT-03 | Math.min semantics: pair uses lower override | unit | `npm test` | ❌ Wave 0 |

**Note on EVNT-01 and EVNT-02 testing:** `planType` persistence and form validation logic cannot be unit-tested in Vitest without a DOM renderer (React Testing Library). The project has no RTL setup. The practical approach is to unit-test the pure logic functions (validation helper if extracted, conflict engine changes) in Vitest, and verify EVNT-01/EVNT-02 UI behavior manually. The conflict engine tests (EVNT-03) are pure function tests and fit cleanly in Vitest.

### Sampling Rate

- **Per task commit:** `npm test` (full suite — 13 tests, ~1 second)
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] Add EVNT-03 buffer override tests to `src/utils/conflictEngine.test.js` (can add to existing file, no new file needed)
- [ ] EVNT-01 and EVNT-02 are verified via manual smoke test (no DOM test infrastructure exists)

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| All fields required on save | Title + time only for drafts | Phase 13 | Coordinators can create skeleton workshops quickly |
| Global 15-min buffer for all workshops | Per-workshop `bufferOverride` | Phase 13 | Workshops with tight schedules can suppress false positives |

**Deprecated/outdated:**
- Nothing deprecated in this phase.

---

## Open Questions

1. **Should Publish validate that `bufferOverride` is not 0 for certain types?**
   - What we know: The UI-SPEC says 0 = "Off / buffer check disabled" — it is a valid user choice
   - What's unclear: Whether a coordinator publishing with buffer=0 should see a warning
   - Recommendation: No warning — the user explicitly chose "Off". If the concern arises, it belongs in Phase 14 (Status Visibility), not Phase 13.

2. **Should the "Save Draft" button label change to "Save Draft" (from current "Save Draft")?**
   - What we know: The current button says "Save Draft". The UI-SPEC copywriting table says secondary CTA = "Save Draft". No change needed.
   - What's unclear: Nothing — labels match.
   - Recommendation: No change to button labels beyond what the UI-SPEC specifies.

3. **Do recurring instances inherit `planType` and `bufferOverride` from the base draft?**
   - What we know: `generateRecurringInstances()` spreads `...baseDraft` for all generated instances (line 70: `{ ...baseDraft, id: ..., startTime: ..., endTime: ... }`)
   - What's unclear: Nothing — the spread includes all draft fields, so new fields are inherited automatically.
   - Recommendation: No action needed; the pattern already handles it.

---

## Sources

### Primary (HIGH confidence)

- Direct source code read: `src/components/panel/WorkshopForm.jsx` — full file reviewed for current form shape, `initDraft()`, action handlers, and existing segmented button pattern
- Direct source code read: `src/utils/conflictEngine.js` — full file reviewed for buffer detection loop and `BUFFER_MINUTES` constant
- Direct source code read: `src/utils/conflictEngine.test.js` — full file reviewed; 13 tests confirmed passing via `npm test`
- Direct source code read: `src/data/workshops.js` — first 130 lines reviewed; confirmed current data shape (no `planType`/`bufferOverride` fields)
- Direct file read: `.planning/phases/13-event-form-enhancements/13-UI-SPEC.md` — complete UI contract for all three components

### Secondary (MEDIUM confidence)

- `vite.config.js` + `package.json` — confirmed Vitest 4.0.18, test script = `vitest run`

### Tertiary (LOW confidence)

- None.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all dependencies already installed, no new packages
- Architecture: HIGH — all changes are additive to existing, well-understood components
- Pitfalls: HIGH — derived from direct code reading of the exact functions being modified
- Conflict engine semantics: HIGH — pure function, logic fully readable; `Math.min` rationale is self-evident from the requirement

**Research date:** 2026-04-08
**Valid until:** This research is stable until `WorkshopForm.jsx` or `conflictEngine.js` are modified. No external library upgrades affect this phase.
