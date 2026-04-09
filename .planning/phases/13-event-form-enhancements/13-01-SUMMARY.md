---
phase: 13-event-form-enhancements
plan: 01
subsystem: workshop-form, conflict-engine, seed-data
tags: [form-fields, validation, conflict-engine, tdd, seed-data]
dependency_graph:
  requires: []
  provides: [planType field, bufferOverride field, split draft/publish validation, per-workshop buffer conflict logic]
  affects: [WorkshopForm.jsx, conflictEngine.js, workshops.js]
tech_stack:
  added: []
  patterns: [TDD red-green, segmented pill buttons, split validation (draft vs publish)]
key_files:
  created: []
  modified:
    - src/utils/conflictEngine.test.js
    - src/utils/conflictEngine.js
    - src/components/panel/WorkshopForm.jsx
    - src/data/workshops.js
decisions:
  - effectiveBuffer uses Math.min of pair so either workshop can relax strictness without needing both to agree
  - bufferOverride=0 skips the check entirely via continue rather than treating 0 as a threshold
  - planType defaults placed before ...workshop spread so persisted values always win over defaults
  - errors state cleared on each save attempt so stale errors don't persist after field correction
metrics:
  duration: 5 min
  completed: 2026-04-09
  tasks: 3
  files: 4
---

# Phase 13 Plan 01: Event Form Enhancements Summary

**One-liner:** Plan type selector (Core/Core Plus), per-workshop buffer override with Math.min pair semantics, and split draft/publish validation added to WorkshopForm with TDD conflict engine tests.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Add buffer override logic to conflict engine with TDD tests | 3f3cb1f | conflictEngine.test.js, conflictEngine.js |
| 2 | Add plan type selector, buffer override selector, and split validation to WorkshopForm | 25013ff | WorkshopForm.jsx |
| 3 | Backfill seed data with planType and bufferOverride fields | 67b801f | workshops.js |

## What Was Built

### Conflict Engine Buffer Override (Task 1)

Updated `buildConflictMap` buffer violation detection to respect per-workshop `bufferOverride` values:

- `effectiveBuffer = Math.min(a.bufferOverride ?? BUFFER_MINUTES, b.bufferOverride ?? BUFFER_MINUTES)` — the more permissive (lower) of the pair wins
- `bufferOverride = 0` (Off) skips the check entirely via `continue`
- Conflict messages now show the dynamic `effectiveBuffer` value instead of hardcoded "15"
- 5 new TDD tests cover: both=5 gap 3 (conflict), one=0 gap 2 (no conflict), both=20 gap 18 (conflict), Math.min A=5/B=20 gap 8 (no conflict), undefined fallback gap 10 (conflict)

### WorkshopForm Changes (Task 2)

**New constants:**
- `PLAN_TYPES = ['Core', 'Core Plus']`
- `BUFFER_OPTIONS = [0 (Off), 5, 10, 15, 20, 30 min]`

**initDraft() extended:**
- Both create and view/edit branches now default `planType: 'Core'` and `bufferOverride: 15`
- Defaults placed before `...workshop` spread so persisted values always win

**Split validation:**
- `handleSaveDraft` validates title + startTime only (coach/markets optional for draft)
- `handlePublish` validates title + startTime + coachId + markets
- `errors` state drives inline error messages below each failing field

**New UI elements:**
- Plan Type pill button selector between Zoom Type and Date fields (EVNT-01)
- Buffer Override pill button selector between Description and action buttons (EVNT-03)
- Inline error paragraphs below Title, DateTimeRow, Markets, and Coach fields
- Publish button relabeled to "Publish Workshop"

### Seed Data Backfill (Task 3)

All 238 workshop records in `workshops.js` now include:
- `planType: 'Core'` — placed after `zoomType` field
- `bufferOverride: 15` — placed after `planType` field

## Verification Results

- `npx vitest run`: 31 tests passing (18 conflict engine + 13 other)
- `npm run build`: exits 0, no compilation errors
- 238 `planType: 'Core'` occurrences confirmed
- 238 `bufferOverride: 15` occurrences confirmed

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- [x] src/utils/conflictEngine.test.js — modified, committed 3f3cb1f
- [x] src/utils/conflictEngine.js — modified, committed 3f3cb1f
- [x] src/components/panel/WorkshopForm.jsx — modified, committed 25013ff
- [x] src/data/workshops.js — modified, committed 67b801f
- [x] All 31 tests passing
- [x] Build succeeds
