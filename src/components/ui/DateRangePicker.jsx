import { useState, useRef, useEffect, useMemo } from 'react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday,
  isAfter, isBefore,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function getWeeks(month) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const rows = [];
  let day = calStart;
  while (day <= calEnd) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push(day);
      day = addDays(day, 1);
    }
    rows.push(week);
  }
  return rows;
}

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function DateRangePicker({ dateFrom, dateTo, onChange, onClose }) {
  const [leftMonth, setLeftMonth] = useState(() => dateFrom || new Date());
  const [selecting, setSelecting] = useState(dateFrom && !dateTo ? 'to' : 'from');
  const ref = useRef(null);

  const rightMonth = addMonths(leftMonth, 1);

  useEffect(() => {
    function handleMouseDown(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [onClose]);

  const leftWeeks = useMemo(() => getWeeks(leftMonth), [leftMonth]);
  const rightWeeks = useMemo(() => getWeeks(rightMonth), [rightMonth]);

  function handleDayClick(day) {
    if (selecting === 'from') {
      onChange(day, null);
      setSelecting('to');
    } else {
      // If clicked date is before the from date, reset
      if (dateFrom && isBefore(day, dateFrom)) {
        onChange(day, null);
        setSelecting('to');
      } else {
        onChange(dateFrom, day);
        setSelecting('from');
      }
    }
  }

  function isInRange(day) {
    if (!dateFrom || !dateTo) return false;
    return isAfter(day, dateFrom) && isBefore(day, dateTo);
  }

  function isRangeStart(day) {
    return dateFrom && isSameDay(day, dateFrom);
  }

  function isRangeEnd(day) {
    return dateTo && isSameDay(day, dateTo);
  }

  function renderMonth(month, weeks) {
    return (
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-ww-navy text-center mb-3">
          {format(month, 'MMMM yyyy')}
        </h3>
        <div className="grid grid-cols-7 text-center mb-1">
          {DAY_HEADERS.map((d) => (
            <div key={d} className="text-[11px] font-medium text-slate-400 py-1">{d}</div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 text-center">
            {week.map((day) => {
              const inMonth = isSameMonth(day, month);
              const selected = isRangeStart(day) || isRangeEnd(day);
              const inRange = isInRange(day);
              const today = isToday(day);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => inMonth && handleDayClick(day)}
                  className={`h-9 text-sm relative flex items-center justify-center transition-colors
                    ${!inMonth ? 'text-slate-200 cursor-default' : 'cursor-pointer'}
                    ${inRange && inMonth ? 'bg-ww-blue/10' : ''}
                    ${isRangeStart(day) && inMonth ? 'bg-ww-blue/10 rounded-l-full' : ''}
                    ${isRangeEnd(day) && inMonth ? 'bg-ww-blue/10 rounded-r-full' : ''}
                    ${selected && dateFrom && dateTo && isSameDay(dateFrom, dateTo) ? '!rounded-full' : ''}
                  `}
                >
                  <span className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors
                    ${selected && inMonth ? 'bg-ww-blue text-white font-semibold' : ''}
                    ${!selected && today && inMonth ? 'ring-2 ring-ww-blue/30 text-ww-blue font-semibold' : ''}
                    ${!selected && !today && inMonth ? 'hover:bg-slate-100 text-slate-700' : ''}
                  `}>
                    {format(day, 'd')}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full mt-2 bg-white border border-border rounded-2xl shadow-xl z-40 p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setLeftMonth(subMonths(leftMonth, 1))}
          className="p-1 hover:bg-slate-100 rounded-full transition-colors text-ww-blue"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setLeftMonth(addMonths(leftMonth, 1))}
          className="p-1 hover:bg-slate-100 rounded-full transition-colors text-ww-blue"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="flex gap-8">
        {renderMonth(leftMonth, leftWeeks)}
        {renderMonth(rightMonth, rightWeeks)}
      </div>
    </div>
  );
}
