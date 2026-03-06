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

// ── Double-booking tests (Conflict A & B) ────────────────────────────────────

describe('buildConflictMap - double-booking detection', () => {
  it('detects Conflict A: coach-005 (Diane Okafor) double-booked on ws-021 and ws-022', () => {
    const conflictMap = buildConflictMap(workshops, coaches);

    const ws021Result = conflictMap.get('ws-021');
    const ws022Result = conflictMap.get('ws-022');

    expect(ws021Result).toBeDefined();
    expect(ws022Result).toBeDefined();

    const ws021DoubleBooking = ws021Result.conflicts.find(
      (c) => c.type === 'double-booking'
    );
    const ws022DoubleBooking = ws022Result.conflicts.find(
      (c) => c.type === 'double-booking'
    );

    expect(ws021DoubleBooking).toBeDefined();
    expect(ws022DoubleBooking).toBeDefined();

    expect(ws021DoubleBooking.severity).toBe('red');
    expect(ws022DoubleBooking.severity).toBe('red');

    // Messages should mention coach name and other workshop
    expect(ws021DoubleBooking.message).toContain('Diane Okafor');
    expect(ws022DoubleBooking.message).toContain('Diane Okafor');
  });

  it('assigns ringColor red for ws-021 and ws-022 (double-booking)', () => {
    const conflictMap = buildConflictMap(workshops, coaches);

    expect(conflictMap.get('ws-021').ringColor).toBe('red');
    expect(conflictMap.get('ws-022').ringColor).toBe('red');
    expect(conflictMap.get('ws-021').hasConflicts).toBe(true);
    expect(conflictMap.get('ws-022').hasConflicts).toBe(true);
  });

  it('detects Conflict B: coach-008 (Alicia Fontaine) double-booked on ws-033 and ws-034', () => {
    const conflictMap = buildConflictMap(workshops, coaches);

    const ws033Result = conflictMap.get('ws-033');
    const ws034Result = conflictMap.get('ws-034');

    expect(ws033Result).toBeDefined();
    expect(ws034Result).toBeDefined();

    const ws033DoubleBooking = ws033Result.conflicts.find(
      (c) => c.type === 'double-booking'
    );
    const ws034DoubleBooking = ws034Result.conflicts.find(
      (c) => c.type === 'double-booking'
    );

    expect(ws033DoubleBooking).toBeDefined();
    expect(ws034DoubleBooking).toBeDefined();

    expect(ws033DoubleBooking.severity).toBe('red');
    expect(ws034DoubleBooking.severity).toBe('red');

    expect(ws033DoubleBooking.message).toContain('Alicia Fontaine');
    expect(ws034DoubleBooking.message).toContain('Alicia Fontaine');
  });

  it('assigns ringColor red for ws-033 and ws-034 (double-booking)', () => {
    const conflictMap = buildConflictMap(workshops, coaches);

    expect(conflictMap.get('ws-033').ringColor).toBe('red');
    expect(conflictMap.get('ws-034').ringColor).toBe('red');
  });
});

// ── Buffer violation tests (Conflict C) ─────────────────────────────────────

describe('buildConflictMap - buffer violation detection', () => {
  it('detects Conflict C: coach-012 (Thomas Erikson) buffer violation on ws-027 and ws-028', () => {
    const conflictMap = buildConflictMap(workshops, coaches);

    const ws027Result = conflictMap.get('ws-027');
    const ws028Result = conflictMap.get('ws-028');

    expect(ws027Result).toBeDefined();
    expect(ws028Result).toBeDefined();

    const ws027Buffer = ws027Result.conflicts.find((c) => c.type === 'buffer');
    const ws028Buffer = ws028Result.conflicts.find((c) => c.type === 'buffer');

    expect(ws027Buffer).toBeDefined();
    expect(ws028Buffer).toBeDefined();

    expect(ws027Buffer.severity).toBe('orange');
    expect(ws028Buffer.severity).toBe('orange');

    // Message should mention the gap duration (5 minutes)
    expect(ws027Buffer.message).toContain('5');
    expect(ws028Buffer.message).toContain('5');
  });

  it('assigns ringColor orange for ws-027 and ws-028 (buffer violation)', () => {
    const conflictMap = buildConflictMap(workshops, coaches);

    expect(conflictMap.get('ws-027').ringColor).toBe('orange');
    expect(conflictMap.get('ws-028').ringColor).toBe('orange');
    expect(conflictMap.get('ws-027').hasConflicts).toBe(true);
    expect(conflictMap.get('ws-028').hasConflicts).toBe(true);
  });
});

