import { useState } from 'react';
import { startOfWeek, addWeeks, subWeeks, addDays, format, isSameWeek } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import CalendarGrid from '../components/calendar/CalendarGrid';

export default function ScheduleCalendar() {
  const { workshops, coaches } = useApp();

  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [viewMode, setViewMode] = useState('week');

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  const weekEnd = weekDays[6];
  const headerText =
    'Week of ' + format(currentWeekStart, 'MMM d') + ' \u2013 ' + format(weekEnd, 'MMM d, yyyy');
  const isCurrentWeek = isSameWeek(currentWeekStart, new Date(), { weekStartsOn: 1 });

  const prevWeek = () => setCurrentWeekStart((d) => subWeeks(d, 1));
  const nextWeek = () => setCurrentWeekStart((d) => addWeeks(d, 1));
  const goToToday = () =>
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const VIEW_TABS = [
    { label: 'Day', value: 'day' },
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Navigation bar */}
      <div className="flex items-center gap-3 py-3 px-4 bg-white border-b border-border flex-shrink-0">
        {/* Left section: prev arrow, week range, next arrow */}
        <button
          onClick={prevWeek}
          className="text-slate-600 hover:text-ww-navy p-1 rounded hover:bg-surface-2 transition-colors"
          aria-label="Previous week"
        >
          <ChevronLeft size={20} />
        </button>

        <span className="text-lg font-semibold text-ww-navy">{headerText}</span>

        <button
          onClick={nextWeek}
          className="text-slate-600 hover:text-ww-navy p-1 rounded hover:bg-surface-2 transition-colors"
          aria-label="Next week"
        >
          <ChevronRight size={20} />
        </button>

        {/* Today button */}
        <button
          onClick={goToToday}
          disabled={isCurrentWeek}
          className={`px-3 py-1.5 text-sm font-medium rounded border border-border hover:bg-surface-2 transition-colors ${
            isCurrentWeek ? 'opacity-50 cursor-default' : ''
          }`}
        >
          Today
        </button>

        {/* View toggle tabs — right-aligned */}
        <div className="flex gap-1 bg-surface rounded-lg p-1 ml-auto">
          {VIEW_TABS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setViewMode(value)}
              className={`px-4 py-1.5 text-sm font-medium rounded transition-colors ${
                viewMode === value
                  ? 'bg-ww-blue text-white'
                  : 'text-slate-600 hover:bg-surface-2'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar body */}
      <div className="flex-1 overflow-auto p-4">
        {viewMode === 'week' && (
          <CalendarGrid weekDays={weekDays} workshops={workshops} coaches={coaches} />
        )}
        {viewMode === 'day' && (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
            Day view coming soon
          </div>
        )}
        {viewMode === 'month' && (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
            Month view coming soon
          </div>
        )}
      </div>
    </div>
  );
}
