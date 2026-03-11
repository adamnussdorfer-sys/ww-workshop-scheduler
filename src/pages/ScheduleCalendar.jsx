import { useState, useCallback, useMemo } from 'react';
import { startOfWeek, addWeeks, subWeeks, addDays, subDays, addMonths, subMonths, format, isSameWeek, isSameDay, isSameMonth, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import CalendarGrid from '../components/calendar/CalendarGrid';
import DayView from '../components/calendar/DayView';
import MonthView from '../components/calendar/MonthView';
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

  // General date state — derives week start for week view
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState('week');
  const [showOverlay, setShowOverlay] = useState(false);

  // Derive week start from currentDate
  const currentWeekStart = useMemo(
    () => startOfWeek(currentDate, { weekStartsOn: 1 }),
    [currentDate]
  );

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

  // View-mode-aware navigation callbacks
  const prevPeriod = useCallback(() => {
    setCurrentDate((d) => {
      if (viewMode === 'day') return subDays(d, 1);
      if (viewMode === 'month') return subMonths(d, 1);
      return subWeeks(d, 1);
    });
  }, [viewMode]);

  const nextPeriod = useCallback(() => {
    setCurrentDate((d) => {
      if (viewMode === 'day') return addDays(d, 1);
      if (viewMode === 'month') return addMonths(d, 1);
      return addWeeks(d, 1);
    });
  }, [viewMode]);

  const goToToday = useCallback(() => setCurrentDate(new Date()), []);

  const isCurrentPeriod = useMemo(() => {
    const now = new Date();
    if (viewMode === 'day') return isSameDay(currentDate, now);
    if (viewMode === 'month') return isSameMonth(currentDate, now);
    return isSameWeek(currentDate, now, { weekStartsOn: 1 });
  }, [viewMode, currentDate]);

  const openNewWithNextSlot = useCallback(() => {
    const slot = findNextAvailableSlot(workshops);
    openCreate(slot.date, slot.hour, slot.minute);
  }, [workshops, openCreate]);

  useKeyboardShortcuts({
    onPrev: prevPeriod,
    onNext: nextPeriod,
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

  // View-mode-aware header text
  const headerText = useMemo(() => {
    if (viewMode === 'day') return format(currentDate, 'EEEE, MMMM d, yyyy');
    if (viewMode === 'month') return format(currentDate, 'MMMM yyyy');
    return 'Week of ' + format(currentWeekStart, 'MMM d') + ' \u2013 ' + format(weekEnd, 'MMM d, yyyy');
  }, [viewMode, currentDate, currentWeekStart, weekEnd]);

  // View-mode-aware aria labels for nav buttons
  const periodLabel = viewMode === 'day' ? 'day' : viewMode === 'month' ? 'month' : 'week';

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

  const weekWorkshopsCount = useMemo(() => {
    return weekDays.reduce((count, day) => {
      return count + workshops.filter(
        (ws) => ws.status !== 'Cancelled' && isSameDay(parseISO(ws.startTime), day)
      ).length;
    }, 0);
  }, [workshops, weekDays]);

  // Day view empty state counts
  const dayMatchCount = useMemo(() => {
    if (viewMode !== 'day' || !anyFilterActive) return -1;
    return workshops.filter(
      (ws) =>
        ws.status !== 'Cancelled' &&
        isSameDay(parseISO(ws.startTime), currentDate) &&
        filteredIds.has(ws.id)
    ).length;
  }, [viewMode, anyFilterActive, workshops, filteredIds, currentDate]);

  const dayWorkshopsCount = useMemo(() => {
    if (viewMode !== 'day') return 0;
    return workshops.filter(
      (ws) => ws.status !== 'Cancelled' && isSameDay(parseISO(ws.startTime), currentDate)
    ).length;
  }, [viewMode, workshops, currentDate]);

  // Month view filter empty state count
  const monthMatchCount = useMemo(() => {
    if (viewMode !== 'month' || !anyFilterActive) return -1;
    return workshops.filter(
      (ws) =>
        ws.status !== 'Cancelled' &&
        isSameMonth(parseISO(ws.startTime), currentDate) &&
        filteredIds.has(ws.id)
    ).length;
  }, [viewMode, anyFilterActive, workshops, filteredIds, currentDate]);

  // Empty state helpers
  const singleCoachFilter =
    filters.coaches.length === 1 &&
    filters.types.length === 0 &&
    filters.statuses.length === 0 &&
    filters.markets.length === 0;

  const emptyMessage = singleCoachFilter
    ? `No workshops for ${coachMap.get(filters.coaches[0])?.name ?? 'this coach'} this week`
    : 'No matching workshops';

  const dayDateLabel = format(currentDate, 'EEEE, MMMM d');

  const clearFilters = () => setFilters({ coaches: [], types: [], statuses: [], markets: [] });

  // Period-aware stats for the stats bar
  const periodStats = useMemo(() => {
    const inPeriod = workshops.filter((ws) => {
      if (ws.status === 'Cancelled') return false;
      const d = parseISO(ws.startTime);
      if (viewMode === 'day') return isSameDay(d, currentDate);
      if (viewMode === 'month') return isSameMonth(d, currentDate);
      return weekDays.some((wd) => isSameDay(d, wd));
    });
    const total = inPeriod.length;
    const drafts = inPeriod.filter((ws) => ws.status === 'Draft').length;
    const conflicts = inPeriod.filter((ws) => conflictMap.get(ws.id)?.hasConflicts).length;
    return { total, drafts, conflicts };
  }, [workshops, viewMode, currentDate, weekDays, conflictMap]);

  // Day drill-down from week header or month cell
  const drillToDay = useCallback((day) => {
    setCurrentDate(day);
    setViewMode('day');
  }, []);

  const VIEW_TABS = [
    { label: 'Day', value: 'day' },
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Navigation bar */}
      <div className="flex items-center gap-3 py-3 px-4 flex-shrink-0">
        {/* Left: nav arrows + date */}
        <button
          onClick={prevPeriod}
          className="text-slate-600 hover:text-ww-navy p-1 rounded hover:bg-surface-2 transition-colors"
          aria-label={`Previous ${periodLabel}`}
        >
          <ChevronLeft size={20} />
        </button>

        <span className="text-lg font-semibold text-ww-navy">{headerText}</span>

        <button
          onClick={nextPeriod}
          className="text-slate-600 hover:text-ww-navy p-1 rounded hover:bg-surface-2 transition-colors"
          aria-label={`Next ${periodLabel}`}
        >
          <ChevronRight size={20} />
        </button>

        {/* Right: today, view toggle, create — pinned right */}
        <div className="flex items-center gap-3 ml-auto">
          <button
            onClick={goToToday}
            disabled={isCurrentPeriod}
            className={`px-3 py-1.5 text-sm font-medium rounded border border-border hover:bg-surface-2 transition-colors ${
              isCurrentPeriod ? 'opacity-50 cursor-default' : ''
            }`}
          >
            Today
          </button>

          <div className="flex items-center bg-surface-2 rounded-full p-1">
            {VIEW_TABS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setViewMode(value)}
                className={`px-5 py-1.5 text-sm font-medium rounded-full transition-all ${
                  viewMode === value
                    ? 'bg-white text-ww-navy shadow-sm ring-1 ring-border'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={openNewWithNextSlot}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full bg-ww-blue text-white hover:bg-ww-blue/90 transition-colors"
          >
            <Plus size={16} />
            Create Workshop
          </button>
        </div>
      </div>

      {/* Filter pills strip — only renders when filters are active */}
      {anyFilterActive && <FilterPills />}

      {/* Stats bar */}
      <div className="flex items-center px-4 py-2 flex-shrink-0">
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span><span className="font-semibold text-ww-navy">{periodStats.total}</span> workshops</span>
          {periodStats.conflicts > 0 && (
            <span><span className="font-semibold text-red-600">{periodStats.conflicts}</span> conflicts</span>
          )}
          {periodStats.drafts > 0 && (
            <span><span className="font-semibold text-yellow-600">{periodStats.drafts}</span> drafts</span>
          )}
        </div>
      </div>

      {/* Calendar body */}
      <div className="flex-1 overflow-auto p-4 flex flex-col">
        {viewMode === 'week' && (
          <CalendarGrid
            weekDays={weekDays}
            workshops={workshops}
            coaches={coaches}
            conflictMap={conflictMap}
            onWorkshopClick={openWorkshop}
            onSlotClick={openCreate}
            filteredIds={filteredIds}
            anyFilterActive={anyFilterActive}
            showOverlay={showOverlay}
            onDayClick={drillToDay}
          />
        )}
        {viewMode === 'day' && (
          anyFilterActive && dayMatchCount === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <p className="text-slate-600 text-sm font-medium mb-2">
                No matching workshops on {dayDateLabel}
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="text-ww-blue text-sm underline hover:text-ww-navy"
              >
                Clear filters
              </button>
            </div>
          ) : !anyFilterActive && dayWorkshopsCount === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
              <p className="text-slate-500 text-sm">No workshops on {dayDateLabel}.</p>
              <button
                type="button"
                onClick={openNewWithNextSlot}
                className="px-4 py-2 bg-ww-blue text-white text-sm font-medium rounded hover:bg-ww-navy transition-colors"
              >
                Create Workshop
              </button>
            </div>
          ) : (
            <DayView
              date={currentDate}
              workshops={workshops}
              coaches={coaches}
              conflictMap={conflictMap}
              onWorkshopClick={openWorkshop}
              onSlotClick={openCreate}
              filteredIds={filteredIds}
              anyFilterActive={anyFilterActive}
              showOverlay={showOverlay}
            />
          )
        )}
        {viewMode === 'month' && (
          anyFilterActive && monthMatchCount === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <p className="text-slate-600 text-sm font-medium mb-2">
                No matching workshops this month
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="text-ww-blue text-sm underline hover:text-ww-navy"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <MonthView
              currentDate={currentDate}
              workshops={workshops}
              coaches={coaches}
              conflictMap={conflictMap}
              onWorkshopClick={openWorkshop}
              onDayClick={drillToDay}
              filteredIds={filteredIds}
              anyFilterActive={anyFilterActive}
            />
          )
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