// ── Availability conflict test ────────────────────────────────────────────────

describe('buildConflictMap - availability conflict detection', () => {
  it('detects availability conflict when workshop is scheduled outside coach availability', () => {
    // coach-001 (Sarah Mitchell) is available Mon-Fri 09:00-17:00
    // Create a synthetic workshop at Monday 06:00 (before availability window)
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
      startTime: getWeekDay(0, 6, 0), // Monday 06:00 — before availability
      endTime: getWeekDay(0, 7, 0),
    };

    const testWorkshops = [syntheticWorkshop];
    const testCoaches = [syntheticCoach];

    const conflictMap = buildConflictMap(testWorkshops, testCoaches);

    const result = conflictMap.get('ws-test-avail');
    expect(result).toBeDefined();

    const availConflict = result.conflicts.find(
      (c) => c.type === 'availability'
    );
    expect(availConflict).toBeDefined();
    expect(availConflict.severity).toBe('orange');
    expect(availConflict.message).toContain('Test Coach');
  });
});

// ── Cancelled exclusion test ──────────────────────────────────────────────────

describe('buildConflictMap - cancelled workshop exclusion', () => {
  it('does not include cancelled workshop ws-026 in the conflict map', () => {
    const conflictMap = buildConflictMap(workshops, coaches);
    expect(conflictMap.has('ws-026')).toBe(false);
  });

  it('does not include cancelled workshop ws-048 in the conflict map', () => {
    const conflictMap = buildConflictMap(workshops, coaches);
    expect(conflictMap.has('ws-048')).toBe(false);
  });

  it('cancelled workshops do not appear as keys in the conflict map at all', () => {
    const conflictMap = buildConflictMap(workshops, coaches);
    const cancelledWorkshops = workshops.filter((w) => w.status === 'Cancelled');
    cancelledWorkshops.forEach((w) => {
      expect(conflictMap.has(w.id)).toBe(false);
    });
  });
});

// ── Ring color priority test ─────────────────────────────────────────────────

describe('buildConflictMap - ring color priority', () => {
  it('assigns red ringColor when workshop has both double-booking (red) and buffer violation (orange)', () => {
    // Create synthetic scenario: coach double-booked AND has buffer violation
    const syntheticCoach = {
      id: 'coach-priority-test',
      name: 'Priority Test Coach',
      status: 'active',
      availability: [{ day: 'tuesday', start: '06:00', end: '20:00' }],
    };

    // ws-A and ws-B overlap (double-booking)
    // ws-A and ws-C have only 5 min gap (buffer violation)
    const wsA = {
      id: 'ws-priority-a',
      title: 'Priority Workshop A',
      status: 'Published',
      coachId: 'coach-priority-test',
      coCoachId: null,
      startTime: getWeekDay(1, 9, 0),  // Tue 09:00
      endTime: getWeekDay(1, 10, 0),   // Tue 10:00
    };
    const wsB = {
      id: 'ws-priority-b',
      title: 'Priority Workshop B',
      status: 'Published',
      coachId: 'coach-priority-test',
      coCoachId: null,
      startTime: getWeekDay(1, 9, 30), // Tue 09:30 — overlaps with A
      endTime: getWeekDay(1, 10, 30),  // Tue 10:30
    };
    const wsC = {
      id: 'ws-priority-c',
      title: 'Priority Workshop C',
      status: 'Published',
      coachId: 'coach-priority-test',
      coCoachId: null,
      startTime: getWeekDay(1, 10, 35), // Tue 10:35 — only 35 min after A ends (10:00), 5 min after B ends (10:30)
      endTime: getWeekDay(1, 11, 30),   // Tue 11:30
    };

    const conflictMap = buildConflictMap([wsA, wsB, wsC], [syntheticCoach]);

    // wsB has a double-booking (overlaps wsA) and a buffer violation (5 min before wsC)
    const wsBResult = conflictMap.get('ws-priority-b');
    expect(wsBResult).toBeDefined();

    const hasDoubleBooking = wsBResult.conflicts.some(
      (c) => c.type === 'double-booking'
    );
    const hasBuffer = wsBResult.conflicts.some((c) => c.type === 'buffer');

    expect(hasDoubleBooking).toBe(true);
    expect(hasBuffer).toBe(true);

    // Red should beat orange — ringColor must be 'red'
    expect(wsBResult.ringColor).toBe('red');
  });

  it('non-conflicted workshops have ringColor null and hasConflicts false', () => {
    const conflictMap = buildConflictMap(workshops, coaches);

    // ws-005 has no conflicts: coach-007 Mon 12:00-12:30, no overlapping or buffer issues
    const ws005Result = conflictMap.get('ws-005');
    expect(ws005Result).toBeDefined();
    expect(ws005Result.ringColor).toBeNull();
    expect(ws005Result.hasConflicts).toBe(false);
  });
});

