import { describe, it, expect } from 'vitest';
import { buildConflictMap, getSaturatedSlots } from './conflictEngine';
import { workshops } from '../data/workshops';
import { coaches } from '../data/coaches';
import { startOfWeek, addDays, setHours, setMinutes } from 'date-fns';

// Helper to create ISO date strings anchored to current week
function getWeekDay(dayOffset, hour, minute = 0) {
  const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
  return setMinutes(setHours(addDays(monday, dayOffset), hour), minute).toISOString();
}

// ── Double-booking detection ────────────────────────────────────────────────

describe('buildConflictMap - double-booking detection', () => {
  it('detects double-booking when same coach has overlapping workshops', () => {
    const syntheticCoach = {
      id: 'coach-db-test',
      name: 'Double Book Coach',
      status: 'active',
      availability: [{ day: 'monday', start: '06:00', end: '20:00' }],
    };

    const wsA = {
      id: 'ws-db-a',
      title: 'Workshop A',
      status: 'Published',
      coachId: 'coach-db-test',
      coCoachId: null,
      startTime: getWeekDay(0, 9, 0),
      endTime: getWeekDay(0, 10, 0),
    };
    const wsB = {
      id: 'ws-db-b',
      title: 'Workshop B',
      status: 'Published',
      coachId: 'coach-db-test',
      coCoachId: null,
      startTime: getWeekDay(0, 9, 30),
      endTime: getWeekDay(0, 10, 30),
    };

    const conflictMap = buildConflictMap([wsA, wsB], [syntheticCoach]);

    const aResult = conflictMap.get('ws-db-a');
    const bResult = conflictMap.get('ws-db-b');

    expect(aResult.hasConflicts).toBe(true);
    expect(bResult.hasConflicts).toBe(true);
    expect(aResult.ringColor).toBe('red');
    expect(bResult.ringColor).toBe('red');

    const aConflict = aResult.conflicts.find((c) => c.type === 'double-booking');
    expect(aConflict).toBeDefined();
    expect(aConflict.severity).toBe('red');
    expect(aConflict.message).toContain('Double Book Coach');
  });

  it('detects double-booking via co-coach', () => {
    const coach1 = {
      id: 'coach-co-1',
      name: 'Primary Coach',
      status: 'active',
      availability: [{ day: 'tuesday', start: '06:00', end: '20:00' }],
    };
    const coach2 = {
      id: 'coach-co-2',
      name: 'Shared Coach',
      status: 'active',
      availability: [{ day: 'tuesday', start: '06:00', end: '20:00' }],
    };

    const wsA = {
      id: 'ws-co-a',
      title: 'Workshop A',
      status: 'Published',
      coachId: 'coach-co-1',
      coCoachId: 'coach-co-2',
      startTime: getWeekDay(1, 10, 0),
      endTime: getWeekDay(1, 11, 0),
    };
    const wsB = {
      id: 'ws-co-b',
      title: 'Workshop B',
      status: 'Published',
      coachId: 'coach-co-2',
      coCoachId: null,
      startTime: getWeekDay(1, 10, 30),
      endTime: getWeekDay(1, 11, 30),
    };

    const conflictMap = buildConflictMap([wsA, wsB], [coach1, coach2]);
    expect(conflictMap.get('ws-co-a').ringColor).toBe('red');
    expect(conflictMap.get('ws-co-b').ringColor).toBe('red');
  });
});

// ── Buffer violation detection ──────────────────────────────────────────────

