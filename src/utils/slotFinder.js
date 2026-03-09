import { startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';

const GRID_START_HOUR = 6;
const GRID_END_HOUR = 22;

/**
 * Find the next available 30-minute slot from now within the calendar grid.
 * Scans 7 days starting from Monday of the current week, checking 30-min slots
 * from GRID_START_HOUR to GRID_END_HOUR.
 *
 * For today: starts scanning from the next 30-min boundary after the current time.
 * For future days: starts scanning from GRID_START_HOUR:00.
 *
 * @param {Array} workshops - All workshops from AppContext
 * @returns {{ date: Date, hour: number, minute: number }}
 */
export function findNextAvailableSlot(workshops) {
  const now = new Date();
  const monday = startOfWeek(now, { weekStartsOn: 1 });

  // Build a Set of occupied slot keys from non-Cancelled workshops
  // Key format: "YYYY-M-D:H:M" (using getMonth/getDate which are zero-indexed for month)
  const occupied = new Set();
  workshops
    .filter((ws) => ws.status !== 'Cancelled')
    .forEach((ws) => {
      const d = parseISO(ws.startTime);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}:${d.getHours()}:${d.getMinutes()}`;
      occupied.add(key);
    });

  // Scan 7 days starting from Monday of the current week
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const day = addDays(monday, dayOffset);
    const isToday = isSameDay(day, now);

    let startHour;
    let startMinute;

    if (isToday) {
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      if (currentMinute < 30) {
        // Round up to :30 of the current hour
        startHour = Math.max(GRID_START_HOUR, currentHour);
        startMinute = 30;
      } else {
        // Round up to :00 of the next hour
        startHour = Math.max(GRID_START_HOUR, currentHour + 1);
        startMinute = 0;
      }
    } else {
      startHour = GRID_START_HOUR;
      startMinute = 0;
    }

    for (let h = startHour; h < GRID_END_HOUR; h++) {
      for (const m of [0, 30]) {
        // Skip slots before our start minute on the first hour
        if (h === startHour && m < startMinute) continue;

        const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}:${h}:${m}`;
        if (!occupied.has(key)) {
          return { date: day, hour: h, minute: m };
        }
      }
    }
  }

  // Fallback: next Monday at 09:00 (should rarely be reached)
  return { date: addDays(monday, 7), hour: 9, minute: 0 };
}
