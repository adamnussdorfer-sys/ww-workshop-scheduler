import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Input, { Select } from '../ui/Input';

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

export default function CoachForm({ coach, mode, onClose, onRemove }) {
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
      <Input
        label="Name"
        type="text"
        value={draft.name}
        onChange={(e) => updateField('name', e.target.value)}
        placeholder="Full name"
      />

      {/* Email */}
      <Input
        label="Email"
        type="email"
        value={draft.email}
        onChange={(e) => updateField('email', e.target.value)}
        placeholder="email@ww.com"
      />

      {/* Type */}
      <Select
        label="Type"
        value={draft.type}
        onChange={(v) => updateField('type', v)}
        options={COACH_TYPES.map((t) => ({ value: t, label: t }))}
      />

      {/* Employment */}
      <Select
        label="Employment"
        value={draft.employment}
        onChange={(v) => updateField('employment', v)}
        options={EMPLOYMENT_TYPES.map((t) => ({ value: t, label: t }))}
      />

      {/* Timezone */}
      <Select
        label="Timezone"
        value={draft.timezone}
        onChange={(v) => updateField('timezone', v)}
        options={TIMEZONES.map((tz) => ({ value: tz, label: tz.replace('America/', '').replace('_', ' ') }))}
      />

      {/* Status */}
      <Select
        label="Status"
        value={draft.status}
        onChange={(v) => updateField('status', v)}
        options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
      />

      {/* Availability */}
      <div>
        <label className="block text-[12px] font-normal text-[#031AA1] mb-2">Availability</label>
        <div className="space-y-3">
          {draft.availability.map((slot, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex-1">
                <Select
                  label="Day"
                  value={slot.day}
                  onChange={(v) => updateSlot(i, 'day', v)}
                  options={DAYS.map((d) => ({ value: d, label: DAY_LABELS[d] }))}
                />
              </div>
              <div className="w-[100px]">
                <Input
                  label="Start"
                  type="time"
                  value={slot.start}
                  onChange={(e) => updateSlot(i, 'start', e.target.value)}
                />
              </div>
              <span className="text-slate-400 text-sm">–</span>
              <div className="w-[100px]">
                <Input
                  label="End"
                  type="time"
                  value={slot.end}
                  onChange={(e) => updateSlot(i, 'end', e.target.value)}
                />
              </div>
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
      <div className="pt-4 border-t border-border mt-6 space-y-3">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium bg-white text-ww-blue border-[1.5px] border-ww-blue rounded-full hover:bg-ww-blue/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isValid}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-full transition-colors ${
              isValid
                ? 'bg-ww-blue text-white hover:bg-ww-navy'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {mode === 'edit' ? 'Save Changes' : 'Add Coach'}
          </button>
        </div>
      </div>

      {mode === 'edit' && onRemove && (
        <div className="pt-6 mt-2">
          <button
            type="button"
            onClick={onRemove}
            className="text-sm text-red-500 hover:text-red-700 transition-colors"
          >
            Remove coach
          </button>
        </div>
      )}
    </div>
  );
}
