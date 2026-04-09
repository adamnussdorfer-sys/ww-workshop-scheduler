---
phase: 13
slug: event-form-enhancements
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-08
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vite.config.js |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 2 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 1 | EVNT-01 | manual | Visual: planType field renders and persists | N/A | ⬜ pending |
| 13-01-02 | 01 | 1 | EVNT-02 | manual | Visual: draft saves with only title+time | N/A | ⬜ pending |
| 13-01-03 | 01 | 1 | EVNT-03 | unit | `npx vitest run` | ✅ conflictEngine.test.js | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers EVNT-01 and EVNT-02 (UI-only, manual verification).
EVNT-03 buffer override tests added to existing `src/utils/conflictEngine.test.js`.

*No new test infrastructure needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Plan type selector renders and persists | EVNT-01 | UI interaction — no unit-testable logic | Create workshop, select "Core Plus", save, reopen — verify selection persists |
| Draft saves with incomplete fields | EVNT-02 | Form validation behavior — UI flow | Click "Save Draft" with only title+time filled, verify no error, verify workshop appears in calendar |
| Buffer override field renders and defaults to 15 | EVNT-03 | UI rendering — logic tested via unit tests | Create workshop, verify buffer selector shows 6 options, default is "15 min" |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 2s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
