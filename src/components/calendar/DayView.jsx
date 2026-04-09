import { useMemo, useState, useEffect, useRef } from 'react';
import {
  parseISO,
  differenceInMinutes,
  format,
} from 'date-fns';
import WorkshopCard from './WorkshopCard';
import {
  GRID_START_HOUR,
  GRID_END_HOUR,
  PX_PER_HOUR,
  PX_PER_MIN,
  GRID_HEIGHT,
  GRID_SLOTS,
  getAvailabilityBands,
  COACH_OVERLAY_COLORS,
} from '../../utils/availabilityBands';
import { useApp } from '../../context/AppContext';
import { getHoursInTz, getMinutesInTz, isSameDayInTz, isTodayInTz, getTzAbbr } from '../../utils/timezone';
import useDrag from '../../hooks/useDrag';

function getEventPosition(startTimeISO, endTimeISO, tz) {
  const start = parseISO(startTimeISO);
  const end = parseISO(endTimeISO);
  const startMinutes = (getHoursInTz(start, tz) - GRID_START_HOUR) * 60 + getMinutesInTz(start, tz);
  const top = startMinutes * PX_PER_MIN;
  const durationMinutes = differenceInMinutes(end, start);
  const rawHeight = durationMinutes * PX_PER_MIN;
  const height = Math.min(Math.max(rawHeight, 20), GRID_HEIGHT - top) - 6;
  return { top, height };
}

function getColumnLayout(dayWorkshops) {
  const items = dayWorkshops.map((ws) => {
    const start = parseISO(ws.startTime);
    const end = parseISO(ws.endTime);
    return { id: ws.id, start: start.getTime(), end: end.getTime() };
  });
  items.sort((a, b) => a.start - b.start);

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

  const layout = new Map();
  for (const cluster of clusters) {
    const cols = [];
    for (const item of cluster) {
      let col = 0;
      while (cols[col]?.some((c) => c.start < item.end && item.start < c.end)) {
        col++;
      }
      if (!cols[col]) cols[col] = [];
      cols[col].push(item);
      layout.set(item.id, { col, totalCols: 0 });
    }
    for (const item of cluster) {
      layout.get(item.id).totalCols = cols.length;
    }
  }
  return layout;
}

function formatHourLabel(h) {
  if (h === 0 || h === 24) return '12 AM';
  if (h === 12) return '12 PM';
  if (h < 12) return `${h} AM`;
  return `${h - 12} PM`;
}

const HOUR_LABELS = Array.from(
  { length: GRID_END_HOUR - GRID_START_HOUR + 1 },
  (_, i) => GRID_START_HOUR + i
);

const SLOT_LINES = Array.from({ length: GRID_SLOTS }, (_, i) => i);

