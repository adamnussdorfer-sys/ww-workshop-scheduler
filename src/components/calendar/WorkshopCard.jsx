import { format, parseISO } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import Tooltip from '../ui/Tooltip';

const TYPE_CARD_STYLES = {
  'Weekly Connection': 'bg-sky-100',
  'All In': 'bg-fuchsia-100',
  'Special Event': 'bg-pink-100',
  'Coaching Corner': 'bg-slate-200',
  'Movement/Fitness': 'bg-violet-200',
};

const STATUS_LABEL_STYLES = {
  Draft: 'text-yellow-700 bg-yellow-50',
};

// Static lookup prevents Tailwind JIT from purging these classes (same pattern as TYPE_CARD_STYLES)
const CONFLICT_RING = {
  red: 'ring-2 ring-red-600',
  orange: 'ring-2 ring-red-400',
};

export default function WorkshopCard({ workshop, coachMap, conflicts = [], onClick, isFiltered = false, height = 999 }) {
  const compact = height < 42;
  const cardStyle = TYPE_CARD_STYLES[workshop.type] ?? 'bg-slate-50';
  const statusLabel = STATUS_LABEL_STYLES[workshop.status] ?? null;

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
  const iconColor = ringColor === 'red' ? 'text-red-600' : 'text-red-400';

  return (
    <div
      className={`h-full overflow-hidden rounded text-xs px-1.5 py-1 cursor-pointer relative
        transition-[transform,box-shadow] duration-150 ease-out
        hover:-translate-y-0.5 hover:shadow-md
        motion-reduce:transition-none motion-reduce:hover:transform-none
        ${cardStyle} ${ringClass || 'ring-[1.5px] ring-border'}${isFiltered ? ' opacity-25 pointer-events-none' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(workshop.id);
      }}
    >
      {hasConflicts && (
        <div className={`absolute top-0.5 right-0.5 ${iconColor} cursor-help`}>
          <Tooltip
            content={conflicts.map((c, i) => (
              <div key={i}>{c.message}</div>
            ))}
          >
            <AlertTriangle size={12} strokeWidth={2.5} />
          </Tooltip>
        </div>
      )}
      {compact ? (
        <p className="font-semibold text-ww-navy leading-tight truncate">{workshop.title}</p>
      ) : (
        <>
          <div className="flex items-center gap-1 mb-0.5">
            <span className="text-slate-500 truncate">{startLabel}</span>
            {statusLabel && (
              <span className={`ml-auto text-[9px] font-semibold uppercase leading-none px-1 py-0.5 rounded ${statusLabel} shrink-0`}>
                {workshop.status}
              </span>
            )}
          </div>
          <p className="font-semibold text-ww-navy leading-tight truncate">{workshop.title}</p>
          {coachLine && (
            <p className="text-slate-500 truncate mt-0.5">{coachLine}</p>
          )}
        </>
      )}
    </div>
  );
}
