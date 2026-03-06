import { format } from 'date-fns';

/**
 * Compute a coach's availability for a given workshop date and start time.
 *
 * @param {Object} coach - Coach object from coaches data
 * @param {Date} date - JS Date object for the workshop day
 * @param {number} startHour - Workshop start hour (0-23)
 * @param {number} startMinute - Workshop start minute (0-59)
 * @returns {{ available: boolean, reason: string|null }}
 */
export function getCoachAvailability(coach, date, startHour, startMinute) {
  // Inactive coaches are never available
  if (coach.status === 'inactive') {
    return { available: false, reason: 'Inactive coach' };
  }

  const dayName = format(date, 'EEEE').toLowerCase(); // 'monday', 'tuesday', etc.
  const slot = coach.availability.find((a) => a.day === dayName);

  if (!slot) {
    return { available: false, reason: 'No availability on ' + format(date, 'EEEE') };
  }

  // Parse slot start/end times to total minutes
  const [slotStartH, slotStartM] = slot.start.split(':').map(Number);
  const [slotEndH, slotEndM] = slot.end.split(':').map(Number);
  const slotStartMinutes = slotStartH * 60 + slotStartM;
  const slotEndMinutes = slotEndH * 60 + slotEndM;

  // Compute workshop start in total minutes
  const workshopStartMinutes = startHour * 60 + startMinute;

  if (workshopStartMinutes < slotStartMinutes) {
    return { available: false, reason: 'Available from ' + slot.start };
  }

  if (workshopStartMinutes >= slotEndMinutes) {
    return { available: false, reason: 'Available until ' + slot.end };
  }

  return { available: true, reason: null };
}
