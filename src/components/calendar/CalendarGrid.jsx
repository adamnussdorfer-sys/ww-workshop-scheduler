import { useMemo } from 'react';
import {
  parseISO,
  getHours,
  getMinutes,
  differenceInMinutes,
  isSameDay,
  format,
  isToday,
} from 'date-fns';
import WorkshopCard from './WorkshopCard';
import { getSaturatedSlots } from '../../utils/conflictEngine';
import {
  GRID_START_HOUR,
  GRID_END_HOUR,
  PX_PER_HOUR,
  PX_PER_MIN,
  GRID_HEIGHT,
  getAvailabilityBands,
  COACH_OVERLAY_COLORS,
} from '../../utils/availabilityBands';
import { useApp } from '../../context/AppContext';

function getEventPosition(startTimeISO, endTimeISO) {
  const start = parseISO(startTimeISO);
  const end = parseISO(endTimeISO);
  const startMinutes = (getHours(start) - GRID_START_HOUR) * 60 + getMinutes(start);
  const top = startMinutes * PX_PER_MIN;
  const durationMinutes = differenceInMinutes(end, start);
  const rawHeight = durationMinutes * PX_PER_MIN;
  const height = Math.min(Math.max(rawHeight, 20), GRID_HEIGHT - top) - 6;
  return { top, height };
}

// Assign columns to overlapping workshops so they sit side-by-side
function getColumnLayout(dayWorkshops) {
  const items = dayWorkshops.map((ws) => {
    const start = parseISO(ws.startTime);
    const end = parseISO(ws.endTime);
    return { id: ws.id, start: start.getTime(), end: end.getTime() };
  });
  items.sort((a, b) => a.start - b.start);

  // Group into overlapping clusters
  const clusters = [];
  for (const item of items) {
    let placed = false;
    for (const cluster of clusters) {
      if (cluster.some((c) => c.start < item.end && item.start < c.end)) {
        cluster.push(item);
        placed = true;
        break;
      }
    }
    if (!placed) clusters.push([item]);
  }

  // Assign columns within each cluster
  const layout = new Map();
  for (const cluster of clusters) {
    const cols = [];
    for (const item of cluster) {
      // Find first column where this item doesn't overlap with existing items
      let col = 0;
      while (cols[col]?.some((c) => c.start < item.end && item.start < c.end)) {
        col++;
      }
      if (!cols[col]) cols[col] = [];
      cols[col].push(item);
      layout.set(item.id, { col, totalCols: 0 });
    }
    // Set totalCols for all items in this cluster
    for (const item of cluster) {
      layout.get(item.id).totalCols = cols.length;
    }
  }
  return layout;
}

function formatHourLabel(h) {
  if (h === 12) return '12 PM';
  if (h < 12) return `${h} AM`;
  return `${h - 12} PM`;
}

const HOUR_LABELS = Array.from(
  { length: GRID_END_HOUR - GRID_START_HOUR + 1 },
  (_, i) => GRID_START_HOUR + i
);

// 32 slot lines: one per 30-min slot across 16 hours = 32 slots
const SLOT_LINES = Array.from({ length: 32 }, (_, i) => i);

