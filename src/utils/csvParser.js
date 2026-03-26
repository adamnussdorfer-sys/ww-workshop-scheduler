const WORKSHOP_TYPES = [
  'Weekly Workshop',
  'Weekly Connection',
  'All In',
  'GLP-1 & Diabetes',
  'Movement & Fitness',
  'Nutrition & Cooking',
  'Mindset & Wellness',
  'Community',
  'Education',
  'Real Room',
  'Life Stage',
  'Coaching Corner',
];

const VALID_MARKETS = ['US', 'CA', 'UK', 'ANZ'];

// Build a lowercase lookup map for fuzzy type matching
const TYPE_LOOKUP = new Map(WORKSHOP_TYPES.map((t) => [t.toLowerCase(), t]));

/**
 * Parse a single CSV line, respecting quoted fields (handles commas inside quotes).
 */
function parseCsvLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

/**
 * Parse a date string in YYYY-MM-DD or MM/DD/YYYY format. Returns YYYY-MM-DD or null.
 */
function parseDate(str) {
  if (!str) return null;
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const d = new Date(str + 'T00:00:00');
    return isNaN(d) ? null : str;
  }
  // MM/DD/YYYY
  const m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const [, mm, dd, yyyy] = m;
    const iso = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    const d = new Date(iso + 'T00:00:00');
    return isNaN(d) ? null : iso;
  }
  return null;
}

/**
 * Parse a time string in HH:MM (24h) or h:mm AM/PM format. Returns HH:MM or null.
 */
function parseTime(str) {
  if (!str) return null;
  // 24h: HH:MM
  if (/^\d{1,2}:\d{2}$/.test(str)) {
    const [h, m] = str.split(':').map(Number);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
    return null;
  }
  // 12h: h:mm AM/PM
  const m12 = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (m12) {
    let [, h, min, period] = m12;
    h = parseInt(h, 10);
    min = parseInt(min, 10);
    if (period.toUpperCase() === 'PM' && h !== 12) h += 12;
    if (period.toUpperCase() === 'AM' && h === 12) h = 0;
    if (h >= 0 && h <= 23 && min >= 0 && min <= 59) {
      return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    }
  }
  return null;
}

/**
 * Parse a CSV string into validated workshop objects.
 * @param {string} csvText - Raw CSV content
 * @param {Array} coaches - Array of coach objects with {id, name}
 * @returns {{ valid: Array, errors: Array<{row: number, field: string, message: string}> }}
 */