describe('buildConflictMap - buffer violation detection', () => {
  it('detects buffer violation when gap is less than 15 minutes', () => {
    const coach = {
      id: 'coach-buf',
      name: 'Buffer Coach',
      status: 'active',
      availability: [{ day: 'wednesday', start: '06:00', end: '20:00' }],
    };

    const wsA = {
      id: 'ws-buf-a',
      title: 'Workshop A',
      status: 'Published',
      coachId: 'coach-buf',
      coCoachId: null,
      startTime: getWeekDay(2, 11, 0),
      endTime: getWeekDay(2, 12, 0),
    };
    const wsB = {
      id: 'ws-buf-b',
      title: 'Workshop B',
      status: 'Published',
      coachId: 'coach-buf',
      coCoachId: null,
      startTime: getWeekDay(2, 12, 5),
      endTime: getWeekDay(2, 13, 0),
    };

    const conflictMap = buildConflictMap([wsA, wsB], [coach]);

    const aBuffer = conflictMap.get('ws-buf-a').conflicts.find((c) => c.type === 'buffer');
    const bBuffer = conflictMap.get('ws-buf-b').conflicts.find((c) => c.type === 'buffer');

    expect(aBuffer).toBeDefined();
    expect(bBuffer).toBeDefined();
    expect(aBuffer.severity).toBe('orange');
    expect(aBuffer.message).toContain('5');
    expect(conflictMap.get('ws-buf-a').ringColor).toBe('orange');
  });

  it('does not flag buffer when gap is 15+ minutes', () => {
    const coach = {
      id: 'coach-ok',
      name: 'OK Coach',
      status: 'active',
      availability: [{ day: 'wednesday', start: '06:00', end: '20:00' }],
    };

    const wsA = {
      id: 'ws-ok-a',
      title: 'Workshop A',
      status: 'Published',
      coachId: 'coach-ok',
      coCoachId: null,
      startTime: getWeekDay(2, 10, 0),
      endTime: getWeekDay(2, 11, 0),
    };
    const wsB = {
      id: 'ws-ok-b',
      title: 'Workshop B',
      status: 'Published',
      coachId: 'coach-ok',
      coCoachId: null,
      startTime: getWeekDay(2, 11, 15),
      endTime: getWeekDay(2, 12, 15),
    };

    const conflictMap = buildConflictMap([wsA, wsB], [coach]);
    expect(conflictMap.get('ws-ok-a').hasConflicts).toBe(false);
    expect(conflictMap.get('ws-ok-b').hasConflicts).toBe(false);
  });
});

// ── Availability conflict detection ─────────────────────────────────────────

describe('buildConflictMap - availability conflict detection', () => {
  it('detects availability conflict when workshop is outside coach availability', () => {
    const syntheticCoach = {
      id: 'coach-test',
      name: 'Test Coach',
      status: 'active',
      availability: [{ day: 'monday', start: '09:00', end: '17:00' }],
    };

    const syntheticWorkshop = {
      id: 'ws-test-avail',
      title: 'Early Morning Test',
      status: 'Published',
      coachId: 'coach-test',
      coCoachId: null,
      startTime: getWeekDay(0, 6, 0),
      endTime: getWeekDay(0, 7, 0),
    };

    const conflictMap = buildConflictMap([syntheticWorkshop], [syntheticCoach]);

    const result = conflictMap.get('ws-test-avail');
    expect(result).toBeDefined();

    const availConflict = result.conflicts.find((c) => c.type === 'availability');
    expect(availConflict).toBeDefined();
    expect(availConflict.severity).toBe('orange');
    expect(availConflict.message).toContain('Test Coach');
  });
});

// ── Cancelled exclusion ─────────────────────────────────────────────────────

describe('buildConflictMap - cancelled workshop exclusion', () => {
  it('excludes cancelled workshops from the conflict map', () => {
    const coach = {
      id: 'coach-cancel',
      name: 'Cancel Coach',
      status: 'active',
      availability: [{ day: 'monday', start: '06:00', end: '20:00' }],
    };

    const wsActive = {
      id: 'ws-active',
      title: 'Active',
      status: 'Published',
      coachId: 'coach-cancel',
      coCoachId: null,
      startTime: getWeekDay(0, 9, 0),
      endTime: getWeekDay(0, 10, 0),
    };
    const wsCancelled = {
      id: 'ws-cancelled',
      title: 'Cancelled',
      status: 'Cancelled',
      coachId: 'coach-cancel',
      coCoachId: null,
      startTime: getWeekDay(0, 9, 30),
      endTime: getWeekDay(0, 10, 30),
    };

    const conflictMap = buildConflictMap([wsActive, wsCancelled], [coach]);
    expect(conflictMap.has('ws-active')).toBe(true);
    expect(conflictMap.has('ws-cancelled')).toBe(false);
    // No double-booking since cancelled workshop is excluded
    expect(conflictMap.get('ws-active').hasConflicts).toBe(false);
  });

  it('cancelled workshops in real data do not appear in conflict map', () => {
    const conflictMap = buildConflictMap(workshops, coaches);
    const cancelledWorkshops = workshops.filter((w) => w.status === 'Cancelled');
    cancelledWorkshops.forEach((w) => {
      expect(conflictMap.has(w.id)).toBe(false);
    });
  });
});

// ── Ring color priority ─────────────────────────────────────────────────────