export default function CalendarGrid({ weekDays, workshops, coaches, conflictMap, onWorkshopClick, onSlotClick, filteredIds = new Set(), anyFilterActive = false, showOverlay = false, onDayClick }) {
  const { filters } = useApp();

  const coachMap = useMemo(
    () => new Map(coaches.map((c) => [c.id, c])),
    [coaches]
  );

  const visibleWorkshops = useMemo(
    () => workshops.filter((ws) => ws.status !== 'Cancelled'),
    [workshops]
  );

  const saturationMap = useMemo(() => {
    const result = new Map();
    weekDays.forEach(day => {
      const dayWs = visibleWorkshops.filter(ws => isSameDay(parseISO(ws.startTime), day));
      result.set(day.toISOString(), getSaturatedSlots(dayWs));
    });
    return result;
  }, [visibleWorkshops, weekDays]);

  // Compute availability bands per day — short-circuits when overlay is off.
  // Uses full coaches array (preserving stable coachIndex for color) then filters
  // to active coaches when a coach filter is active.
  const availabilityBands = useMemo(() => {
    if (!showOverlay) return new Map();
    const result = new Map();
    const coachFilterSet = filters.coaches.length > 0
      ? new Set(filters.coaches)
      : null;
    weekDays.forEach(day => {
      const bands = getAvailabilityBands(coaches, day)
        .filter(band => !coachFilterSet || coachFilterSet.has(band.coachId));
      result.set(day.toISOString(), bands);
    });
    return result;
  }, [showOverlay, coaches, weekDays, filters.coaches]);

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-white flex flex-col flex-1">
      {/* Header row: time gutter spacer + 7 day headers */}
      <div className="flex border-b border-border sticky top-0 bg-white z-10">
        {/* Time gutter spacer */}
        <div className="w-16 flex-shrink-0" />
        {/* Day headers */}
        <div className="grid flex-1" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {weekDays.map((day) => {
            const today = isToday(day);
            return (
              <div
                key={day.toISOString()}
                className={`flex flex-col items-center justify-center h-10 border-l border-border text-xs ${
                  today ? 'bg-ww-blue/10 text-ww-blue font-bold' : 'text-slate-600'
                }`}
              >
                <span className="uppercase tracking-wide text-[10px]">
                  {format(day, 'EEE')}
                </span>
                <button
                  className={`text-base font-semibold leading-tight hover:text-ww-blue hover:underline cursor-pointer ${today ? 'text-ww-blue' : 'text-ww-navy'}`}
                  onClick={(e) => { e.stopPropagation(); onDayClick?.(day); }}
                >
                  {format(day, 'd')}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Body: time gutter + day columns */}
      <div className="flex overflow-y-auto flex-1">
        {/* Time gutter */}
        <div className="w-16 flex-shrink-0 relative" style={{ height: GRID_HEIGHT }}>
          {HOUR_LABELS.map((h) => (
            <div
              key={h}
              className="absolute right-2 text-[10px] text-slate-400 leading-none"
              style={{ top: (h - GRID_START_HOUR) * PX_PER_HOUR - 6 }}
            >
              {formatHourLabel(h)}
            </div>
          ))}
        </div>

        {/* Day columns */}
        <div className="grid flex-1" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {weekDays.map((day) => {
            const dayWorkshops = visibleWorkshops.filter((ws) =>
              isSameDay(parseISO(ws.startTime), day)
            );

            return (
              <div
                key={day.toISOString()}
                className="relative border-l border-border cursor-pointer"
                style={{ height: GRID_HEIGHT }}
                onClick={(e) => {
                  // Only fire when clicking the background, not a workshop card
                  if (e.target !== e.currentTarget) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  // Account for scroll offset of the parent overflow container
                  const scrollContainer = e.currentTarget.closest('.overflow-y-auto');
                  const scrollTop = scrollContainer ? scrollContainer.scrollTop : 0;
                  const relY = e.clientY - rect.top + scrollTop;
                  const totalMinutes = Math.floor(relY / PX_PER_MIN);
                  const snappedMinutes = Math.floor(totalMinutes / 30) * 30;
                  const hour = GRID_START_HOUR + Math.floor(snappedMinutes / 60);
                  const minute = snappedMinutes % 60;
                  // Clamp to grid bounds
                  if (hour >= GRID_START_HOUR && hour < GRID_END_HOUR) {
                    onSlotClick?.(day, hour, minute);
                  }
                }}
              >
                {/* Slot row lines */}
                {SLOT_LINES.map((i) => {
                  const isHourLine = i % 2 === 0;
                  return (
                    <div
                      key={i}
                      className={`absolute left-0 right-0 border-t ${
                        isHourLine ? 'border-border' : 'border-border/50'
                      }`}
                      style={{ top: i * 32 }}
                    />
                  );
                })}

                {/* Availability overlay bands — rendered before workshop cards so they sit below in z-order */}
                {showOverlay && availabilityBands.get(day.toISOString())?.map((band) => (
                  <div
                    key={`avail-${band.coachId}`}
                    className={`absolute left-0 right-0 pointer-events-none ${COACH_OVERLAY_COLORS[band.coachIndex % COACH_OVERLAY_COLORS.length]}`}
                    style={{ top: band.top, height: band.height, zIndex: 0 }}
                    aria-hidden="true"
                  />
                ))}

                {/* Saturation bars — amber overlay for 4+ concurrent workshops */}
                {saturationMap.get(day.toISOString())?.map(({ slotIndex, count }) => (
                  <div
                    key={`sat-${slotIndex}`}
                    className="absolute left-0 right-0 bg-amber-50 border-t border-amber-300 flex items-center px-1 z-10 pointer-events-none"
                    style={{ top: slotIndex * 32, height: 32 }}
                  >
                    <span className="text-[9px] text-amber-700 font-medium">{count} concurrent</span>
                  </div>
                ))}

                {/* Workshop cards */}
                {(() => {
                  const colLayout = getColumnLayout(dayWorkshops);
                  return dayWorkshops.map((ws) => {
                  const { top, height } = getEventPosition(ws.startTime, ws.endTime);
                  const isFiltered = anyFilterActive && !filteredIds.has(ws.id);
                  const { col, totalCols } = colLayout.get(ws.id) ?? { col: 0, totalCols: 1 };
                  const widthPct = 100 / totalCols;
                  const leftPct = col * widthPct;
                  return (
                    <div
                      key={ws.id}
                      className="absolute"
                      style={{
                        top,
                        height,
                        left: `${leftPct}%`,
                        width: `calc(${widthPct}% - 2px)`,
                        zIndex: col + 1,
                      }}
                    >
                      <WorkshopCard
                        workshop={ws}
                        coachMap={coachMap}
                        conflicts={conflictMap?.get(ws.id)?.conflicts ?? []}
                        onClick={onWorkshopClick}
                        isFiltered={isFiltered}
                        height={height}
                      />
                    </div>
                  );
                });
                })()}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
