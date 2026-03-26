/**
 * Timezone utilities — all display/positioning should go through these helpers
 * so the user's chosen timezone is respected everywhere.
 */

export const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern (ET)' },
  { value: 'America/Chicago', label: 'Central (CT)' },
  { value: 'America/Denver', label: 'Mountain (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
];

/** Return the browser's IANA timezone string. */
export function getBrowserTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** Get the hour (0–23) for a Date in the given IANA timezone. */
export function getHoursInTz(date, tz) {
  const h = parseInt(
    date.toLocaleString('en-US', { timeZone: tz, hour: 'numeric', hour12: false }),
    10
  );
  return h === 24 ? 0 : h;
}

/** Get the minute (0–59) for a Date in the given IANA timezone. */
export function getMinutesInTz(date, tz) {
  return parseInt(
    date.toLocaleString('en-US', { timeZone: tz, minute: 'numeric' }),
    10
  );
}

/** Check if two Dates fall on the same calendar date in the given timezone. */
export function isSameDayInTz(d1, d2, tz) {
  const fmt = (d) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(d); // YYYY-MM-DD
  return fmt(d1) === fmt(d2);
}

/** Check if a Date is "today" in the given timezone. */
export function isTodayInTz(date, tz) {
  return isSameDayInTz(date, new Date(), tz);
}

/** Short timezone abbreviation, e.g. "EDT", "PDT", "GMT". */
export function getTzAbbr(tz) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    timeZoneName: 'short',
  })
    .formatToParts(new Date())
    .find((p) => p.type === 'timeZoneName')?.value ?? tz;
}

/**
 * Create a Date representing a specific clock time in a given IANA timezone.
 * E.g. createDateInTz('2026-03-25', 15, 30, 'America/New_York') → 3:30 PM ET as UTC Date.
 */
export function createDateInTz(dateStr, hour, minute, tz) {
  // dateStr: 'YYYY-MM-DD' or a Date (we extract YYYY-MM-DD in the target tz)
  let ymd;
  if (typeof dateStr === 'string') {
    ymd = dateStr;
  } else {
    // It's a Date — get the calendar date in the target timezone
    ymd = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(dateStr);
  }
  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');

  // Determine the UTC offset for this date in the target timezone
  const testDate = new Date(`${ymd}T12:00:00Z`);
  const tzName = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    timeZoneName: 'longOffset',
  })
    .formatToParts(testDate)
    .find((p) => p.type === 'timeZoneName')?.value;

  // tzName is like "GMT-04:00" or "GMT+10:00" — extract the offset
  const match = tzName?.match(/GMT([+-]\d{2}:\d{2})/);
  const offset = match ? match[1] : '+00:00';

  return new Date(`${ymd}T${hh}:${mm}:00${offset}`);
}
