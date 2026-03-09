import { parseISO, differenceInMinutes, format } from 'date-fns';
import { getCoachAvailability } from './coachAvailability';

// ── Constants ────────────────────────────────────────────────────────────────

const BUFFER_MINUTES = 15;
const SATURATION_THRESHOLD = 4;
const GRID_START_HOUR = 6;  // Calendar grid starts at 6:00
const GRID_SLOTS = 32;      // 32 half-hour slots (6:00 to 22:00)

// ── Helper functions (internal) ───────────────────────────────────────────────

/**
 * Check if two time ranges overlap.
 * startA < endB AND endA > startB
 */
function timesOverlap(startA, endA, startB, endB) {
  return new Date(startA) < new Date(endB) && new Date(endA) > new Date(startB);
}

/**
 * Return coach IDs that appear in both workshops (across primary and co-coach roles).
 */
function getSharedCoaches(a, b) {
  const aCoaches = [a.coachId, a.coCoachId].filter(Boolean);
  const bCoaches = [b.coachId, b.coCoachId].filter(Boolean);
  return aCoaches.filter((id) => bCoaches.includes(id));
}

/**
 * Group workshops by all coach IDs they involve (primary + co-coach).
 * Returns Map<coachId, workshop[]>
 */
function groupByCoach(workshops) {
  const map = new Map();
  for (const ws of workshops) {
    const coachIds = [ws.coachId, ws.coCoachId].filter(Boolean);
    for (const id of coachIds) {
      if (!map.has(id)) map.set(id, []);
      map.get(id).push(ws);
    }
  }
  return map;
}

/**
 * Convert an ISO datetime string to minutes from midnight.
 */
function timeToMinutes(isoString) {
  const d = new Date(isoString);
  return d.getHours() * 60 + d.getMinutes();
}

/**
 * Format an ISO datetime string as human-readable time (e.g., "10:30 AM").
 */
function formatTime(isoString) {
  return format(parseISO(isoString), 'h:mm a');
}

/**
 * Add a conflict to the result map entry, updating ringColor immediately.
 */
function addConflict(resultMap, workshopId, conflict) {
  const entry = resultMap.get(workshopId);
  if (!entry) return;
  entry.conflicts.push(conflict);
  // Priority: red > orange
  if (conflict.severity === 'red') {
    entry.ringColor = 'red';
  } else if (conflict.severity === 'orange' && entry.ringColor !== 'red') {
    entry.ringColor = 'orange';
  }
  entry.hasConflicts = true;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Build a conflict map for all non-cancelled workshops.
 *
 * @param {Object[]} workshops - All workshop objects
 * @param {Object[]} coaches - All coach objects
 * @returns {Map<string, ConflictResult>} Map keyed by workshopId
 *
 * ConflictResult = {
 *   conflicts: Conflict[],
 *   ringColor: 'red' | 'orange' | null,
 *   hasConflicts: boolean
 * }
 *
 * Conflict = {
 *   type: 'double-booking' | 'buffer' | 'availability',
 *   severity: 'red' | 'orange',
 *   message: string
 * }
 */
export function buildConflictMap(workshops, coaches) {
  // CONFLICT-05: Exclude cancelled workshops
  const active = workshops.filter((w) => w.status !== 'Cancelled');

  // Build O(1) coach lookup by ID
  const coachMap = new Map(coaches.map((c) => [c.id, c]));

  // Initialize result map with empty entries for all active workshops
  const resultMap = new Map();
  for (const ws of active) {
    resultMap.set(ws.id, {
      conflicts: [],
      ringColor: null,
      hasConflicts: false,
    });
  }

  // ── Double-booking detection (CONFLICT-01) ───────────────────────────────
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i];
      const b = active[j];

      const sharedCoaches = getSharedCoaches(a, b);
      if (sharedCoaches.length === 0) continue;

      if (!timesOverlap(a.startTime, a.endTime, b.startTime, b.endTime)) continue;

      // Each shared coach produces a conflict entry on both workshops
      for (const coachId of sharedCoaches) {
        const coach = coachMap.get(coachId);
        const coachName = coach ? coach.name : coachId;

        addConflict(resultMap, a.id, {
          type: 'double-booking',
          severity: 'red',
          message: `Coach ${coachName} also assigned to "${b.title}" at ${formatTime(b.startTime)}`,
        });

        addConflict(resultMap, b.id, {
          type: 'double-booking',
          severity: 'red',
          message: `Coach ${coachName} also assigned to "${a.title}" at ${formatTime(a.startTime)}`,
        });
      }
    }
  }

  // ── Buffer violation detection (CONFLICT-03) ─────────────────────────────
  const coachWorkshops = groupByCoach(active);

  for (const [, workshopsForCoach] of coachWorkshops) {
    // Sort by start time ascending
    const sorted = [...workshopsForCoach].sort(
      (a, b) => new Date(a.startTime) - new Date(b.startTime)
    );

    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i];
      const b = sorted[i + 1];

      // Skip pairs that overlap (those are handled by double-booking)
      if (timesOverlap(a.startTime, a.endTime, b.startTime, b.endTime)) continue;

      const gapMinutes = differenceInMinutes(
        new Date(b.startTime),
        new Date(a.endTime)
      );

      if (gapMinutes < BUFFER_MINUTES) {
        addConflict(resultMap, a.id, {
          type: 'buffer',
          severity: 'orange',
          message: `Only ${gapMinutes} min gap before "${b.title}" — recommend 15+ min buffer`,
        });

        addConflict(resultMap, b.id, {
          type: 'buffer',
          severity: 'orange',
          message: `Only ${gapMinutes} min gap after "${a.title}" — recommend 15+ min buffer`,
        });
      }
    }
  }

  // ── Availability conflict detection (CONFLICT-04) ────────────────────────
  for (const ws of active) {
    const coachIds = [ws.coachId, ws.coCoachId].filter(Boolean);

    for (const coachId of coachIds) {
      const coach = coachMap.get(coachId);
      if (!coach) continue;

      const startDate = new Date(ws.startTime);
      const startHour = startDate.getHours();
      const startMinute = startDate.getMinutes();

      const { available, reason } = getCoachAvailability(
        coach,
        startDate,
        startHour,
        startMinute
      );

      if (!available) {
        addConflict(resultMap, ws.id, {
          type: 'availability',
          severity: 'orange',
          message: `Coach ${coach.name} not available: ${reason}`,
        });
      }
    }
  }

  return resultMap;
}

/**
 * Identify 30-minute grid slots that have 4 or more concurrent workshops.
 *
 * @param {Object[]} dayWorkshops - Non-cancelled workshops for a single day
 * @returns {Array<{slotIndex: number, count: number}>} Saturated slots (count >= 4)
 */
export function getSaturatedSlots(dayWorkshops) {
  const saturated = [];

  for (let i = 0; i < GRID_SLOTS; i++) {
    // Slot start and end in minutes from midnight
    const slotStart = GRID_START_HOUR * 60 + i * 30;
    const slotEnd = slotStart + 30;

    let count = 0;
    for (const ws of dayWorkshops) {
      const wsStart = timeToMinutes(ws.startTime);
      const wsEnd = timeToMinutes(ws.endTime);
      // Workshop overlaps slot if wsStart < slotEnd AND wsEnd > slotStart
      if (wsStart < slotEnd && wsEnd > slotStart) {
        count++;
      }
    }

    if (count >= SATURATION_THRESHOLD) {
      saturated.push({ slotIndex: i, count });
    }
  }

  return saturated;
}
