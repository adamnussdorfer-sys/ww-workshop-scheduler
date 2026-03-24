import { useState, useRef, useEffect, useMemo } from 'react';
import {
  format, parseISO, setHours, setMinutes, addHours, getHours, getMinutes,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths,
  isSameMonth, isSameDay, isToday,
} from 'date-fns';
import { AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';
import Checkbox from '../ui/Checkbox';
import { getCoachAvailability } from '../../utils/coachAvailability';

const WORKSHOP_TYPES = [
  'Weekly Connection',
  'All In',
  'Special Event',
  'Coaching Corner',
  'Movement/Fitness',
];

const MARKETS = ['US', 'CA', 'UK', 'ANZ'];

const RECURRENCE_OPTIONS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'one-time', label: 'One-time' },
];

const STATUS_BADGE_STYLES = {
  Draft: 'bg-yellow-100 text-yellow-800',
  Published: 'bg-green-100 text-green-800',
};

// Convert { date, hour, minute } to ISO string
function buildISO({ date, hour, minute }) {
  const d = setMinutes(setHours(new Date(date), hour), minute);
  return d.toISOString();
}

// Same as buildISO but adds 1 hour
function buildEndISO({ date, hour, minute }) {
  const d = setMinutes(setHours(new Date(date), hour), minute);
  return addHours(d, 1).toISOString();
}

function initDraft(workshop, mode, slotContext) {
  if (mode === 'view' && workshop) {
    return { ...workshop };
  }
  // mode === 'create'
  return {
    title: '',
    type: 'Weekly Connection',
    status: 'Draft',
    coachId: '',
    coCoachId: null,
    description: '',
    recurrence: 'weekly',
    markets: ['US'],
    startTime: slotContext ? buildISO(slotContext) : '',
    endTime: slotContext ? buildEndISO(slotContext) : '',
  };
}

// Convert ISO string to datetime-local input value (yyyy-MM-dd'T'HH:mm)
function toDatetimeLocal(isoString) {
  if (!isoString) return '';
  try {
    return format(parseISO(isoString), "yyyy-MM-dd'T'HH:mm");
  } catch {
    return '';
  }
}

// Convert datetime-local value back to ISO string
function fromDatetimeLocal(value) {
  if (!value) return '';
  try {
    return new Date(value).toISOString();
  } catch {
    return '';
  }
}

// Generate 30-min time options from 6:00 AM to 10:00 PM
const TIME_OPTIONS = Array.from({ length: 33 }, (_, i) => {
  const totalMinutes = 6 * 60 + i * 30;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const period = h >= 12 ? 'pm' : 'am';
  const display = `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${String(m).padStart(2, '0')}${period}`;
  return { h, m, display };
});

