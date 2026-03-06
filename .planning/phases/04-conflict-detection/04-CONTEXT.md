# Phase 4: Conflict Detection - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Make scheduling conflicts immediately visible on the calendar cards and in the workshop detail panel. Three conflict types (double-booking, buffer violation, availability conflict) plus time slot saturation. All conflicts are warnings only — coordinators can still save and publish.

</domain>

<decisions>
## Implementation Decisions

### Conflict visibility on calendar cards
- Double-booked workshops get a **2px red ring** (`ring-2 ring-red-500`) around the card — overlays on top of the existing type-colored left border, doesn't replace it
- A small **AlertTriangle icon** (lucide-react, 12px, red) appears in the top-right corner of conflicted cards — visible at a glance without reading text
- Buffer violations get an **orange ring** (`ring-2 ring-orange-400`) + orange AlertTriangle — less severe than double-booking, visually distinct
- Availability conflicts same orange treatment as buffer — both are "soft" warnings vs double-booking's "hard" red
- The existing status dot stays unchanged — conflict indicators are additive, not replacements
- Cards with multiple conflict types show the **most severe** ring color (red > orange)

### Time slot saturation
- When 4+ workshops overlap in the same 30-min slot, show a **thin amber bar** at the top of that time row spanning the full grid width
- Bar shows text: "4 concurrent workshops" (or whatever the count is) — small, `text-xs`, amber-700 on amber-50 background
- This is a **passive density indicator**, not an error — coordinators often intentionally run many sessions at once
- Threshold is 4 (configurable later, hardcoded for now)

### Panel conflict alerts
- Conflicts render as a **red alert box** at the very top of the form (above all fields, below the status badge) — same position as the existing conflict stub from Phase 3
- Each conflict is a list item inside the alert: icon + one-line description
  - Double-booking: "Coach [Name] also assigned to [Workshop Title] at [time]"
  - Buffer violation: "Only [X] min gap before [Workshop Title] — recommend 15+ min buffer"
  - Availability conflict: "Coach [Name] not available on [Day] at [time]"
- Group by severity: double-bookings first (red icon), then buffer/availability (orange icon)
- Alert box uses the existing conflict stub pattern from WorkshopForm (`conflicts` prop) — just wire real data into it
- If no conflicts: nothing renders (no "No conflicts" message — clean when clean)

### Conflict computation
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

</decisions>

<specifics>
## Specific Ideas

- The red ring on cards should feel like a "something needs your attention" signal, not a "this is broken" alarm — coordinators deal with conflicts as part of normal workflow
- The existing `Conflict` status dot with `animate-pulse` in WorkshopCard should NOT be used for this — conflict indicators are separate from status. Keep status as Published/Draft/Cancelled. The conflict ring is an overlay signal.
- Mock data already has 3 intentional conflicts built in (see workshops.js comments) — these should all be detected and visually flagged automatically

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-conflict-detection*
*Context gathered: 2026-03-06*
