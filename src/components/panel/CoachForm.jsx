import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const INPUT_CLASS =
  'w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ww-blue/30 focus:border-ww-blue';
const LABEL_CLASS = 'block text-sm font-medium text-slate-700 mb-1';

const COACH_TYPES = ['Coach Creator', 'Legacy Coach'];
const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract'];
const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
];
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

function initDraft(coach) {
  if (coach) {
    return {
      name: coach.name,
      email: coach.email,
      type: coach.type,
      employment: coach.employment,
      timezone: coach.timezone,
      status: coach.status,
      availability: coach.availability.map((s) => ({ ...s })),
    };
  }
  return {
    name: '',
    email: '',
    type: 'Coach Creator',
    employment: 'Full-time',
    timezone: 'America/New_York',
    status: 'active',
    availability: [{ day: 'monday', start: '09:00', end: '17:00' }],
  };
}

function getInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join('');
}

export default function CoachForm({ coach, mode, onClose }) {
  const { setCoaches, toast } = useApp();
  const [draft, setDraft] = useState(() => initDraft(mode === 'edit' ? coach : null));

  const updateField = (field, value) =>
    setDraft((prev) => ({ ...prev, [field]: value }));

  const updateSlot = (index, field, value) =>
    setDraft((prev) => ({
      ...prev,
      availability: prev.availability.map((s, i) =>
        i === index ? { ...s, [field]: value } : s
      ),
    }));

  const addSlot = () =>
    setDraft((prev) => ({
      ...prev,
      availability: [...prev.availability, { day: 'monday', start: '09:00', end: '17:00' }],
    }));

  const removeSlot = (index) =>
    setDraft((prev) => ({
      ...prev,
      availability: prev.availability.filter((_, i) => i !== index),
    }));

  const handleSave = () => {
    if (!draft.name.trim() || !draft.email.trim()) return;

    if (mode === 'edit' && coach) {
      setCoaches((prev) =>
        prev.map((c) =>
          c.id === coach.id
            ? {
                ...c,
                ...draft,
                initials: getInitials(draft.name),
              }
            : c
        )
      );
      toast(`Updated ${draft.name}`);
    } else {
      const newCoach = {
        id: `coach-${Date.now()}`,
        ...draft,
        initials: getInitials(draft.name),
        avgAttendance: 0,
        workshopsThisWeek: 0,
        attendanceTrend: 'flat',
      };
      setCoaches((prev) => [...prev, newCoach]);
      toast(`Added ${draft.name}`);
    }
    onClose();
  };

  const isValid = draft.name.trim() && draft.email.trim();

  return (
    <div className="space-y-4">
      {/* Name */}
      <div>
        <label className={LABEL_CLASS}>Name</label>
        <input
          type="text"
          value={draft.name}
          onChange={(e) => updateField('name', e.target.value)}
          className={INPUT_CLASS}
          placeholder="Full name"
        />
      </div>

      {/* Email */}
      <div>
        <label className={LABEL_CLASS}>Email</label>
        <input
          type="email"
          value={draft.email}
          onChange={(e) => updateField('email', e.target.value)}
          className={INPUT_CLASS}
          placeholder="email@ww.com"
        />
      </div>

      {/* Type */}
      <div>
        <label className={LABEL_CLASS}>Type</label>
        <select
          value={draft.type}
          onChange={(e) => updateField('type', e.target.value)}
          className={INPUT_CLASS}
        >
          {COACH_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Employment */}
      <div>
        <label className={LABEL_CLASS}>Employment</label>
        <select
          value={draft.employment}
          onChange={(e) => updateField('employment', e.target.value)}
          className={INPUT_CLASS}
        >
          {EMPLOYMENT_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Timezone */}
      <div>
        <label className={LABEL_CLASS}>Timezone</label>
        <select
          value={draft.timezone}
          onChange={(e) => updateField('timezone', e.target.value)}
          className={INPUT_CLASS}
        >
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>{tz.replace('America/', '').replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      {/* Status */}
      <div>
        <label className={LABEL_CLASS}>Status</label>
        <select
          value={draft.status}
          onChange={(e) => updateField('status', e.target.value)}
          className={INPUT_CLASS}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Availability */}
      <div>
        <label className={LABEL_CLASS}>Availability</label>
        <div className="space-y-2">
          {draft.availability.map((slot, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                value={slot.day}
                onChange={(e) => updateSlot(i, 'day', e.target.value)}
                className="px-2 py-1.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ww-blue/30 focus:border-ww-blue flex-1"
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>{DAY_LABELS[d]}</option>
                ))}
              </select>
              <input
                type="time"
                value={slot.start}
                onChange={(e) => updateSlot(i, 'start', e.target.value)}
                className="px-2 py-1.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ww-blue/30 focus:border-ww-blue"
              />
              <span className="text-slate-400 text-sm">–</span>
              <input
                type="time"
                value={slot.end}
                onChange={(e) => updateSlot(i, 'end', e.target.value)}
                className="px-2 py-1.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ww-blue/30 focus:border-ww-blue"
              />
              {draft.availability.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSlot(i)}
                  className="text-slate-400 hover:text-ww-coral p-1 transition-colors"
                  aria-label="Remove slot"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addSlot}
            className="flex items-center gap-1 text-sm text-ww-blue hover:text-ww-navy transition-colors"
          >
            <Plus size={14} />
            Add time slot
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-border">
        <button
          type="button"
          onClick={handleSave}
          disabled={!isValid}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            isValid
              ? 'bg-ww-blue text-white hover:bg-ww-blue/90'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          {mode === 'edit' ? 'Save Changes' : 'Add Coach'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-slate-600 border border-border rounded-lg hover:bg-surface-2 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
