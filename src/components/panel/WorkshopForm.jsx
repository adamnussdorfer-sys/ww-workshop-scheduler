import { useState, useRef, useEffect, useMemo } from 'react';
import {
  format, parseISO, setHours, setMinutes, addHours, getHours, getMinutes,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths,
  isSameMonth, isSameDay, isToday, getDay, addWeeks, differenceInMinutes, addMinutes,
} from 'date-fns';
import { AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { ChevronDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Checkbox from '../ui/Checkbox';
import Input, { Select } from '../ui/Input';
import MiniCalendar from '../ui/MiniCalendar';
import { getCoachAvailability } from '../../utils/coachAvailability';
import Tooltip from '../ui/Tooltip';
import { getHoursInTz, getMinutesInTz, createDateInTz, getTzAbbr } from '../../utils/timezone';

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

const MARKETS = ['US', 'CA', 'UK', 'ANZ'];

const TIMEZONE_OPTIONS = [
  { value: 'ET', label: 'Eastern Time (ET)' },
  { value: 'CT', label: 'Central Time (CT)' },
  { value: 'MT', label: 'Mountain Time (MT)' },
  { value: 'PT', label: 'Pacific Time (PT)' },
  { value: 'GMT', label: 'Greenwich Mean Time (GMT)' },
  { value: 'AEST', label: 'Australian Eastern (AEST)' },
];

const RECURRING_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const RECURRING_DAY_LABELS = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };
const DAY_INDICES = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
const INDEX_TO_DAY = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function generateRecurringInstances(baseDraft) {
  const instances = [];
  const baseDate = parseISO(baseDraft.startTime);
  const baseDayIndex = getDay(baseDate);
  const duration = differenceInMinutes(parseISO(baseDraft.endTime), baseDate);
  const endType = baseDraft.recurrenceEndType || 'never';
  const maxOccurrences = endType === 'after' ? baseDraft.recurrenceOccurrences : 52; // cap "never" at 52 weeks
  const interval = baseDraft.recurringWeeks || 1;

  let count = 1; // the original counts as 1
  for (let week = 0; count < maxOccurrences; week += interval) {
    for (const day of baseDraft.recurringDays) {
      if (count >= maxOccurrences) break;
      const dayIndex = DAY_INDICES[day];
      if (week === 0 && dayIndex === baseDayIndex) continue; // skip the original

      const dayOffset = dayIndex - baseDayIndex;
      const targetDate = addWeeks(addDays(baseDate, dayOffset), week);
      const newStart = targetDate;
      const newEnd = addMinutes(newStart, duration);

      instances.push({
        ...baseDraft,
        id: `ws-${Date.now()}-${instances.length}`,
        startTime: newStart.toISOString(),
        endTime: newEnd.toISOString(),
        recurring: false,
        recurringDays: [],
        recurringWeeks: 1,
        recurrence: 'none',
      });
      count++;
    }
  }
  return instances;
}

const STATUS_BADGE_STYLES = {
  Draft: 'bg-yellow-100 text-yellow-800',
  Published: 'bg-green-100 text-green-800',
};

// Convert { date, hour, minute } to ISO string in user's timezone
function buildISO({ date, hour, minute }, tz) {
  return createDateInTz(new Date(date), hour, minute, tz).toISOString();
}

// Same as buildISO but adds 1 hour
function buildEndISO({ date, hour, minute }, tz) {
  return addHours(createDateInTz(new Date(date), hour, minute, tz), 1).toISOString();
}

function getDayFromSlot(slotContext) {
  if (!slotContext) return [];
  const d = setMinutes(setHours(new Date(slotContext.date), slotContext.hour), slotContext.minute);
  return [INDEX_TO_DAY[getDay(d)]];
}

function defaultSlot(tz) {
  const now = new Date();
  const h = getHoursInTz(now, tz);
  const m = getMinutesInTz(now, tz);
  // Round up to next 30-min mark
  const roundedM = m < 30 ? 30 : 0;
  const roundedH = m < 30 ? h : h + 1;
  return { date: now, hour: roundedH, minute: roundedM };
}

function initDraft(workshop, mode, slotContext, tz) {
  if (mode === 'view' && workshop) {
    return {
      recurring: false,
      recurringDays: [],
      recurringWeeks: 1,
      recurrenceEndType: 'never',
      recurrenceOccurrences: 13,
      timezone: 'ET',
      ...workshop,
    };
  }
  // mode === 'create'
  const slot = slotContext || defaultSlot(tz);
  return {
    title: '',
    type: 'Weekly Workshop',
    status: 'Draft',
    coachId: '',
    coCoachId: null,
    description: '',
    recurrence: 'none',
    recurring: false,
    recurringDays: getDayFromSlot(slot),
    recurringWeeks: 1,
    recurrenceEndType: 'never',
    recurrenceOccurrences: 13,
    timezone: 'ET',
    markets: ['US'],
    zoomType: 'meeting',
    startTime: buildISO(slot, tz),
    endTime: buildEndISO(slot, tz),
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

// Generate 30-min time options from 2:00 AM to 10:00 PM
const TIME_OPTIONS = Array.from({ length: 41 }, (_, i) => {
  const totalMinutes = 2 * 60 + i * 30;
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
        className="text-[14px] font-semibold text-[#031373] cursor-pointer hover:opacity-70 transition-opacity"
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
                className={`px-3 py-1.5 text-sm cursor-pointer ${sel ? 'bg-ww-blue/10 text-ww-blue font-medium' : 'text-[#031373] hover:bg-slate-50'}`}
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
  const { userTimezone } = useApp();
  const [calOpen, setCalOpen] = useState(false);
  const [tzOpen, setTzOpen] = useState(false);
  const dateRef = useRef(null);
  const tzRef = useRef(null);

  useEffect(() => {
    if (!tzOpen) return;
    function handleMouseDown(e) {
      if (tzRef.current && !tzRef.current.contains(e.target)) setTzOpen(false);
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [tzOpen]);

  // Parse current date from draft.startTime
  const currentDate = draft.startTime ? parseISO(draft.startTime) : null;
  const startTime = draft.startTime
    ? { h: getHoursInTz(parseISO(draft.startTime), userTimezone), m: getMinutesInTz(parseISO(draft.startTime), userTimezone) }
    : null;
  const endTime = draft.endTime
    ? { h: getHoursInTz(parseISO(draft.endTime), userTimezone), m: getMinutesInTz(parseISO(draft.endTime), userTimezone) }
    : null;

  const handleDateSelect = (day) => {
    // Preserve existing times, update the date
    const sh = startTime?.h ?? 9;
    const sm = startTime?.m ?? 0;
    const eh = endTime?.h ?? 10;
    const em = endTime?.m ?? 0;
    updateField('startTime', createDateInTz(new Date(day), sh, sm, userTimezone).toISOString());
    updateField('endTime', createDateInTz(new Date(day), eh, em, userTimezone).toISOString());
  };

  const handleStartTimeChange = (t) => {
    const base = currentDate || new Date();
    updateField('startTime', createDateInTz(new Date(base), t.h, t.m, userTimezone).toISOString());
    // Auto-advance end time if it would be before start
    if (endTime && (t.h > endTime.h || (t.h === endTime.h && t.m >= endTime.m))) {
      const newEnd = addHours(createDateInTz(new Date(base), t.h, t.m, userTimezone), 1);
      updateField('endTime', newEnd.toISOString());
    }
  };

  const handleEndTimeChange = (t) => {
    const base = currentDate || new Date();
    updateField('endTime', createDateInTz(new Date(base), t.h, t.m, userTimezone).toISOString());
  };

  const hasDate = !!currentDate;

  return (
    <div className={`w-full rounded-2xl border px-4 h-[59px] flex flex-col justify-center bg-white transition-all ${
      hasDate ? 'border-[#031373]' : 'border-[#84ABFF]'
    }`}>
      {hasDate && <span className="block text-[12px] font-normal text-[#031373]">Date & Time</span>}
      <div className="flex items-center gap-2">
        {/* Date button */}
        <div className="relative" ref={dateRef}>
          <button
            type="button"
            onClick={() => setCalOpen((o) => !o)}
            className="text-[14px] font-semibold text-[#031373] cursor-pointer hover:opacity-70 transition-opacity whitespace-nowrap"
          >
            {currentDate ? format(currentDate, 'EEE, MMM d') : 'Date & Time'}
          </button>
          {calOpen && (
            <MiniCalendar selected={currentDate} onSelect={handleDateSelect} onClose={() => setCalOpen(false)} />
          )}
        </div>

        {hasDate && (
          <>
            <span className="text-[#031373]/40 text-sm">|</span>
            <TimePicker value={startTime} onChange={handleStartTimeChange} label="Start" />
            <span className="text-[#031373]/40 text-sm">–</span>
            <TimePicker value={endTime} onChange={handleEndTimeChange} label="End" />
            <span className="text-[#031373]/40 text-sm">|</span>
            <div className="relative" ref={tzRef}>
              <button
                type="button"
                onClick={() => setTzOpen((o) => !o)}
                className="text-[13px] font-semibold text-[#031373] cursor-pointer hover:opacity-70 transition-opacity whitespace-nowrap"
              >
                {draft.timezone}
              </button>
              {tzOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-lg z-30 py-1 min-w-[180px]">
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <button
                      key={tz.value}
                      type="button"
                      onClick={() => { updateField('timezone', tz.value); setTzOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-[13px] font-semibold cursor-pointer transition-colors ${
                        draft.timezone === tz.value ? 'text-ww-blue bg-ww-blue/5' : 'text-[#031373] hover:bg-slate-50 hover:text-ww-blue'
                      }`}
                    >
                      {tz.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function getRecurrencePresets(startTime) {
  if (!startTime) return [{ value: 'none', label: 'Does not repeat' }, { value: 'custom', label: 'Custom...' }];
  const date = parseISO(startTime);
  const dayName = format(date, 'EEEE');
  return [
    { value: 'none', label: 'Does not repeat' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: `Weekly on ${dayName}` },
    { value: 'weekdays', label: 'Every weekday (Mon–Fri)' },
    { value: 'custom', label: 'Custom...' },
  ];
}

function recurrenceLabel(draft) {
  if (!draft.recurring) return 'Does not repeat';
  const { recurringDays, recurringWeeks, recurrenceEndType, recurrenceOccurrences } = draft;
  const days = recurringDays.map((d) => RECURRING_DAY_LABELS[d]).join(', ');
  const endLabel = recurrenceEndType === 'after' ? `, ${recurrenceOccurrences}x` : recurrenceEndType === 'never' ? '' : '';
  return `Weekly on ${days}${recurringWeeks > 1 ? ` (every ${recurringWeeks} wks)` : ''}${endLabel}`;
}

function CustomRecurrenceModal({ draft, onSave, onClose }) {
  const [localDays, setLocalDays] = useState(draft.recurringDays.length > 0 ? [...draft.recurringDays] : (draft.startTime ? [INDEX_TO_DAY[getDay(parseISO(draft.startTime))]] : ['monday']));
  const [localWeeks, setLocalWeeks] = useState(draft.recurringWeeks || 1);
  const [endType, setEndType] = useState(draft.recurrenceEndType || 'after');
  const [occurrences, setOccurrences] = useState(draft.recurrenceOccurrences || 13);

  const toggleDay = (day) => {
    setLocalDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
          <h2 className="text-lg font-semibold text-ww-navy mb-5">Custom recurrence</h2>

          {/* Repeat every N weeks */}
          <div className="mb-5">
            <p className="text-sm text-slate-600 mb-2">Repeat every</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={52}
                value={localWeeks}
                onChange={(e) => setLocalWeeks(Math.max(1, Math.min(52, parseInt(e.target.value) || 1)))}
                className="w-16 h-10 text-center text-sm font-semibold text-[#031373] border border-[#84ABFF] rounded-xl outline-none focus:border-ww-blue transition-colors"
              />
              <span className="text-sm text-slate-600">{localWeeks === 1 ? 'week' : 'weeks'}</span>
            </div>
          </div>

          {/* Repeat on days */}
          <div className="mb-5">
            <p className="text-sm text-slate-600 mb-2">Repeat on</p>
            <div className="flex gap-1.5">
              {RECURRING_DAYS.map((day) => {
                const selected = localDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`w-9 h-9 text-xs font-semibold rounded-full border transition-colors cursor-pointer flex items-center justify-center ${
                      selected
                        ? 'bg-ww-blue text-white border-ww-blue'
                        : 'bg-white text-slate-600 border-border hover:border-slate-400'
                    }`}
                  >
                    {RECURRING_DAY_LABELS[day].charAt(0)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ends */}
          <div className="mb-6">
            <p className="text-sm text-slate-600 mb-2">Ends</p>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="endType" checked={endType === 'never'} onChange={() => setEndType('never')} className="accent-[#031373] w-4 h-4" />
                <span className="text-sm text-ww-navy">Never</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="endType" checked={endType === 'after'} onChange={() => setEndType('after')} className="accent-[#031373] w-4 h-4" />
                <span className="text-sm text-ww-navy">After</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={occurrences}
                  onChange={(e) => setOccurrences(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                  disabled={endType !== 'after'}
                  className="w-14 h-9 text-center text-sm font-semibold text-[#031373] border border-[#84ABFF] rounded-xl outline-none focus:border-ww-blue transition-colors disabled:opacity-40"
                />
                <span className="text-sm text-slate-600">occurrences</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSave({
                recurringDays: localDays,
                recurringWeeks: localWeeks,
                recurrenceEndType: endType,
                recurrenceOccurrences: occurrences,
              })}
              disabled={localDays.length === 0}
              className={`px-5 py-2 text-sm font-medium rounded-full transition-colors ${
                localDays.length > 0
                  ? 'bg-ww-blue text-white hover:bg-[#1a3ad8]'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function RecurrenceField({ draft, setDraft }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleMouseDown(e) {
      if (ref.current && !ref.current.contains(e.target)) setDropdownOpen(false);
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [dropdownOpen]);

  const presets = getRecurrencePresets(draft.startTime);
  const currentDay = draft.startTime ? INDEX_TO_DAY[getDay(parseISO(draft.startTime))] : 'monday';

  const handlePreset = (value) => {
    setDropdownOpen(false);
    if (value === 'none') {
      setDraft((prev) => ({ ...prev, recurring: false, recurringDays: [], recurringWeeks: 1, recurrenceEndType: 'never', recurrenceOccurrences: 13 }));
    } else if (value === 'daily') {
      setDraft((prev) => ({ ...prev, recurring: true, recurringDays: [...RECURRING_DAYS], recurringWeeks: 1, recurrenceEndType: 'never', recurrenceOccurrences: 13 }));
    } else if (value === 'weekly') {
      setDraft((prev) => ({ ...prev, recurring: true, recurringDays: [currentDay], recurringWeeks: 1, recurrenceEndType: 'never', recurrenceOccurrences: 13 }));
    } else if (value === 'weekdays') {
      setDraft((prev) => ({ ...prev, recurring: true, recurringDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], recurringWeeks: 1, recurrenceEndType: 'never', recurrenceOccurrences: 13 }));
    } else if (value === 'custom') {
      setCustomModalOpen(true);
    }
  };

  const handleCustomSave = (settings) => {
    setDraft((prev) => ({
      ...prev,
      recurring: true,
      ...settings,
    }));
    setCustomModalOpen(false);
  };

  const displayLabel = draft.recurring ? recurrenceLabel(draft) : 'Does not repeat';

  return (
    <>
      <div ref={ref} className="relative w-full">
        <button
          type="button"
          onClick={() => setDropdownOpen((o) => !o)}
          className={`w-full h-[59px] px-4 flex items-center justify-between cursor-pointer rounded-2xl border bg-white transition-all ${
            dropdownOpen ? 'border-transparent shadow-[0_2px_2px_0_rgba(7,5,23,0.04)]' : draft.recurring ? 'border-[#031373]' : 'border-[#84ABFF]'
          }`}
        >
          <div className="flex flex-col items-start">
            {draft.recurring && <span className="block text-[12px] font-normal text-[#031373]">Recurrence</span>}
            <Tooltip content={draft.recurring ? displayLabel : null}>
              <span className="text-[14px] font-semibold text-[#031373] truncate max-w-[280px]">
                {draft.recurring ? displayLabel : 'Does not repeat'}
              </span>
            </Tooltip>
          </div>
          <ChevronDown size={16} className={`text-[#031373] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {dropdownOpen && (
          <div className="absolute left-0 top-full mt-1 w-full bg-white border border-slate-200 rounded-2xl shadow-lg z-30 py-1 max-h-64 overflow-y-auto">
            {presets.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => handlePreset(p.value)}
                className="w-full text-left px-4 py-2.5 text-[14px] font-semibold text-[#031373] hover:bg-slate-50 hover:text-ww-blue cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {customModalOpen && (
        <CustomRecurrenceModal
          draft={draft}
          onSave={handleCustomSave}
          onClose={() => setCustomModalOpen(false)}
        />
      )}
    </>
  );
}

const DROPDOWN_TRIGGER_BASE = 'w-full h-[59px] px-4 flex items-center justify-between cursor-pointer rounded-2xl border bg-white transition-all';
const DROPDOWN_MENU_CLASS = 'absolute left-0 top-full mt-1 w-full bg-white border border-slate-200 rounded-2xl shadow-lg z-30 py-1 max-h-64 overflow-y-auto';

export default function WorkshopForm({
  workshop,
  coaches,
  mode,
  slotContext,
  onClose,
  conflicts = [],
  onNavigate,
}) {
  const { setWorkshops, highlightWorkshops, userTimezone } = useApp();
  const [draft, setDraft] = useState(() => initDraft(workshop, mode, slotContext, userTimezone));

  // Custom dropdown open states
  const [coachDropdownOpen, setCoachDropdownOpen] = useState(false);
  const [coCoachDropdownOpen, setCoCoachDropdownOpen] = useState(false);
  const [showCoCoach, setShowCoCoach] = useState(() => !!draft.coCoachId);

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

  // Parse workshop start time for availability checks
  let workshopDate = null;
  if (draft.startTime) {
    try {
      workshopDate = parseISO(draft.startTime);
    } catch {
      // leave null
    }
  }

  // Action handlers
  const handleSaveDraft = () => {
    if (mode === 'create') {
      const base = { ...draft, id: 'ws-' + Date.now() };
      const extras = draft.recurring && draft.recurringDays.length > 0
        ? generateRecurringInstances(base)
        : [];
      setWorkshops((prev) => [...prev, base, ...extras]);
      highlightWorkshops([base.id, ...extras.map((e) => e.id)]);
      const total = 1 + extras.length;
      toast(total > 1 ? `${total} workshops created` : 'Workshop created \u2014 ' + draft.title);
    } else {
      const updated = { ...draft };
      const extras = draft.recurring && draft.recurringDays.length > 0
        ? generateRecurringInstances(updated)
        : [];
      setWorkshops((prev) => [...prev.map((w) => (w.id === draft.id ? updated : w)), ...extras]);
      highlightWorkshops([updated.id, ...extras.map((e) => e.id)]);
      const total = 1 + extras.length;
      toast(total > 1 ? `${total} workshops saved` : 'Changes saved');
    }
    if (draft.startTime && onNavigate) onNavigate(parseISO(draft.startTime));
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
      const base = { ...draft, id: 'ws-' + Date.now(), status: 'Published' };
      const extras = draft.recurring && draft.recurringDays.length > 0
        ? generateRecurringInstances(base).map((w) => ({ ...w, status: 'Published' }))
        : [];
      setWorkshops((prev) => [...prev, base, ...extras]);
      highlightWorkshops([base.id, ...extras.map((e) => e.id)]);
      const total = 1 + extras.length;
      toast(total > 1 ? `${total} workshops published` : 'Workshop published \u2014 ' + draft.title);
    } else {
      const updated = { ...draft, status: 'Published' };
      const extras = draft.recurring && draft.recurringDays.length > 0
        ? generateRecurringInstances(updated).map((w) => ({ ...w, status: 'Published' }))
        : [];
      setWorkshops((prev) => [...prev.map((w) => (w.id === draft.id ? updated : w)), ...extras]);
      highlightWorkshops([updated.id, ...extras.map((e) => e.id)]);
      const total = 1 + extras.length;
      toast(total > 1 ? `${total} workshops published` : 'Workshop published');
    }
    if (draft.startTime && onNavigate) onNavigate(parseISO(draft.startTime));
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

      {/* 2. Type */}
      <Select
        label="Type"
        value={draft.type}
        onChange={(v) => updateField('type', v)}
        options={WORKSHOP_TYPES.map((t) => ({ value: t, label: t }))}
      />

      {/* 3. Date & Time */}
      <DateTimeRow draft={draft} updateField={updateField} />

      {/* 3. Recurrence toggle + dropdown */}
      <label className="flex items-center gap-2 cursor-pointer">
        <Checkbox
          checked={draft.recurring}
          onChange={() => {
            if (draft.recurring) {
              setDraft((prev) => ({ ...prev, recurring: false, recurringDays: [], recurringWeeks: 1, recurrenceEndType: 'never', recurrenceOccurrences: 13 }));
            } else {
              setDraft((prev) => ({ ...prev, recurring: true }));
            }
          }}
        />
        <span className="text-sm text-slate-700">Make recurring</span>
      </label>
      {draft.recurring && <RecurrenceField draft={draft} setDraft={setDraft} />}

      {/* 4. Coach — custom availability-aware dropdown */}
      <div ref={coachDropdownRef} className="relative w-full">
        <button
          type="button"
          onClick={() => setCoachDropdownOpen((o) => !o)}
          className={`${DROPDOWN_TRIGGER_BASE} ${
            coachDropdownOpen ? 'border-transparent shadow-[0_2px_2px_0_rgba(7,5,23,0.04)]' : selectedCoach ? 'border-[#031373]' : 'border-[#84ABFF]'
          }`}
        >
          <div className="flex flex-col items-start">
            {selectedCoach && <span className="block text-[12px] font-normal text-[#031373]">Coach</span>}
            <span className={`text-[14px] font-semibold ${selectedCoach ? 'text-[#031373]' : 'text-[#031373]'}`}>
              {selectedCoach ? selectedCoach.name : 'Coach'}
            </span>
          </div>
          <ChevronDown size={16} className={`text-[#031373] transition-transform ${coachDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {coachDropdownOpen && (
          <div className={DROPDOWN_MENU_CLASS}>
            {coaches.map((coach) => {
              const avail = workshopDate
                ? getCoachAvailability(coach, workshopDate)
                : { available: true, reason: null };

              return (
                <button
                  key={coach.id}
                  type="button"
                  className={`w-full text-left px-4 py-2.5 text-[14px] font-semibold flex items-center gap-2 ${
                    avail.available
                      ? 'text-[#031373] hover:bg-slate-50 hover:text-ww-blue cursor-pointer'
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

      {/* 5. Co-Coach toggle + dropdown */}
      <label className="flex items-center gap-2 cursor-pointer">
        <Checkbox
          checked={showCoCoach}
          onChange={() => {
            if (showCoCoach) {
              updateField('coCoachId', null);
              setShowCoCoach(false);
            } else {
              setShowCoCoach(true);
            }
          }}
        />
        <span className="text-sm text-slate-700">Add co-coach</span>
      </label>
      {showCoCoach && (
        <div ref={coCoachDropdownRef} className="relative w-full">
          <button
            type="button"
            onClick={() => setCoCoachDropdownOpen((o) => !o)}
            className={`${DROPDOWN_TRIGGER_BASE} ${
              coCoachDropdownOpen ? 'border-transparent shadow-[0_2px_2px_0_rgba(7,5,23,0.04)]' : 'border-[#031373]'
            }`}
          >
            <div className="flex flex-col items-start">
              <span className="block text-[12px] font-normal text-[#031373]">Co-Coach</span>
              <span className="text-[14px] font-semibold text-[#031373]">
                {selectedCoCoach ? selectedCoCoach.name : 'Select co-coach'}
              </span>
            </div>
            <ChevronDown size={16} className={`text-[#031373] transition-transform ${coCoachDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {coCoachDropdownOpen && (
            <div className={DROPDOWN_MENU_CLASS}>
              {coaches
                .filter((c) => c.id !== draft.coachId)
                .map((coach) => {
                  const avail = workshopDate
                    ? getCoachAvailability(coach, workshopDate)
                    : { available: true, reason: null };

                  return (
                    <button
                      key={coach.id}
                      type="button"
                      className={`w-full text-left px-4 py-2.5 text-[14px] font-semibold flex items-center gap-2 ${
                        avail.available
                          ? 'text-[#031373] hover:bg-slate-50 hover:text-ww-blue cursor-pointer'
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
      )}

      {/* 6. Description */}
      <Input
        label="Description"
        multiline
        rows={3}
        value={draft.description}
        onChange={(e) => updateField('description', e.target.value)}
        placeholder="Workshop description"
      />

      {/* 8. Markets */}
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

      {/* Zoom Type */}
      <div>
        <label className="block text-sm font-semibold text-[#031373] mb-2">Zoom Type</label>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="radio" name="zoomType" checked={draft.zoomType === 'meeting'} onChange={() => updateField('zoomType', 'meeting')} className="accent-[#031373] w-4 h-4" />
            <span className="text-sm text-ww-navy">Zoom Meeting</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="radio" name="zoomType" checked={draft.zoomType === 'webinar'} onChange={() => updateField('zoomType', 'webinar')} className="accent-[#031373] w-4 h-4" />
            <span className="text-sm text-ww-navy">Zoom Webinar</span>
          </label>
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
