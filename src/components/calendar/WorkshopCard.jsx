import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';
import Tooltip from '../ui/Tooltip';
import { useApp } from '../../context/AppContext';
import { formatTimeInTz } from '../../utils/timezone';

const TYPE_CARD_STYLES = {
  'Weekly Workshop': 'bg-sky-100',
  'Weekly Connection': 'bg-teal-100',
  'All In': 'bg-fuchsia-100',
  'GLP-1 & Diabetes': 'bg-emerald-100',
  'Movement & Fitness': 'bg-violet-200',
  'Nutrition & Cooking': 'bg-amber-100',
  'Mindset & Wellness': 'bg-rose-100',
  'Community': 'bg-orange-100',
  'Education': 'bg-indigo-100',
  'Real Room': 'bg-red-100',
  'Life Stage': 'bg-pink-100',
  'Coaching Corner': 'bg-slate-200',
};

const DRAFT_BORDER = 'border-2 border-dashed border-slate-300';

// Static lookup prevents Tailwind JIT from purging these classes (same pattern as TYPE_CARD_STYLES)
const CONFLICT_RING = {
  red: 'ring-2 ring-inset ring-red-600',
  orange: 'ring-2 ring-inset ring-red-400',
};

export default function WorkshopCard({ workshop, coachMap, conflicts = [], onClick, isFiltered = false, height = 999, hideConflictIcon = false }) {
  const { highlightedIds, userTimezone } = useApp();
  const isHighlighted = highlightedIds.has(workshop.id);
  const compact = height < 42;
  const cardStyle = TYPE_CARD_STYLES[workshop.type] ?? 'bg-slate-50';
  const isDraft = workshop.status === 'Draft';

  const startLabel = formatTimeInTz(workshop.startTime, userTimezone);

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

  const tooltipContent = hasConflicts
    ? conflicts.map((c, i) => <div key={i}>{c.message}</div>)
    : null;

  // Card-level tooltip for when icon is hidden (week view)
  const [tipVisible, setTipVisible] = useState(false);
  const [tipPos, setTipPos] = useState({ top: 0, left: 0 });
  const cardRef = useRef(null);
  const showCardTip = useCallback(() => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setTipPos({ top: rect.bottom + 6, left: rect.left + rect.width / 2 });
    setTipVisible(true);
  }, []);
  const hideCardTip = useCallback(() => setTipVisible(false), []);

  const cardTipHandlers = hasConflicts && hideConflictIcon
    ? { ref: cardRef, onMouseEnter: showCardTip, onMouseLeave: hideCardTip }
    : {};

  const card = (
    <div
      {...cardTipHandlers}
      className={`h-full overflow-hidden rounded text-xs px-1.5 py-1 cursor-pointer relative
        transition-[transform,box-shadow] duration-150 ease-out
        hover:-translate-y-0.5 hover:shadow-md
        motion-reduce:transition-none motion-reduce:hover:transform-none
        ${cardStyle} ${ringClass || (isDraft ? DRAFT_BORDER : 'ring-[1.5px] ring-inset ring-border')}${isFiltered ? ' opacity-25 pointer-events-none' : ''}${isHighlighted ? ' animate-new-glow' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(workshop.id);
      }}
    >
      {hasConflicts && !hideConflictIcon && (
        <div className={`absolute top-1.5 right-1.5 ${iconColor} cursor-help`}>
          <Tooltip content={tooltipContent}>
            <AlertTriangle size={12} strokeWidth={2.5} />
          </Tooltip>
        </div>
      )}
      {isDraft && !hasConflicts && (
        <div className="absolute top-1.5 right-1.5 text-slate-400 cursor-help">
          <Tooltip content="Draft">
            <span className="text-[10px] font-medium uppercase tracking-wide">Draft</span>
          </Tooltip>
        </div>
      )}
      {compact ? (
        <p className="font-semibold text-ww-navy leading-tight truncate">{workshop.title}</p>
      ) : (
        <>
          <div className="flex items-center gap-1 mb-0.5">
            <span className="text-slate-500 truncate">{startLabel}</span>
          </div>
          <p className="font-semibold text-ww-navy leading-tight truncate">{workshop.title}</p>
          {coachLine && (
            <p className="text-slate-500 truncate mt-0.5">{coachLine}</p>
          )}
        </>
      )}
    </div>
  );

  return (
    <>
      {card}
      {tipVisible && tooltipContent && createPortal(
        <div
          className="fixed z-[9999] -translate-x-1/2 bg-ww-navy text-white text-[11px] leading-snug rounded-md shadow-lg px-2.5 py-1.5 max-w-56 pointer-events-none"
          style={{ top: tipPos.top, left: tipPos.left }}
        >
          {tooltipContent}
        </div>,
        document.body
      )}
    </>
  );
}
