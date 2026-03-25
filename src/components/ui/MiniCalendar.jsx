import { useState, useRef, useEffect, useMemo } from 'react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function MiniCalendar({ selected, onSelect, onClose }) {
  const [viewMonth, setViewMonth] = useState(selected || new Date());
  const ref = useRef(null);

  useEffect(() => {
    function handleMouseDown(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [onClose]);

  const weeks = useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
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
  }, [viewMonth]);

  return (
    <div ref={ref} className="absolute left-0 top-full mt-1 bg-white border border-border rounded-2xl shadow-lg z-30 p-3 w-64">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-slate-800">{format(viewMonth, 'MMMM yyyy')}</span>
        <div className="flex gap-1">
          <button type="button" onClick={() => setViewMonth(subMonths(viewMonth, 1))} className="p-0.5 hover:bg-slate-100 rounded">
            <ChevronLeft size={16} className="text-slate-500" />
          </button>
          <button type="button" onClick={() => setViewMonth(addMonths(viewMonth, 1))} className="p-0.5 hover:bg-slate-100 rounded">
            <ChevronRight size={16} className="text-slate-500" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-center text-[10px] text-slate-400 mb-1">
        {['S','M','T','W','T','F','S'].map((d, i) => <div key={i}>{d}</div>)}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 text-center">
          {week.map((day) => {
            const inMonth = isSameMonth(day, viewMonth);
            const sel = selected && isSameDay(day, selected);
            const today = isToday(day);
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => { onSelect(day); onClose(); }}
                className={`w-8 h-8 text-xs rounded-full flex items-center justify-center
                  ${sel ? 'bg-ww-blue text-white font-bold' : ''}
                  ${!sel && today ? 'text-ww-blue font-bold' : ''}
                  ${!sel && !today && inMonth ? 'text-slate-700 hover:bg-slate-100' : ''}
                  ${!inMonth ? 'text-slate-300' : ''}
                `}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
