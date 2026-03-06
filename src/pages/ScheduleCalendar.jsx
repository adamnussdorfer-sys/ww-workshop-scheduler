import { startOfWeek, addDays } from 'date-fns';
import { useApp } from '../context/AppContext';
import CalendarGrid from '../components/calendar/CalendarGrid';

export default function ScheduleCalendar() {
  const { workshops, coaches } = useApp();

  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border flex-shrink-0">
        <h1 className="text-xl font-semibold text-ww-navy">Schedule Calendar</h1>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <CalendarGrid weekDays={weekDays} workshops={workshops} coaches={coaches} />
      </div>
    </div>
  );
}
