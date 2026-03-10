# Phase 12: Day and Month Calendar Views - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Add day-view and month-view alternatives to the existing week calendar. The existing week view is the default and remains unchanged. Users get zoom-in (single day, detailed) and zoom-out (full month, overview) perspectives. No new data models or capabilities — same workshops, filters, conflicts, and panel interactions adapted to different time scales.

</domain>

<decisions>
## Implementation Decisions

### View switching
- Tab-style toggle in the calendar navigation bar: **Week | Day | Month** — Week stays default
- The existing `viewMode` state in ScheduleCalendar already stubs this; wire it to render the correct grid component
- Clicking a day cell in month view drills into day view for that date
- Clicking the day label in the week view header drills into day view for that day
- View mode persists during the session but does not survive page refresh (no localStorage needed for prototype)

### Day view layout
- Same time grid as week view: 6 AM – 10 PM, 30-min slots, same `PX_PER_HOUR` constants
- Single column fills the full grid width (minus time gutter) — cards render wider with more room for detail
- Workshop cards show full title (no truncation), coach names, type badge, and time range
- Click-to-create on empty slots works identically to week view — opens panel in create mode with slot context
- Navigation: prev/next day arrows + Today button (same pattern as week nav, using `addDays`/`subDays`)
- Header shows: full day name + date (e.g., "Monday, March 9, 2026")
- Availability overlay works in day view — single coach column bands behind cards

### Month view layout
- Standard 6-row × 7-column month grid (Mon–Sun columns matching week view)
- Each day cell shows: date number + up to 3 workshop pills (title truncated, type-colored left border)
- Overflow: "+N more" link when >3 workshops in a day — clicking it drills into day view
- Day cells are clickable — clicking any day drills into day view for that date
- Today's date highlighted with accent ring/background
- Days outside the current month shown dimmed (previous/next month bleed)
- Navigation: prev/next month arrows + Today button (jumps to current month)
- Header shows: "March 2026" format
- No time grid in month view — just date cells with workshop pills
- Conflict indicators: small red dot on day cells that contain conflicting workshops
- No availability overlay in month view (doesn't make sense at this zoom level)

### Filter and panel behavior across views
- Active filters carry across all three views — switching views preserves filter state
- Filter pills strip renders above the grid in all views
- Dimming behavior applies to workshop cards/pills in all views
- Detail panel works in all views — clicking a workshop card/pill opens the panel
- Empty states adapt per view:
  - Day view empty: "No workshops on [Day, Date]" + Create Workshop CTA
  - Month view empty: unlikely for entire month, but individual empty days just show the date number with no pills
  - Filter empty in day view: "No matching workshops on [date]" + Clear filters CTA

### Keyboard shortcuts
- Arrow keys adapt per view:
  - Week view: Left/Right = prev/next week (existing)
  - Day view: Left/Right = prev/next day
  - Month view: Left/Right = prev/next month
- T = Today (works in all views, jumps to current period)
- Escape = close panel (unchanged)
- N = new workshop (unchanged — uses slotFinder from current view date)

### Claude's Discretion
- Exact card/pill sizing and spacing in month view cells
- Transition animation when switching between views (if any — keep it snappy)
- Whether month view cells get a subtle hover effect
- Day view card width and padding adjustments
- How to handle the grid scroll position when switching views
- Month view row height (fixed vs auto based on content)

</decisions>

<specifics>
## Specific Ideas

- Follow Google Calendar's established patterns — users already know how day/month views work
- Month view pills should use the same type-color coding as week view cards (blue for Weekly Connection, purple for All In, etc.) so the month is scannable at a glance
- The view toggle should feel like part of the existing nav bar, not a separate control — keep it tight next to the week navigation arrows

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 12-day-and-month-calendar-views*
*Context gathered: 2026-03-09*
