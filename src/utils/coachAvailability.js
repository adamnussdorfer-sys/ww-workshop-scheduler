import { getHoursInTz, getMinutesInTz } from './timezone';

/**
 * Compute a coach's availability for a given workshop date/time.
 * Converts the workshop time to the coach's timezone before comparing
 * against their availability windows (which are stored in coach-local time).
 *
 * @param {Object} coach - Coach object from coaches data
 * @param {Date} date - JS Date object (UTC) for the workshop start
 * @returns {{ available: boolean, reason: string|null }}
 */
export function getCoachAvailability(coach, date) {
  // Inactive coaches are never available
  if (coach.status === 'inactive') {
    return { available: false, reason: 'Inactive coach' };
  }

  // Availability windows are stored in ET (America/New_York).
  // When backed by a real API, the server will handle timezone conversion.
  const tz = 'America/New_York';

  // Get day name in ET
  const dayName = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'long',
  }).format(date).toLowerCase();

  const slot = coach.availability.find((a) => a.day === dayName);

  if (!slot) {
    const dayDisplay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    return { available: false, reason: 'No availability on ' + dayDisplay };
  }

  // Parse slot start/end times to total minutes
  const [slotStartH, slotStartM] = slot.start.split(':').map(Number);
  const [slotEndH, slotEndM] = slot.end.split(':').map(Number);
  const slotStartMinutes = slotStartH * 60 + slotStartM;
  const slotEndMinutes = slotEndH * 60 + slotEndM;

  // Get workshop time in the coach's timezone
  const workshopHour = getHoursInTz(date, tz);
  const workshopMinute = getMinutesInTz(date, tz);
  const workshopStartMinutes = workshopHour * 60 + workshopMinute;

  if (workshopStartMinutes < slotStartMinutes) {
    return { available: false, reason: 'Available from ' + slot.start };
  }

  if (workshopStartMinutes >= slotEndMinutes) {
    return { available: false, reason: 'Available until ' + slot.end };
  }

  return { available: true, reason: null };
}
