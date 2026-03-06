import { useState, useRef, useEffect } from 'react';
import { format, parseISO, setHours, setMinutes, addHours, getHours, getMinutes } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import AttendanceSparkline from './AttendanceSparkline';
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
  Cancelled: 'bg-slate-100 text-slate-600',
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
    } else {
      setWorkshops((prev) => prev.map((w) => (w.id === draft.id ? { ...draft } : w)));
    }
    onClose();
  };

  const handleRemove = () => {
    setWorkshops((prev) =>
      prev.map((w) => (w.id === draft.id ? { ...w, status: 'Cancelled' } : w))
    );
    onClose();
  };

  const handlePublish = () => {
    if (mode === 'create') {
      setWorkshops((prev) => [
        ...prev,
        { ...draft, id: 'ws-' + Date.now(), status: 'Published' },
      ]);
    } else {
      setWorkshops((prev) =>
        prev.map((w) => (w.id === draft.id ? { ...draft, status: 'Published' } : w))
      );
    }
    onClose();
  };

  const showSparkline =
    mode === 'view' && draft.status === 'Published' && draft.attendance;

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

      {/* Attendance sparkline (PANEL-04) */}
      {showSparkline && (
        <div className="flex items-center gap-3 py-2 px-3 bg-slate-50 rounded-lg">
          <span className="text-xs text-slate-500">Attendance (last 5 weeks)</span>
          <AttendanceSparkline data={draft.attendance} />
          <span className="text-sm font-medium text-ww-navy ml-auto">
            {draft.attendance[draft.attendance.length - 1]}
          </span>
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

      {/* 2. Date & Time */}
      <div>
        <label className={LABEL_CLASS}>Date & Time</label>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs text-slate-500 mb-1">Start</label>
            <input
              type="datetime-local"
              value={toDatetimeLocal(draft.startTime)}
              onChange={(e) => updateField('startTime', fromDatetimeLocal(e.target.value))}
              className={INPUT_CLASS}
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-slate-500 mb-1">End</label>
            <input
              type="datetime-local"
              value={toDatetimeLocal(draft.endTime)}
              onChange={(e) => updateField('endTime', fromDatetimeLocal(e.target.value))}
              className={INPUT_CLASS}
            />
          </div>
        </div>
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
              <input
                type="checkbox"
                checked={draft.markets.includes(market)}
                onChange={() => toggleMarket(market)}
                className="rounded border-border text-ww-blue focus:ring-ww-blue/30"
              />
              <span className="text-sm text-slate-700">{market}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-4 border-t border-border mt-6">
        <button
          onClick={handleSaveDraft}
          className="flex-1 px-4 py-2 text-sm font-medium bg-surface-2 text-ww-navy rounded-lg hover:bg-slate-200 transition-colors"
        >
          Save Draft
        </button>

        {mode === 'view' && (
          <button
            onClick={handleRemove}
            className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            Remove from Schedule
          </button>
        )}

        <button
          onClick={handlePublish}
          className="flex-1 px-4 py-2 text-sm font-medium bg-ww-blue text-white rounded-lg hover:bg-ww-navy transition-colors"
        >
          Publish
        </button>
      </div>
    </div>
  );
}