export function parseWorkshopCSV(csvText, coaches) {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { valid: [], errors: [{ row: 0, field: 'file', message: 'File is empty' }] };
  }

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9-]/g, ''));
  const EXPECTED = ['title', 'type', 'coach', 'co-coach', 'date', 'start', 'end', 'markets', 'recurrence'];
  const colIndex = {};
  for (const col of EXPECTED) {
    const key = col.replace(/[^a-z0-9-]/g, '');
    const idx = header.indexOf(key);
    if (idx === -1 && col !== 'co-coach' && col !== 'markets' && col !== 'recurrence') {
      return { valid: [], errors: [{ row: 1, field: col, message: `Missing required column: "${col}"` }] };
    }
    colIndex[col] = idx;
  }

  // Build coach name→id lookup (case-insensitive, trimmed)
  const coachLookup = new Map();
  for (const c of coaches) {
    coachLookup.set(c.name.toLowerCase().trim(), c.id);
  }

  const valid = [];
  const errors = [];
  const now = Date.now();

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]);
    const rowNum = i + 1; // 1-indexed, accounting for header
    const rowErrors = [];

    const get = (col) => (colIndex[col] >= 0 ? (fields[colIndex[col]] || '').trim() : '');

    // Title
    const title = get('title');
    if (!title) rowErrors.push({ row: rowNum, field: 'title', message: 'Title is required' });

    // Type
    const rawType = get('type');
    const matchedType = TYPE_LOOKUP.get(rawType.toLowerCase());
    if (!rawType) {
      rowErrors.push({ row: rowNum, field: 'type', message: 'Type is required' });
    } else if (!matchedType) {
      rowErrors.push({ row: rowNum, field: 'type', message: `Unknown type: "${rawType}"` });
    }

    // Coach
    const rawCoach = get('coach');
    const coachId = coachLookup.get(rawCoach.toLowerCase().trim());
    if (!rawCoach) {
      rowErrors.push({ row: rowNum, field: 'coach', message: 'Coach is required' });
    } else if (!coachId) {
      rowErrors.push({ row: rowNum, field: 'coach', message: `Unknown coach: "${rawCoach}"` });
    }

    // Co-coach (optional)
    const rawCoCoach = get('co-coach');
    let coCoachId = null;
    if (rawCoCoach) {
      coCoachId = coachLookup.get(rawCoCoach.toLowerCase().trim());
      if (!coCoachId) {
        rowErrors.push({ row: rowNum, field: 'co-coach', message: `Unknown co-coach: "${rawCoCoach}"` });
      }
    }

    // Date
    const rawDate = get('date');
    const parsedDate = parseDate(rawDate);
    if (!rawDate) {
      rowErrors.push({ row: rowNum, field: 'date', message: 'Date is required' });
    } else if (!parsedDate) {
      rowErrors.push({ row: rowNum, field: 'date', message: `Invalid date: "${rawDate}". Use YYYY-MM-DD or MM/DD/YYYY` });
    }

    // Start time
    const rawStart = get('start');
    const parsedStart = parseTime(rawStart);
    if (!rawStart) {
      rowErrors.push({ row: rowNum, field: 'start', message: 'Start time is required' });
    } else if (!parsedStart) {
      rowErrors.push({ row: rowNum, field: 'start', message: `Invalid start time: "${rawStart}". Use HH:MM or h:mm AM/PM` });
    }

    // End time
    const rawEnd = get('end');
    const parsedEnd = parseTime(rawEnd);
    if (!rawEnd) {
      rowErrors.push({ row: rowNum, field: 'end', message: 'End time is required' });
    } else if (!parsedEnd) {
      rowErrors.push({ row: rowNum, field: 'end', message: `Invalid end time: "${rawEnd}". Use HH:MM or h:mm AM/PM` });
    }

    // Markets (optional, default US)
    const rawMarkets = get('markets');
    let markets = ['US'];
    if (rawMarkets) {
      markets = rawMarkets.split(',').map((m) => m.trim().toUpperCase()).filter(Boolean);
      const invalid = markets.filter((m) => !VALID_MARKETS.includes(m));
      if (invalid.length) {
        rowErrors.push({ row: rowNum, field: 'markets', message: `Invalid market(s): ${invalid.join(', ')}. Valid: ${VALID_MARKETS.join(', ')}` });
      }
    }

    // Recurrence (optional, default none)
    const recurrence = get('recurrence') || 'none';

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    } else {
      valid.push({
        id: `ws-${now}-${i}`,
        title,
        type: matchedType,
        status: 'Draft',
        coachId,
        coCoachId,
        startTime: `${parsedDate}T${parsedStart}:00`,
        endTime: `${parsedDate}T${parsedEnd}:00`,
        markets,
        recurrence,
        description: '',
        attendance: [],
      });
    }
  }

  if (lines.length === 1) {
    errors.push({ row: 0, field: 'file', message: 'No data rows found (only header)' });
  }

  return { valid, errors };
}

/**
 * Generate a CSV template string and trigger download.
 */
export function downloadCsvTemplate() {
  const header = 'title,type,coach,co-coach,date,start,end,markets,recurrence';
  const row1 = 'Morning Movement,Movement & Fitness,Keli Sullivan,,2026-04-07,9:00 AM,10:00 AM,US,none';
  const row2 = 'GLP-1 Check-in,GLP-1 & Diabetes,Deanna DeRosa,Keli Sullivan,2026-04-08,12:00 PM,12:30 PM,"US, CA",weekly';
  const csv = [header, row1, row2].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'workshop-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}