// ── getSaturatedSlots tests ──────────────────────────────────────────────────

describe('getSaturatedSlots', () => {
  it('returns slot indices where 4+ workshops overlap in a 30-min window', () => {
    // Create 4 workshops all overlapping in slot 0 (07:00-07:30, slot index 0 at GRID_START_HOUR=7)
    const dayWorkshops = [
      {
        id: 'sat-1',
        status: 'Published',
        startTime: getWeekDay(0, 7, 0),
        endTime: getWeekDay(0, 8, 0),
      },
      {
        id: 'sat-2',
        status: 'Published',
        startTime: getWeekDay(0, 7, 0),
        endTime: getWeekDay(0, 8, 0),
      },
      {
        id: 'sat-3',
        status: 'Published',
        startTime: getWeekDay(0, 7, 0),
        endTime: getWeekDay(0, 8, 0),
      },
      {
        id: 'sat-4',
        status: 'Published',
        startTime: getWeekDay(0, 7, 0),
        endTime: getWeekDay(0, 8, 0),
      },
    ];

    const saturatedSlots = getSaturatedSlots(dayWorkshops);

    expect(saturatedSlots.length).toBeGreaterThan(0);
    expect(saturatedSlots[0].count).toBeGreaterThanOrEqual(4);
    expect(saturatedSlots[0].slotIndex).toBeDefined();
  });

  it('does not return slots with fewer than 4 overlapping workshops', () => {
    // Only 3 workshops overlapping — should return empty
    const dayWorkshops = [
      {
        id: 'sat-1',
        status: 'Published',
        startTime: getWeekDay(0, 7, 0),
        endTime: getWeekDay(0, 8, 0),
      },
      {
        id: 'sat-2',
        status: 'Published',
        startTime: getWeekDay(0, 7, 0),
        endTime: getWeekDay(0, 8, 0),
      },
      {
        id: 'sat-3',
        status: 'Published',
        startTime: getWeekDay(0, 7, 0),
        endTime: getWeekDay(0, 8, 0),
      },
    ];

    const saturatedSlots = getSaturatedSlots(dayWorkshops);
    expect(saturatedSlots).toHaveLength(0);
  });

  it('returns correct slotIndex for a saturated window not at start', () => {
    // 4 workshops overlapping at 10:00 — slotIndex = (10*60 - 7*60) / 30 = 6
    const dayWorkshops = Array.from({ length: 4 }, (_, i) => ({
      id: `sat-10-${i}`,
      status: 'Published',
      startTime: getWeekDay(0, 10, 0),
      endTime: getWeekDay(0, 11, 0),
    }));

    const saturatedSlots = getSaturatedSlots(dayWorkshops);
    expect(saturatedSlots.length).toBeGreaterThan(0);

    // Slot 6: 10:00-10:30 (7*60 + 6*30 = 600min = 10:00)
    const slotAt10 = saturatedSlots.find((s) => s.slotIndex === 6);
    expect(slotAt10).toBeDefined();
    expect(slotAt10.count).toBe(4);
  });

  it('returns empty array when no workshops are provided', () => {
    const saturatedSlots = getSaturatedSlots([]);
    expect(saturatedSlots).toHaveLength(0);
  });
});
