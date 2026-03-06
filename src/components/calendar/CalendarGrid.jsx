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

const GRID_START_HOUR = 6;
const GRID_END_HOUR = 22;
const PX_PER_HOUR = 64;
const PX_PER_MIN = PX_PER_HOUR / 60;
const GRID_HEIGHT = (GRID_END_HOUR - GRID_START_HOUR) * PX_PER_HOUR; // 1024px

function getEventPosition(startTimeISO, endTimeISO) {
  const start = parseISO(startTimeISO);
  const end = parseISO(endTimeISO);
  const startMinutes = (getHours(start) - GRID_START_HOUR) * 60 + getMinutes(start);
  const top = startMinutes * PX_PER_MIN;
  const durationMinutes = differenceInMinutes(end, start);
  const rawHeight = durationMinutes * PX_PER_MIN;
  const height = Math.min(Math.max(rawHeight, 20), GRID_HEIGHT - top);
  return { top, height };
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

export default function CalendarGrid({ weekDays, workshops, coaches, onWorkshopClick, onSlotClick }) {
  const coachMap = useMemo(
    () => new Map(coaches.map((c) => [c.id, c])),
    [coaches]
  );

  const visibleWorkshops = useMemo(
    () => workshops.filter((ws) => ws.status !== 'Cancelled'),
    [workshops]
  );

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-white">
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
                <span className={`text-base font-semibold leading-tight ${today ? 'text-ww-blue' : 'text-ww-navy'}`}>
                  {format(day, 'd')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Body: time gutter + day columns */}
      <div className="flex overflow-y-auto" style={{ maxHeight: '600px' }}>
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

                {/* Workshop cards */}
                {dayWorkshops.map((ws, idx) => {
                  const { top, height } = getEventPosition(ws.startTime, ws.endTime);
                  return (
                    <div
                      key={ws.id}
                      className="absolute"
                      style={{
                        top,
                        height,
                        left: 2 + idx * 4,
                        right: 2,
                        zIndex: idx + 1,
                      }}
                    >
                      <WorkshopCard workshop={ws} coachMap={coachMap} onClick={onWorkshopClick} />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
