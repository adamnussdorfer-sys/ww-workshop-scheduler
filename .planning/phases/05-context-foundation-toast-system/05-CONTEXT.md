# Phase 5: Context Foundation + Toast System - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Extend AppContext with filter state shape and toast API. Build a ToastStack component that renders toast notifications from any page. This is infrastructure that all subsequent phases depend on — filters (Phase 6) need the context shape, and every action flow needs toast feedback.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion

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

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. Research recommends:
- Filter state in AppContext (not page-level) so Sidebar and pages can share
- Single ToastStack in App.jsx prevents duplicate stacks
- Context value memoized with useMemo to prevent filter-change re-renders

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-context-foundation-toast-system*
*Context gathered: 2026-03-09*
