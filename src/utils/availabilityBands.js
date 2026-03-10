import { format } from 'date-fns';

// Grid constants — shared source of truth for CalendarGrid and this utility.
// CalendarGrid imports these to avoid duplication.
export const GRID_START_HOUR = 6;
export const GRID_END_HOUR = 22;
export const PX_PER_HOUR = 64;
export const PX_PER_MIN = PX_PER_HOUR / 60;
export const GRID_HEIGHT = (GRID_END_HOUR - GRID_START_HOUR) * PX_PER_HOUR; // 1024px

// Static Tailwind class lookup — complete strings required for JIT scanner.
// Pattern matches TYPE_CARD_STYLES in WorkshopCard.jsx.
export const COACH_OVERLAY_COLORS = [
  'bg-blue-200/50',
  'bg-purple-200/50',
  'bg-green-200/50',
  'bg-rose-200/50',
  'bg-amber-200/50',
  'bg-teal-200/50',
  'bg-orange-200/50',
  'bg-cyan-200/50',
  'bg-indigo-200/50',
  'bg-lime-200/50',
  'bg-pink-200/50',
  'bg-sky-200/50',
];

function parseTimeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Compute availability band positions for a given day.
 *
 * @param {Array} coaches - Array of coach objects from coaches data
 * @param {Date} day - JS Date object for the target day
 * @returns {Array<{ coachId: string, coachIndex: number, top: number, height: number }>}
 */
export function getAvailabilityBands(coaches, day) {
  const dayName = format(day, 'EEEE').toLowerCase(); // 'monday', 'tuesday', etc.
  const bands = [];

  coaches.forEach((coach, idx) => {
    // Skip inactive coaches
    if (coach.status === 'inactive') return;

    const slots = coach.availability.filter((a) => a.day === dayName);

    slots.forEach((slot) => {
      const startMins = parseTimeToMinutes(slot.start);
      const endMins = parseTimeToMinutes(slot.end);

      // Clamp to grid bounds [GRID_START_HOUR, GRID_END_HOUR]
      const clampedStart = Math.max(startMins, GRID_START_HOUR * 60);
      const clampedEnd = Math.min(endMins, GRID_END_HOUR * 60);

      // Skip if clamped range is empty
      if (clampedEnd <= clampedStart) return;

      const top = (clampedStart - GRID_START_HOUR * 60) * PX_PER_MIN;
      const height = (clampedEnd - clampedStart) * PX_PER_MIN;

      bands.push({ coachId: coach.id, coachIndex: idx, top, height });
    });
  });

  return bands;
}
