import { useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  isToday,
  format,
  parseISO,
} from 'date-fns';

// ── Type-colored pill styles (mirrors WorkshopCard TYPE_CARD_STYLES) ─────────
const TYPE_PILL_STYLES = {
  'Weekly Connection': 'bg-sky-100 border-l-2 border-sky-500',
  'All In': 'bg-fuchsia-100 border-l-2 border-fuchsia-500',
  'Special Event': 'bg-pink-100 border-l-2 border-pink-500',
  'Coaching Corner': 'bg-slate-200 border-l-2 border-slate-500',
  'Movement/Fitness': 'bg-violet-200 border-l-2 border-violet-500',
};

const MAX_VISIBLE_PILLS = 3;
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function MonthView({
  currentDate,
  workshops,
  coaches,
  conflictMap,
  onWorkshopClick,
  onDayClick,
  filteredIds,
  anyFilterActive,
}) {
  // Build weeks array — each week is an array of 7 Date objects (Mon–Sun)
  const weeks = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const result = [];
    let day = calendarStart;
    while (day <= calendarEnd) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        week.push(day);
        day = addDays(day, 1);
      }
      result.push(week);
    }
    return result;
  }, [currentDate]);

  // Filter to non-cancelled workshops once
  const visibleWorkshops = useMemo(
    () => workshops.filter((ws) => ws.status !== 'Cancelled'),
    [workshops]
  );

  // Group workshops by date key for O(1) day lookups
  const workshopsByDay = useMemo(() => {
    const map = new Map();
    for (const ws of visibleWorkshops) {
      const dateKey = format(parseISO(ws.startTime), 'yyyy-MM-dd');
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey).push(ws);
    }
    return map;
  }, [visibleWorkshops]);

  return (
    <div className="border border-border rounded-3xl overflow-hidden bg-white flex flex-col flex-1">
      {/* Column headers: Mon–Sun */}
      <div className="grid grid-cols-7 border-b border-border">
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            className="flex items-center justify-center h-8 uppercase tracking-wide text-[10px] text-slate-600 font-medium"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Week rows */}
      {weeks.map((week, weekIdx) => (
        <div key={weekIdx} className="grid grid-cols-7 flex-1">
          {week.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayWorkshops = workshopsByDay.get(dateKey) ?? [];
            const inMonth = isSameMonth(day, currentDate);
            const today = isToday(day);
            const hasConflict = dayWorkshops.some(
              (ws) => conflictMap.get(ws.id)?.hasConflicts
            );
            const overflowCount = dayWorkshops.length - MAX_VISIBLE_PILLS;
            const pillWorkshops = dayWorkshops.slice(0, MAX_VISIBLE_PILLS);

            return (
              <div
                key={day.toISOString()}
                className={`relative min-h-[120px] border-t border-l border-border p-1.5 cursor-pointer
                  hover:bg-surface-2/50 transition-colors
                  ${!inMonth ? 'bg-slate-50/50' : ''}`}
                onClick={() => onDayClick(day)}
              >
                {/* Conflict dot */}
                {hasConflict && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
                )}

                {/* Date number */}
                <div className="flex justify-start mb-1">
                  {today ? (
                    <span className="bg-ww-blue text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                      {format(day, 'd')}
                    </span>
                  ) : (
                    <span
                      className={`text-xs font-semibold px-1 ${
                        inMonth ? 'text-ww-navy' : 'text-slate-300'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                  )}
                </div>

                {/* Workshop pills */}
                <div className="flex flex-col gap-0.5">
                  {pillWorkshops.map((ws) => {
                    const pillStyle =
                      TYPE_PILL_STYLES[ws.type] ?? 'bg-slate-50 border-l-2 border-slate-400';
                    const isDimmed =
                      anyFilterActive && !filteredIds.has(ws.id);

                    return (
                      <div
                        key={ws.id}
                        className={`h-5 text-[10px] leading-tight px-1 rounded truncate cursor-pointer
                          ${pillStyle}
                          ${isDimmed ? 'opacity-25 pointer-events-none' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onWorkshopClick(ws.id);
                        }}
                        title={ws.title}
                      >
                        <span className="truncate text-ww-navy font-medium">
                          {ws.title}
                        </span>
                      </div>
                    );
                  })}

                  {/* Overflow link */}
                  {overflowCount > 0 && (
                    <button
                      className="text-[10px] text-ww-blue hover:underline cursor-pointer mt-0.5 text-left"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDayClick(day);
                      }}
                    >
                      +{overflowCount} more
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
