import { useState } from 'react';
import { format, parseISO, setHours, setMinutes, addHours } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import AttendanceSparkline from './AttendanceSparkline';

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

      {/* Conflict warnings stub (PANEL-05) */}
      {conflicts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
            <ul className="text-sm text-red-700 space-y-1">
              {conflicts.map((conflict, i) => (
                <li key={i}>{conflict}</li>
              ))}
            </ul>
          </div>
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

      {/* 4. Coach */}
      <div>
        <label className={LABEL_CLASS}>Coach</label>
        <select
          value={draft.coachId}
          onChange={(e) => updateField('coachId', e.target.value)}
          className={INPUT_CLASS}
        >
          <option value="">-- Select coach --</option>
          {coaches.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* 5. Co-Coach */}
      <div>
        <label className={LABEL_CLASS}>Co-Coach</label>
        <select
          value={draft.coCoachId ?? ''}
          onChange={(e) =>
            updateField('coCoachId', e.target.value === '' ? null : e.target.value)
          }
          className={INPUT_CLASS}
        >
          <option value="">None</option>
          {coaches.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
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
