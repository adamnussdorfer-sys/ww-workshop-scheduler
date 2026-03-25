import { useState, useRef, useEffect, useMemo } from 'react';
import {
  format, parseISO, setHours, setMinutes, addHours, getHours, getMinutes,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths,
  isSameMonth, isSameDay, isToday,
} from 'date-fns';
import { AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { ChevronDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Checkbox from '../ui/Checkbox';
import Input, { Select } from '../ui/Input';
import MiniCalendar from '../ui/MiniCalendar';
import { getCoachAvailability } from '../../utils/coachAvailability';

const WORKSHOP_TYPES = [
  'Weekly Connection',
  'All In',
  'Special Event',
  'Coaching Corner',
  'Movement/Fitness',
];

const MARKETS = ['US', 'CA', 'UK', 'ANZ'];

const TIMEZONE_OPTIONS = [
  { value: 'ET', label: 'Eastern Time (ET)' },
  { value: 'CT', label: 'Central Time (CT)' },
  { value: 'MT', label: 'Mountain Time (MT)' },
  { value: 'PT', label: 'Pacific Time (PT)' },
  { value: 'GMT', label: 'Greenwich Mean Time (GMT)' },
  { value: 'AEST', label: 'Australian Eastern (AEST)' },
];

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
    timezone: 'ET',
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

  useEffect(() => {
    if (open && listRef.current) {
      const selected = listRef.current.querySelector('[data-selected="true"]');
      if (selected) selected.scrollIntoView({ block: 'center' });
    }
  }, [open]);

  const display = value
    ? TIME_OPTIONS.find((t) => t.h === value.h && t.m === value.m)?.display ?? `${value.h}:${String(value.m).padStart(2, '0')}`
    : label;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-[14px] font-semibold text-[#031AA1] cursor-pointer hover:opacity-70 transition-opacity"
      >
        {display}
      </button>
      {open && (
        <div ref={listRef} className="absolute left-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-lg z-30 max-h-48 overflow-y-auto w-28 py-1">
          {TIME_OPTIONS.map((t) => {
            const sel = value && t.h === value.h && t.m === value.m;
            return (
              <div
                key={t.display}
                data-selected={sel ? 'true' : undefined}
                className={`px-3 py-1.5 text-sm cursor-pointer ${sel ? 'bg-ww-blue/10 text-ww-blue font-medium' : 'text-[#031AA1] hover:bg-slate-50'}`}
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

  const hasDate = !!currentDate;

  return (
    <div className={`w-full rounded-2xl border px-4 h-[62px] flex flex-col justify-center bg-white transition-all ${
      hasDate ? 'border-ww-blue' : 'border-[#84ABFF]'
    }`}>
      {hasDate && <span className="block text-[12px] font-normal text-[#031AA1]">Date & Time</span>}
      <div className="flex items-center gap-2">
        {/* Date button */}
        <div className="relative" ref={dateRef}>
          <button
            type="button"
            onClick={() => setCalOpen((o) => !o)}
            className="text-[14px] font-semibold text-[#031AA1] cursor-pointer hover:opacity-70 transition-opacity whitespace-nowrap"
          >
            {currentDate ? format(currentDate, 'EEE, MMM d') : 'Date & Time'}
          </button>
          {calOpen && (
            <MiniCalendar selected={currentDate} onSelect={handleDateSelect} onClose={() => setCalOpen(false)} />
          )}
        </div>

        {hasDate && (
          <>
            <span className="text-[#031AA1]/40 text-sm">|</span>
            <TimePicker value={startTime} onChange={handleStartTimeChange} label="Start" />
            <span className="text-[#031AA1]/40 text-sm">–</span>
            <TimePicker value={endTime} onChange={handleEndTimeChange} label="End" />
          </>
        )}
      </div>
    </div>
  );
}

const DROPDOWN_TRIGGER_BASE = 'w-full h-[62px] px-4 flex items-center justify-between cursor-pointer rounded-2xl border bg-white transition-all';
const DROPDOWN_MENU_CLASS = 'absolute left-0 top-full mt-1 w-full bg-white border border-slate-200 rounded-2xl shadow-lg z-30 py-1 max-h-64 overflow-y-auto';

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
      <Input
        label="Title"
        type="text"
        value={draft.title}
        onChange={(e) => updateField('title', e.target.value)}
        placeholder="Workshop title"
      />

      {/* 2. Date & Time */}
      <DateTimeRow draft={draft} updateField={updateField} />

      {/* 3. Timezone */}
      <Select
        label="Timezone"
        value={draft.timezone}
        onChange={(v) => updateField('timezone', v)}
        options={TIMEZONE_OPTIONS}
      />

      {/* 4. Coach — custom availability-aware dropdown */}
      <div ref={coachDropdownRef} className="relative w-full">
        <button
          type="button"
          onClick={() => setCoachDropdownOpen((o) => !o)}
          className={`${DROPDOWN_TRIGGER_BASE} ${
            coachDropdownOpen ? 'border-transparent shadow-[0_2px_2px_0_rgba(7,5,23,0.04)]' : selectedCoach ? 'border-ww-blue' : 'border-[#84ABFF]'
          }`}
        >
          <div className="flex flex-col items-start">
            {selectedCoach && <span className="block text-[12px] font-normal text-[#031AA1]">Coach</span>}
            <span className={`text-[14px] font-semibold ${selectedCoach ? 'text-[#031AA1]' : 'text-[#031AA1]'}`}>
              {selectedCoach ? selectedCoach.name : 'Coach'}
            </span>
          </div>
          <ChevronDown size={16} className={`text-[#031AA1] transition-transform ${coachDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {coachDropdownOpen && (
          <div className={DROPDOWN_MENU_CLASS}>
            {coaches.map((coach) => {
              const avail = workshopDate
                ? getCoachAvailability(coach, workshopDate, workshopHour, workshopMinute)
                : { available: true, reason: null };

              return (
                <button
                  key={coach.id}
                  type="button"
                  className={`w-full text-left px-4 py-2.5 text-[14px] font-semibold flex items-center gap-2 ${
                    avail.available
                      ? 'text-[#031AA1] hover:bg-slate-50 hover:text-ww-blue cursor-pointer'
                      : 'text-slate-400 cursor-not-allowed'
                  }`}
                  onClick={() => {
                    if (!avail.available) return;
                    updateField('coachId', coach.id);
                    setCoachDropdownOpen(false);
                  }}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${avail.available ? 'bg-green-500' : 'bg-slate-300'}`} />
                  <span>
                    {coach.name}
                    {!avail.available && avail.reason && (
                      <span className="ml-1 text-xs text-slate-400">({avail.reason})</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Co-Coach — custom availability-aware dropdown with None option */}
      <div ref={coCoachDropdownRef} className="relative w-full">
        <button
          type="button"
          onClick={() => setCoCoachDropdownOpen((o) => !o)}
          className={`${DROPDOWN_TRIGGER_BASE} ${
            coCoachDropdownOpen ? 'border-transparent shadow-[0_2px_2px_0_rgba(7,5,23,0.04)]' : selectedCoCoach ? 'border-ww-blue' : 'border-[#84ABFF]'
          }`}
        >
          <div className="flex flex-col items-start">
            {selectedCoCoach && <span className="block text-[12px] font-normal text-[#031AA1]">Co-Coach</span>}
            <span className={`text-[14px] font-semibold ${selectedCoCoach ? 'text-[#031AA1]' : 'text-[#031AA1]'}`}>
              {selectedCoCoach ? selectedCoCoach.name : 'Co-Coach'}
            </span>
          </div>
          <ChevronDown size={16} className={`text-[#031AA1] transition-transform ${coCoachDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {coCoachDropdownOpen && (
          <div className={DROPDOWN_MENU_CLASS}>
            {/* None option */}
            <button
              type="button"
              className="w-full text-left px-4 py-2.5 text-[14px] font-semibold text-[#031AA1] hover:bg-slate-50 hover:text-ww-blue cursor-pointer"
              onClick={() => {
                updateField('coCoachId', null);
                setCoCoachDropdownOpen(false);
              }}
            >
              None
            </button>

            {/* Coach list — exclude currently selected primary coach */}
            {coaches
              .filter((c) => c.id !== draft.coachId)
              .map((coach) => {
                const avail = workshopDate
                  ? getCoachAvailability(coach, workshopDate, workshopHour, workshopMinute)
                  : { available: true, reason: null };

                return (
                  <button
                    key={coach.id}
                    type="button"
                    className={`w-full text-left px-4 py-2.5 text-[14px] font-semibold flex items-center gap-2 ${
                      avail.available
                        ? 'text-[#031AA1] hover:bg-slate-50 hover:text-ww-blue cursor-pointer'
                        : 'text-slate-400 cursor-not-allowed'
                    }`}
                    onClick={() => {
                      if (!avail.available) return;
                      updateField('coCoachId', coach.id);
                      setCoCoachDropdownOpen(false);
                    }}
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${avail.available ? 'bg-green-500' : 'bg-slate-300'}`} />
                    <span>
                      {coach.name}
                      {!avail.available && avail.reason && (
                        <span className="ml-1 text-xs text-slate-400">({avail.reason})</span>
                      )}
                    </span>
                  </button>
                );
              })}
          </div>
        )}
      </div>

      {/* 6. Type */}
      <Select
        label="Type"
        value={draft.type}
        onChange={(v) => updateField('type', v)}
        options={WORKSHOP_TYPES.map((t) => ({ value: t, label: t }))}
      />

      {/* 7. Description */}
      <Input
        label="Description"
        multiline
        rows={3}
        value={draft.description}
        onChange={(e) => updateField('description', e.target.value)}
        placeholder="Workshop description"
      />

      {/* 8. Recurrence */}
      <Select
        label="Recurrence"
        value={draft.recurrence}
        onChange={(v) => updateField('recurrence', v)}
        options={RECURRENCE_OPTIONS}
      />

      {/* 9. Markets */}
      <div>
        <label className="block text-xs text-slate-500 mb-1.5">Markets</label>
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
            className="flex-1 px-4 py-2 text-sm font-medium bg-white text-ww-blue border-[1.5px] border-ww-blue rounded-full hover:bg-ww-blue/5 transition-colors"
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

      </div>

      {mode === 'view' && (
        <div className="pt-6 mt-2">
          <button
            onClick={handleRemove}
            className="text-sm text-red-500 hover:text-red-700 transition-colors"
          >
            Delete workshop
          </button>
        </div>
      )}
    </div>
  );
}
