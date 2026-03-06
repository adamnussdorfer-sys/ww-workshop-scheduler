import { format, parseISO } from 'date-fns';
import { AlertTriangle } from 'lucide-react';

const TYPE_CARD_STYLES = {
  'Weekly Connection': 'bg-blue-50 border-l-4 border-ww-blue',
  'All In': 'bg-purple-50 border-l-4 border-purple-600',
  'Special Event': 'bg-rose-50 border-l-4 border-ww-coral',
  'Coaching Corner': 'bg-teal-50 border-l-4 border-teal-500',
  'Movement/Fitness': 'bg-green-50 border-l-4 border-green-500',
};

const STATUS_DOT_COLORS = {
  Published: 'bg-ww-success',
  Draft: 'bg-ww-warning',
  Cancelled: 'bg-slate-400',
  Conflict: 'bg-red-500 animate-pulse',
};

// Static lookup prevents Tailwind JIT from purging these classes (same pattern as TYPE_CARD_STYLES)
const CONFLICT_RING = {
  red: 'ring-2 ring-red-500',
  orange: 'ring-2 ring-orange-400',
};

export default function WorkshopCard({ workshop, coachMap, conflicts = [], onClick }) {
  const cardStyle = TYPE_CARD_STYLES[workshop.type] ?? 'bg-slate-50 border-l-4 border-slate-400';
  const dotColor = STATUS_DOT_COLORS[workshop.status] ?? 'bg-slate-400';

  const startLabel = format(parseISO(workshop.startTime), 'h:mm a');

  const coach = coachMap.get(workshop.coachId);
  const coCoach = workshop.coCoachId ? coachMap.get(workshop.coCoachId) : null;

  const coachLine = coach
    ? coCoach
      ? `${coach.name} . ${coCoach.name}`
      : coach.name
    : '';

  const ringColor = conflicts.some(c => c.severity === 'red')
    ? 'red'
    : conflicts.length > 0
    ? 'orange'
    : null;
  const ringClass = ringColor ? CONFLICT_RING[ringColor] : '';
  const hasConflicts = conflicts.length > 0;
  const iconColor = ringColor === 'red' ? 'text-red-500' : 'text-orange-400';

  return (
    <div
      className={`h-full overflow-hidden rounded text-xs px-1.5 py-1 cursor-pointer hover:brightness-95 transition-all relative ${cardStyle} ${ringClass}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(workshop.id);
      }}
    >
      {hasConflicts && (
        <div className={`absolute top-0.5 right-0.5 ${iconColor}`}>
          <AlertTriangle size={12} />
        </div>
      )}
      <div className="flex items-center gap-1 mb-0.5">
        <span className={`flex-shrink-0 w-2 h-2 rounded-full ${dotColor}`} />
        <span className="text-slate-500 truncate">{startLabel}</span>
      </div>
      <p className="font-semibold text-ww-navy leading-tight truncate">{workshop.title}</p>
      {coachLine && (
        <p className="text-slate-500 truncate mt-0.5">{coachLine}</p>
      )}
    </div>
  );
}