describe('buildConflictMap - ring color priority', () => {
  it('assigns red ringColor when workshop has both double-booking and buffer violation', () => {
    const syntheticCoach = {
      id: 'coach-priority-test',
      name: 'Priority Test Coach',
      status: 'active',
      availability: [{ day: 'tuesday', start: '06:00', end: '20:00' }],
    };

    const wsA = {
      id: 'ws-priority-a',
      title: 'Priority Workshop A',
      status: 'Published',
      coachId: 'coach-priority-test',
      coCoachId: null,
      startTime: getWeekDay(1, 9, 0),
      endTime: getWeekDay(1, 10, 0),
    };
    const wsB = {
      id: 'ws-priority-b',
      title: 'Priority Workshop B',
      status: 'Published',
      coachId: 'coach-priority-test',
      coCoachId: null,
      startTime: getWeekDay(1, 9, 30),
      endTime: getWeekDay(1, 10, 30),
    };
    const wsC = {
      id: 'ws-priority-c',
      title: 'Priority Workshop C',
      status: 'Published',
      coachId: 'coach-priority-test',
      coCoachId: null,
      startTime: getWeekDay(1, 10, 35),
      endTime: getWeekDay(1, 11, 30),
    };

    const conflictMap = buildConflictMap([wsA, wsB, wsC], [syntheticCoach]);

    const wsBResult = conflictMap.get('ws-priority-b');
    expect(wsBResult).toBeDefined();

    const hasDoubleBooking = wsBResult.conflicts.some((c) => c.type === 'double-booking');
    const hasBuffer = wsBResult.conflicts.some((c) => c.type === 'buffer');

    expect(hasDoubleBooking).toBe(true);
    expect(hasBuffer).toBe(true);
    expect(wsBResult.ringColor).toBe('red');
  });
});

// ── Integration: buildConflictMap on real data ──────────────────────────────

describe('buildConflictMap - integration with real data', () => {
  it('returns a conflict map entry for every non-cancelled workshop', () => {
    const conflictMap = buildConflictMap(workshops, coaches);
    const active = workshops.filter((w) => w.status !== 'Cancelled');
    expect(conflictMap.size).toBe(active.length);
  });
});

// ── getSaturatedSlots tests (GRID_START_HOUR=2) ─────────────────────────────

describe('getSaturatedSlots', () => {
  it('returns slot indices where 4+ workshops overlap in a 30-min window', () => {
    // 4 workshops at 07:00-08:00. slotIndex = (7-2)*2 = 10
    const dayWorkshops = Array.from({ length: 4 }, (_, i) => ({
      id: `sat-${i}`,
      status: 'Published',
      startTime: getWeekDay(0, 7, 0),
      endTime: getWeekDay(0, 8, 0),
    }));

    const saturatedSlots = getSaturatedSlots(dayWorkshops);

    expect(saturatedSlots.length).toBeGreaterThan(0);
    expect(saturatedSlots[0].count).toBeGreaterThanOrEqual(4);
    // Slot 10 = 7:00 (GRID_START_HOUR=2, so (7-2)*2=10)
    const slot7am = saturatedSlots.find((s) => s.slotIndex === 10);
    expect(slot7am).toBeDefined();
    expect(slot7am.count).toBe(4);
  });

  it('does not return slots with fewer than 4 overlapping workshops', () => {
    const dayWorkshops = Array.from({ length: 3 }, (_, i) => ({
      id: `sat-${i}`,
      status: 'Published',
      startTime: getWeekDay(0, 7, 0),
      endTime: getWeekDay(0, 8, 0),
    }));

    const saturatedSlots = getSaturatedSlots(dayWorkshops);
    expect(saturatedSlots).toHaveLength(0);
  });

  it('returns correct slotIndex for a saturated window at 10:00', () => {
    // slotIndex = (10-2)*2 = 16
    const dayWorkshops = Array.from({ length: 4 }, (_, i) => ({
      id: `sat-10-${i}`,
      status: 'Published',
      startTime: getWeekDay(0, 10, 0),
      endTime: getWeekDay(0, 11, 0),
    }));

    const saturatedSlots = getSaturatedSlots(dayWorkshops);
    expect(saturatedSlots.length).toBeGreaterThan(0);

    const slotAt10 = saturatedSlots.find((s) => s.slotIndex === 16);
    expect(slotAt10).toBeDefined();
    expect(slotAt10.count).toBe(4);
  });

  it('returns empty array when no workshops are provided', () => {
    const saturatedSlots = getSaturatedSlots([]);
    expect(saturatedSlots).toHaveLength(0);
  });
});