export default function DayView({
  date,
  workshops,
  coaches,
  conflictMap,
  onWorkshopClick,
  onSlotClick,
  filteredIds = new Set(),
  anyFilterActive = false,
  showOverlay = false,
}) {
  const { filters, userTimezone, setWorkshops, toast } = useApp();

  const { dragState, didDrag, onPointerDown, onPointerMove, onPointerUp } = useDrag({
    workshops, setWorkshops, userTimezone, toast,
  });

  const coachMap = useMemo(
    () => new Map(coaches.map((c) => [c.id, c])),
    [coaches]
  );

  const visibleWorkshops = useMemo(
    () => workshops.filter((ws) => ws.status !== 'Cancelled'),
    [workshops]
  );

  const dayWorkshops = useMemo(
    () => visibleWorkshops.filter((ws) => isSameDayInTz(parseISO(ws.startTime), date, userTimezone)),
    [visibleWorkshops, date, userTimezone]
  );


  // Compute availability bands for this single day
  const availabilityBands = useMemo(() => {
    if (!showOverlay) return [];
    const coachFilterSet = filters.coaches.length > 0
      ? new Set(filters.coaches)
      : null;
    return getAvailabilityBands(coaches, date)
      .filter(band => !coachFilterSet || coachFilterSet.has(band.coachId));
  }, [showOverlay, coaches, date, filters.coaches]);

  const today = isTodayInTz(date, userTimezone);

  // Current-time indicator — updates every minute
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!today) return;
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, [today]);

  const nowTop = useMemo(() => {
    if (!today) return null;
    const minutes = (getHoursInTz(now, userTimezone) - GRID_START_HOUR) * 60 + getMinutesInTz(now, userTimezone);
    const top = minutes * PX_PER_MIN;
    if (top < 0 || top > GRID_HEIGHT) return null;
    return top;
  }, [today, now, userTimezone]);

  // Auto-scroll to ~5 AM on mount
  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 5 * PX_PER_HOUR;
    }
  }, []);

  const tzLabel = getTzAbbr(userTimezone);

  return (
    <div className="border border-border rounded-3xl overflow-hidden bg-white flex flex-col flex-1">
      {/* Header spacer — no date banner in day view */}
      <div className="flex border-b border-border sticky top-0 bg-white z-10">
        {/* Time gutter spacer — timezone label */}
        <div className="w-16 flex-shrink-0 flex items-center justify-center h-6">
          <span className="text-[10px] text-slate-400 font-medium tracking-wide">{tzLabel}</span>
        </div>
        <div className="flex-1 border-l border-border" />
      </div>

      {/* Body: time gutter + single day column */}
      <div ref={scrollRef} className="flex overflow-y-auto flex-1 pt-2">
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
          {/* Current-time gutter line */}
          {nowTop !== null && (
            <div
              className="absolute right-0 h-[2px] bg-[#8B9AE8] pointer-events-none"
              style={{ top: nowTop, width: 8 }}
            />
          )}
        </div>

        {/* Single day column */}
        <div
          className="relative flex-1 border-l border-border cursor-pointer"
          style={{ height: GRID_HEIGHT }}
          onClick={(e) => {
            // Only fire when clicking the background, not a workshop card
            if (e.target !== e.currentTarget) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const scrollContainer = e.currentTarget.closest('.overflow-y-auto');
            const scrollTop = scrollContainer ? scrollContainer.scrollTop : 0;
            const relY = e.clientY - rect.top + scrollTop;
            const totalMinutes = Math.floor(relY / PX_PER_MIN);
            const snappedMinutes = Math.floor(totalMinutes / 30) * 30;
            const hour = GRID_START_HOUR + Math.floor(snappedMinutes / 60);
            const minute = snappedMinutes % 60;
            if (hour >= GRID_START_HOUR && hour < GRID_END_HOUR) {
              onSlotClick?.(date, hour, minute);
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

          {/* Availability overlay bands */}
          {showOverlay && availabilityBands.map((band) => (
            <div
              key={`avail-${band.coachId}`}
              className={`absolute left-0 right-0 pointer-events-none ${COACH_OVERLAY_COLORS[band.coachIndex % COACH_OVERLAY_COLORS.length]}`}
              style={{ top: band.top, height: band.height, zIndex: 0 }}
              aria-hidden="true"
            />
          ))}


          {/* Current-time line */}
          {nowTop !== null && (
            <div
              className="absolute left-0 right-0 pointer-events-none"
              style={{ top: nowTop, zIndex: 5 }}
            >
              <div className="absolute -left-[5px] -top-[5px] w-[10px] h-[10px] rounded-full bg-[#8B9AE8]" />
              <div className="absolute left-0 right-0 h-[2px]" style={{ backgroundImage: 'repeating-linear-gradient(to right, #8B9AE8 0, #8B9AE8 12px, transparent 12px, transparent 18px)' }} />
            </div>
          )}

          {/* Workshop cards — wider in day view */}
          {(() => {
            const colLayout = getColumnLayout(dayWorkshops);
            return dayWorkshops.map((ws) => {
              const { top, height } = getEventPosition(ws.startTime, ws.endTime, userTimezone);
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
                    width: `calc(${widthPct}% - 4px)`,
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
                    isDragging={dragState.active && dragState.workshopId === ws.id}
                    didDrag={didDrag}
                    onPointerDown={(e) => onPointerDown(e, ws, scrollRef.current, date)}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                  />
                </div>
              );
            });
          })()}

          {/* Drag ghost */}
          {dragState.active && (() => {
            const ghostWs = workshops.find((w) => w.id === dragState.workshopId);
            if (!ghostWs) return null;
            return (
              <div
                className="absolute left-0 right-1 pointer-events-none"
                style={{ top: dragState.top, height: dragState.height, zIndex: 50 }}
              >
                <WorkshopCard
                  workshop={ghostWs}
                  coachMap={coachMap}
                  conflicts={[]}
                  height={dragState.height}
                />
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
