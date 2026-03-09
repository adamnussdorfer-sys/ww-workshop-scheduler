import { useState, useCallback, useMemo } from 'react';
import { startOfWeek, addWeeks, subWeeks, addDays, format, isSameWeek, isSameDay, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import CalendarGrid from '../components/calendar/CalendarGrid';
import WorkshopPanel from '../components/panel/WorkshopPanel';
import FilterPills from '../components/filters/FilterPills';
import { buildConflictMap } from '../utils/conflictEngine';
import { getMatchedWorkshopIds, hasActiveFilters } from '../utils/filterEngine';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { findNextAvailableSlot } from '../utils/slotFinder';

export default function ScheduleCalendar() {
  const { workshops, coaches, filters, setFilters } = useApp();

  const conflictMap = useMemo(
    () => buildConflictMap(workshops, coaches),
    [workshops, coaches]
  );

  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [viewMode, setViewMode] = useState('week');

  // Panel state
  const [selectedWorkshopId, setSelectedWorkshopId] = useState(null);
  const [panelMode, setPanelMode] = useState('view'); // 'view' | 'create'
  const [slotContext, setSlotContext] = useState(null); // { date, hour, minute } | null

  // Derived panel values
  const isPanelOpen = selectedWorkshopId !== null || panelMode === 'create';
  const selectedWorkshop = workshops.find((w) => w.id === selectedWorkshopId) ?? null;

  // Panel callbacks
  const openWorkshop = useCallback((id) => {
    setSelectedWorkshopId(id);
    setPanelMode('view');
    setSlotContext(null);
  }, []);

  const closePanel = useCallback(() => {
    setSelectedWorkshopId(null);
    setPanelMode('view');
    setSlotContext(null);
  }, []);

  const openCreate = useCallback((date, hour, minute) => {
    setSelectedWorkshopId(null);
    setPanelMode('create');
    setSlotContext({ date, hour, minute });
  }, []);

  const prevWeek = useCallback(() => setCurrentWeekStart((d) => subWeeks(d, 1)), []);
  const nextWeek = useCallback(() => setCurrentWeekStart((d) => addWeeks(d, 1)), []);
  const goToToday = useCallback(
    () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 })),
    []
  );

  const openNewWithNextSlot = useCallback(() => {
    const slot = findNextAvailableSlot(workshops);
    openCreate(slot.date, slot.hour, slot.minute);
  }, [workshops, openCreate]);

  useKeyboardShortcuts({
    onPrevWeek: prevWeek,
    onNextWeek: nextWeek,
    onToday: goToToday,
    onClosePanel: closePanel,
    onNewWorkshop: openNewWithNextSlot,
    isPanelOpen,
  });

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i)),
    [currentWeekStart]
  );
  const weekEnd = weekDays[6];
  const headerText =
    'Week of ' + format(currentWeekStart, 'MMM d') + ' \u2013 ' + format(weekEnd, 'MMM d, yyyy');
  const isCurrentWeek = isSameWeek(currentWeekStart, new Date(), { weekStartsOn: 1 });

  // Filter computed values
  const anyFilterActive = useMemo(() => hasActiveFilters(filters), [filters]);
  const filteredIds = useMemo(() => getMatchedWorkshopIds(workshops, filters), [workshops, filters]);

  const coachMap = useMemo(() => new Map(coaches.map((c) => [c.id, c])), [coaches]);

  const weekMatchCount = useMemo(() => {
    if (!anyFilterActive) return -1; // Skip count when no filters active
    return weekDays.reduce((count, day) => {
      return count + workshops.filter(
        (ws) =>
          ws.status !== 'Cancelled' &&
          isSameDay(parseISO(ws.startTime), day) &&
          filteredIds.has(ws.id)
      ).length;
    }, 0);
  }, [anyFilterActive, workshops, filteredIds, weekDays]);

  // Empty state helpers
  const singleCoachFilter =
    filters.coaches.length === 1 &&
    filters.types.length === 0 &&
    filters.statuses.length === 0 &&
    filters.markets.length === 0;

  const emptyMessage = singleCoachFilter
    ? `No workshops for ${coachMap.get(filters.coaches[0])?.name ?? 'this coach'} this week`
    : 'No matching workshops';

  const clearFilters = () => setFilters({ coaches: [], types: [], statuses: [], markets: [] });

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

      {/* Filter pills strip — only renders when filters are active */}
      {anyFilterActive && <FilterPills />}

      {/* Calendar body */}
      <div className="flex-1 overflow-auto p-4">
        {viewMode === 'week' && (
          anyFilterActive && weekMatchCount === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <p className="text-slate-600 text-sm font-medium mb-2">{emptyMessage}</p>
              <button
                type="button"
                onClick={clearFilters}
                className="text-ww-blue text-sm underline hover:text-ww-navy"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <CalendarGrid
              weekDays={weekDays}
              workshops={workshops}
              coaches={coaches}
              conflictMap={conflictMap}
              onWorkshopClick={openWorkshop}
              onSlotClick={openCreate}
              filteredIds={filteredIds}
              anyFilterActive={anyFilterActive}
            />
          )
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

      {/* Workshop panel — always mounted so exit animation plays */}
      <WorkshopPanel
        isOpen={isPanelOpen}
        onClose={closePanel}
        workshop={selectedWorkshop}
        coaches={coaches}
        mode={panelMode}
        slotContext={slotContext}
        conflicts={conflictMap.get(selectedWorkshopId)?.conflicts ?? []}
      />
    </div>
  );
}
