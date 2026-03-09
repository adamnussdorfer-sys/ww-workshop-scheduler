const COACH_STATUS_BADGE = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-slate-100 text-slate-600',
};

const AVAILABILITY_DAY_LABELS = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <span className="text-sm text-slate-900">{value}</span>
    </div>
  );
}

export default function CoachDetailPanel({ coach }) {
  if (!coach) return null;

  return (
    <div className="space-y-4">
      {/* Status badge */}
      <div>
        <span
          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
            COACH_STATUS_BADGE[coach.status] ?? 'bg-slate-100 text-slate-600'
          }`}
        >
          {coach.status.charAt(0).toUpperCase() + coach.status.slice(1)}
        </span>
      </div>

      {/* Core info */}
      <div className="space-y-2">
        <DetailRow label="Type" value={coach.type} />
        <DetailRow label="Employment" value={coach.employment} />
        <DetailRow label="Timezone" value={coach.timezone} />
        <DetailRow label="Email" value={coach.email} />
        <DetailRow label="Workshops This Week" value={coach.workshopsThisWeek} />
        <DetailRow label="Avg Attendance" value={coach.avgAttendance} />
        <DetailRow
          label="Attendance Trend"
          value={
            coach.attendanceTrend.charAt(0).toUpperCase() +
            coach.attendanceTrend.slice(1)
          }
        />
      </div>

      {/* Availability schedule */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Availability
        </p>
        {coach.availability.map((slot, i) => (
          <div
            key={i}
            className="flex justify-between text-sm text-slate-600 py-1 border-b border-border last:border-0"
          >
            <span>{AVAILABILITY_DAY_LABELS[slot.day] ?? slot.day}</span>
            <span>
              {slot.start} &ndash; {slot.end}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