function MiniCalendar({ selected, onSelect, onClose }) {
  const [viewMonth, setViewMonth] = useState(selected || new Date());
  const ref = useRef(null);

  useEffect(() => {
    function handleMouseDown(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [onClose]);

  const weeks = useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    const rows = [];
    let day = calStart;
    while (day <= calEnd) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        week.push(day);
        day = addDays(day, 1);
      }
      rows.push(week);
    }
    return rows;
  }, [viewMonth]);

  return (
    <div ref={ref} className="absolute left-0 top-full mt-1 bg-white border border-border rounded-lg shadow-lg z-20 p-3 w-64">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-slate-800">{format(viewMonth, 'MMMM yyyy')}</span>
        <div className="flex gap-1">
          <button type="button" onClick={() => setViewMonth(subMonths(viewMonth, 1))} className="p-0.5 hover:bg-slate-100 rounded">
            <ChevronLeft size={16} className="text-slate-500" />
          </button>
          <button type="button" onClick={() => setViewMonth(addMonths(viewMonth, 1))} className="p-0.5 hover:bg-slate-100 rounded">
            <ChevronRight size={16} className="text-slate-500" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-center text-[10px] text-slate-400 mb-1">
        {['S','M','T','W','T','F','S'].map((d, i) => <div key={i}>{d}</div>)}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 text-center">
          {week.map((day) => {
            const inMonth = isSameMonth(day, viewMonth);
            const sel = selected && isSameDay(day, selected);
            const today = isToday(day);
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => { onSelect(day); onClose(); }}
                className={`w-8 h-8 text-xs rounded-full flex items-center justify-center
                  ${sel ? 'bg-ww-blue text-white font-bold' : ''}
                  ${!sel && today ? 'text-ww-blue font-bold' : ''}
                  ${!sel && !today && inMonth ? 'text-slate-700 hover:bg-slate-100' : ''}
                  ${!inMonth ? 'text-slate-300' : ''}
                `}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function TimePicker({ value, onChange, label }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleMouseDown(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [open]);

  // Scroll to selected time when opened
  useEffect(() => {
    if (open && listRef.current) {
      const selected = listRef.current.querySelector('[data-selected="true"]');
      if (selected) selected.scrollIntoView({ block: 'center' });
    }
  }, [open]);

  // Find display text for current value
  const display = value
    ? TIME_OPTIONS.find((t) => t.h === value.h && t.m === value.m)?.display ?? `${value.h}:${String(value.m).padStart(2, '0')}`
    : label;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="px-3 py-2 border border-border rounded-lg text-sm bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-ww-blue/30 focus:border-ww-blue min-w-[90px] text-center"
      >
        {display}
      </button>
      {open && (
        <div ref={listRef} className="absolute left-0 top-full mt-1 bg-white border border-border rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto w-28">
          {TIME_OPTIONS.map((t) => {
            const sel = value && t.h === value.h && t.m === value.m;
            return (
              <div
                key={t.display}
                data-selected={sel ? 'true' : undefined}
                className={`px-3 py-1.5 text-sm cursor-pointer ${sel ? 'bg-ww-blue/10 text-ww-blue font-medium' : 'text-slate-700 hover:bg-slate-50'}`}
                onClick={() => { onChange(t); setOpen(false); }}
              >
                {t.display}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DateTimeRow({ draft, updateField }) {
  const [calOpen, setCalOpen] = useState(false);
  const dateRef = useRef(null);

  // Parse current date from draft.startTime
  const currentDate = draft.startTime ? parseISO(draft.startTime) : null;
  const startTime = draft.startTime
    ? { h: getHours(parseISO(draft.startTime)), m: getMinutes(parseISO(draft.startTime)) }
    : null;
  const endTime = draft.endTime
    ? { h: getHours(parseISO(draft.endTime)), m: getMinutes(parseISO(draft.endTime)) }
    : null;

  const handleDateSelect = (day) => {
    // Preserve existing times, update the date
    const sh = startTime?.h ?? 9;
    const sm = startTime?.m ?? 0;
    const eh = endTime?.h ?? 10;
    const em = endTime?.m ?? 0;
    updateField('startTime', setMinutes(setHours(new Date(day), sh), sm).toISOString());
    updateField('endTime', setMinutes(setHours(new Date(day), eh), em).toISOString());
  };

  const handleStartTimeChange = (t) => {
    const base = currentDate || new Date();
    updateField('startTime', setMinutes(setHours(new Date(base), t.h), t.m).toISOString());
    // Auto-advance end time if it would be before start
    if (endTime && (t.h > endTime.h || (t.h === endTime.h && t.m >= endTime.m))) {
      const newEnd = addHours(setMinutes(setHours(new Date(base), t.h), t.m), 1);
      updateField('endTime', newEnd.toISOString());
    }
  };

  const handleEndTimeChange = (t) => {
    const base = currentDate || new Date();
    updateField('endTime', setMinutes(setHours(new Date(base), t.h), t.m).toISOString());
  };

  return (
    <div className="flex items-center gap-2">
      {/* Date button */}
      <div className="relative" ref={dateRef}>
        <button
          type="button"
          onClick={() => setCalOpen((o) => !o)}
          className="px-3 py-2 border border-border rounded-lg text-sm bg-white hover:bg-slate-50 focus:outline-none whitespace-nowrap"
        >
          {currentDate ? format(currentDate, 'EEEE, MMMM d') : 'Select date'}
        </button>
        {calOpen && (
          <MiniCalendar selected={currentDate} onSelect={handleDateSelect} onClose={() => setCalOpen(false)} />
        )}
      </div>

      {/* Start time */}
      <TimePicker value={startTime} onChange={handleStartTimeChange} label="Start" />

      <span className="text-slate-400 text-sm">–</span>

      {/* End time */}
      <TimePicker value={endTime} onChange={handleEndTimeChange} label="End" />
    </div>
  );
}

const INPUT_CLASS =
  'w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ww-blue/30 focus:border-ww-blue';
const LABEL_CLASS = 'block text-sm font-medium text-slate-700 mb-1';
const DROPDOWN_TRIGGER_CLASS =
  'w-full px-3 py-2 border border-border rounded-lg text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-ww-blue/30 focus:border-ww-blue bg-white';
const DROPDOWN_LIST_CLASS =
  'absolute left-0 right-0 top-full mt-1 bg-white border border-border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto';

export default function WorkshopForm({
  workshop,
  coaches,
  mode,
  slotContext,
  onClose,
  conflicts = [],
}) {
  const { setWorkshops } = useApp();
  const [draft, setDraft] = useState(() => initDraft(workshop, mode, slotContext));

  // Custom dropdown open states
  const [coachDropdownOpen, setCoachDropdownOpen] = useState(false);
  const [coCoachDropdownOpen, setCoCoachDropdownOpen] = useState(false);

  // Refs for click-outside detection
  const coachDropdownRef = useRef(null);
  const coCoachDropdownRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    if (!coachDropdownOpen && !coCoachDropdownOpen) return;

    function handleMouseDown(e) {
      const clickedOutsideCoach =
        coachDropdownRef.current && !coachDropdownRef.current.contains(e.target);
      const clickedOutsideCoCoach =
        coCoachDropdownRef.current && !coCoachDropdownRef.current.contains(e.target);

      if (coachDropdownOpen && clickedOutsideCoach) {
        setCoachDropdownOpen(false);
      }
      if (coCoachDropdownOpen && clickedOutsideCoCoach) {
        setCoCoachDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [coachDropdownOpen, coCoachDropdownOpen]);

  const updateField = (field, value) =>
    setDraft((prev) => ({ ...prev, [field]: value }));

  const toggleMarket = (market) => {
    setDraft((prev) => ({
      ...prev,
      markets: prev.markets.includes(market)
        ? prev.markets.filter((m) => m !== market)
        : [...prev.markets, market],
    }));
  };

  // Compute workshop date/hour/minute from draft.startTime for availability checks
  let workshopDate = null;
  let workshopHour = 0;
  let workshopMinute = 0;
  if (draft.startTime) {
    try {
      const parsed = parseISO(draft.startTime);
      workshopDate = parsed;
      workshopHour = getHours(parsed);
      workshopMinute = getMinutes(parsed);
    } catch {
      // leave null
    }
  }

  // Action handlers
  const handleSaveDraft = () => {
    if (mode === 'create') {
      setWorkshops((prev) => [...prev, { ...draft, id: 'ws-' + Date.now() }]);
      toast('Workshop created \u2014 ' + draft.title);
    } else {
      setWorkshops((prev) => prev.map((w) => (w.id === draft.id ? { ...draft } : w)));
      toast('Changes saved');
    }
    onClose();
  };

  const handleRemove = () => {
    setWorkshops((prev) =>
      prev.map((w) => (w.id === draft.id ? { ...w, status: 'Cancelled' } : w))
    );
    toast('Workshop deleted');
    onClose();
  };

  const handlePublish = () => {
    if (mode === 'create') {
      setWorkshops((prev) => [
        ...prev,
        { ...draft, id: 'ws-' + Date.now(), status: 'Published' },
      ]);
      toast('Workshop published \u2014 ' + draft.title);
    } else {
      setWorkshops((prev) =>
        prev.map((w) => (w.id === draft.id ? { ...draft, status: 'Published' } : w))
      );
      toast('Workshop published');
    }
    onClose();
  };

  // Find selected coach name for trigger display
  const selectedCoach = coaches.find((c) => c.id === draft.coachId);
  const selectedCoCoach = coaches.find((c) => c.id === draft.coCoachId);

  return (
    <div className="space-y-4">
      {/* Status badge */}
      <div>
        <span
          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
            STATUS_BADGE_STYLES[draft.status] ?? STATUS_BADGE_STYLES.Draft
          }`}
        >
          {draft.status}
        </span>
      </div>

      {/* Conflict warnings (CONFLICT-01 through CONFLICT-04) */}
      {conflicts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <ul className="text-sm text-red-700 space-y-1">
            {[...conflicts]
              .sort((a, b) => (a.severity === 'red' ? -1 : 1) - (b.severity === 'red' ? -1 : 1))
              .map((conflict, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <AlertTriangle
                    size={14}
                    className={`flex-shrink-0 mt-0.5 ${conflict.severity === 'red' ? 'text-red-500' : 'text-orange-400'}`}
                  />
                  <span>{conflict.message}</span>
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* 1. Title */}
      <div>
        <label className={LABEL_CLASS}>Title</label>
        <input
          type="text"
          value={draft.title}
          onChange={(e) => updateField('title', e.target.value)}
          className={INPUT_CLASS}
          placeholder="Workshop title"
        />
      </div>

      {/* 2. Date & Time — Google Calendar style */}
      <div>
        <label className={LABEL_CLASS}>Date & Time</label>
        <DateTimeRow draft={draft} updateField={updateField} />
      </div>

      {/* 3. Timezone */}
      <div>
        <label className={LABEL_CLASS}>Timezone</label>
        <p className="text-sm text-slate-500 px-3 py-2 bg-slate-50 rounded-lg border border-border">
          Eastern Time (ET)
        </p>
      </div>

      {/* 4. Coach — custom availability-aware dropdown */}
      <div>
        <label className={LABEL_CLASS}>Coach</label>
        <div className="relative" ref={coachDropdownRef}>
          <button
            type="button"
            className={DROPDOWN_TRIGGER_CLASS}
            onClick={() => setCoachDropdownOpen((o) => !o)}
          >
            <span className={selectedCoach ? 'text-slate-900' : 'text-slate-400'}>
              {selectedCoach ? selectedCoach.name : 'Select coach...'}
            </span>
            <svg
              className="w-4 h-4 text-slate-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {coachDropdownOpen && (
            <div className={DROPDOWN_LIST_CLASS}>
              {coaches.map((coach) => {
                const avail = workshopDate
                  ? getCoachAvailability(coach, workshopDate, workshopHour, workshopMinute)
                  : { available: true, reason: null };

                return (
                  <div
                    key={coach.id}
                    className={`flex items-center gap-2 px-3 py-2 text-sm ${
                      avail.available
                        ? 'text-green-700 hover:bg-green-50 cursor-pointer'
                        : 'text-slate-400 cursor-not-allowed'
                    }`}
                    onClick={() => {
                      if (!avail.available) return;
                      updateField('coachId', coach.id);
                      setCoachDropdownOpen(false);
                    }}
                  >
                    {/* Availability indicator dot */}
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        avail.available ? 'bg-green-500' : 'bg-slate-300'
                      }`}
                    />
                    <span>
                      {coach.name}
                      {!avail.available && avail.reason && (
                        <span className="ml-1 text-xs text-slate-400">({avail.reason})</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 5. Co-Coach — custom availability-aware dropdown with None option */}
      <div>
        <label className={LABEL_CLASS}>Co-Coach</label>
        <div className="relative" ref={coCoachDropdownRef}>
          <button
            type="button"
            className={DROPDOWN_TRIGGER_CLASS}
            onClick={() => setCoCoachDropdownOpen((o) => !o)}
          >
            <span className={selectedCoCoach ? 'text-slate-900' : 'text-slate-400'}>
              {selectedCoCoach ? selectedCoCoach.name : 'None'}
            </span>
            <svg
              className="w-4 h-4 text-slate-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {coCoachDropdownOpen && (
            <div className={DROPDOWN_LIST_CLASS}>
              {/* None option */}
              <div
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 cursor-pointer"
                onClick={() => {
                  updateField('coCoachId', null);
                  setCoCoachDropdownOpen(false);
                }}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0 bg-transparent" />
                <span>None</span>
              </div>

              {/* Coach list — exclude currently selected primary coach */}
              {coaches
                .filter((c) => c.id !== draft.coachId)
                .map((coach) => {
                  const avail = workshopDate
                    ? getCoachAvailability(coach, workshopDate, workshopHour, workshopMinute)
                    : { available: true, reason: null };

                  return (
                    <div
                      key={coach.id}
                      className={`flex items-center gap-2 px-3 py-2 text-sm ${
                        avail.available
                          ? 'text-green-700 hover:bg-green-50 cursor-pointer'
                          : 'text-slate-400 cursor-not-allowed'
                      }`}
                      onClick={() => {
                        if (!avail.available) return;
                        updateField('coCoachId', coach.id);
                        setCoCoachDropdownOpen(false);
                      }}
                    >
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          avail.available ? 'bg-green-500' : 'bg-slate-300'
                        }`}
                      />
                      <span>
                        {coach.name}
                        {!avail.available && avail.reason && (
                          <span className="ml-1 text-xs text-slate-400">({avail.reason})</span>
                        )}
                      </span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* 6. Type */}
      <div>
        <label className={LABEL_CLASS}>Type</label>
        <select
          value={draft.type}
          onChange={(e) => updateField('type', e.target.value)}
          className={INPUT_CLASS}
        >
          {WORKSHOP_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* 7. Description */}
      <div>
        <label className={LABEL_CLASS}>Description</label>
        <textarea
          rows={3}
          value={draft.description}
          onChange={(e) => updateField('description', e.target.value)}
          className={INPUT_CLASS}
          placeholder="Workshop description"
        />
      </div>

      {/* 8. Recurrence */}
      <div>
        <label className={LABEL_CLASS}>Recurrence</label>
        <select
          value={draft.recurrence}
          onChange={(e) => updateField('recurrence', e.target.value)}
          className={INPUT_CLASS}
        >
          {RECURRENCE_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* 9. Markets */}
      <div>
        <label className={LABEL_CLASS}>Markets</label>
        <div className="flex gap-4 flex-wrap">
          {MARKETS.map((market) => (
            <label key={market} className="flex items-center gap-1.5 cursor-pointer">
              <Checkbox
                checked={draft.markets.includes(market)}
                onChange={() => toggleMarket(market)}
              />
              <span className="text-sm text-slate-700">{market}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="pt-4 border-t border-border mt-6 space-y-3">
        <div className="flex gap-3">
          <button
            onClick={handleSaveDraft}
            className="flex-1 px-4 py-2 text-sm font-medium bg-surface-2 text-ww-navy rounded-full hover:bg-slate-200 transition-colors"
          >
            Save Draft
          </button>
          <button
            onClick={handlePublish}
            className="flex-1 px-4 py-2 text-sm font-medium bg-ww-blue text-white rounded-full hover:bg-ww-navy transition-colors"
          >
            Publish
          </button>
        </div>

        {mode === 'view' && (
          <button
            onClick={handleRemove}
            className="w-full text-sm text-red-500 hover:text-red-700 transition-colors"
          >
            Remove from Schedule
          </button>
        )}
      </div>
    </div>
  );
}
