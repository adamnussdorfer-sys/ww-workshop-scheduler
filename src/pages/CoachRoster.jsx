import { useState, useMemo, useCallback, useEffect } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, X, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import CoachDetailPanel from '../components/panel/CoachDetailPanel';
import CoachForm from '../components/panel/CoachForm';

const COACH_STATUS_BADGE = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-slate-100 text-slate-600',
};

const TZ_SHORT = {
  'America/New_York': 'ET',
  'America/Chicago': 'CT',
  'America/Denver': 'MT',
  'America/Los_Angeles': 'PT',
};

function SortHeader({ label, sortKey, sort, onSort, align = 'left' }) {
  const isActive = sort.key === sortKey;
  return (
    <th className={`px-4 py-3 text-${align}`}>
      <button
        onClick={() => onSort(sortKey)}
        className={`flex items-center gap-1 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-ww-navy transition-colors ${align === 'center' ? 'mx-auto' : ''}`}
      >
        {label}
        {isActive ? (
          sort.direction === 'asc' ? (
            <ChevronUp size={12} />
          ) : (
            <ChevronDown size={12} />
          )
        ) : (
          <ChevronsUpDown size={12} className="text-slate-300" />
        )}
      </button>
    </th>
  );
}

export default function CoachRoster() {
  const { coaches, setCoaches, toast } = useApp();

  const [sort, setSort] = useState({ key: 'name', direction: 'asc' });
  const [selectedCoachId, setSelectedCoachId] = useState(null);
  const [panelMode, setPanelMode] = useState('view'); // 'view' | 'create' | 'edit'

  const selectedCoach = coaches.find((c) => c.id === selectedCoachId) ?? null;
  const isPanelOpen = selectedCoachId !== null || panelMode === 'create';

  const openCoach = useCallback((id) => {
    setSelectedCoachId(id);
    setPanelMode('view');
  }, []);

  const closePanel = useCallback(() => {
    setSelectedCoachId(null);
    setPanelMode('view');
  }, []);

  const openCreate = useCallback(() => {
    setSelectedCoachId(null);
    setPanelMode('create');
  }, []);

  const openEdit = useCallback(() => {
    setPanelMode('edit');
  }, []);

  const handleRemove = useCallback(() => {
    if (!selectedCoachId) return;
    const name = selectedCoach?.name ?? 'Coach';
    setCoaches((prev) => prev.filter((c) => c.id !== selectedCoachId));
    closePanel();
    toast(`Removed ${name}`);
  }, [selectedCoachId, selectedCoach, setCoaches, closePanel, toast]);

  function handleSort(key) {
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );
  }

  const visibleCoaches = useMemo(() => {
    return [...coaches].sort((a, b) => {
      const aVal = a[sort.key];
      const bVal = b[sort.key];
      if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [coaches, sort]);

  // Escape key handler
  useEffect(() => {
    const controller = new AbortController();

    document.addEventListener(
      'keydown',
      (e) => {
        if (e.key !== 'Escape') return;
        if (!isPanelOpen) return;

        const tag = document.activeElement?.tagName?.toLowerCase();
        const isEditable =
          tag === 'input' ||
          tag === 'textarea' ||
          tag === 'select' ||
          document.activeElement?.isContentEditable;

        if (isEditable) return;

        closePanel();
      },
      { signal: controller.signal }
    );

    return () => controller.abort();
  }, [isPanelOpen, closePanel]);

  const panelTitle =
    panelMode === 'create'
      ? 'New Coach'
      : panelMode === 'edit'
      ? 'Edit Coach'
      : (selectedCoach?.name ?? 'Coach Details');

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-ww-navy">Coaches</h1>
          <p className="text-sm text-slate-500 mt-0.5">{coaches.length} coaches</p>
        </div>

        {/* Add Coach button */}
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-full bg-ww-blue text-white hover:bg-ww-blue/90 transition-colors"
        >
          <Plus size={16} />
          Add Coach
        </button>
      </div>

      {/* Table / cards container */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="rounded-2xl border border-border bg-white overflow-hidden">
          {/* Desktop: table */}
          <div className="hidden md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-slate-50/60">
                  <SortHeader
                    label="Name"
                    sortKey="name"
                    sort={sort}
                    onSort={handleSort}
                    align="left"
                  />
                  <SortHeader
                    label="Email"
                    sortKey="email"
                    sort={sort}
                    onSort={handleSort}
                    align="left"
                  />
                  <SortHeader
                    label="Timezone"
                    sortKey="timezone"
                    sort={sort}
                    onSort={handleSort}
                    align="left"
                  />
                  <SortHeader
                    label="Workshops"
                    sortKey="workshopsThisWeek"
                    sort={sort}
                    onSort={handleSort}
                    align="center"
                  />
                  <SortHeader
                    label="Status"
                    sortKey="status"
                    sort={sort}
                    onSort={handleSort}
                    align="left"
                  />
                </tr>
              </thead>
              <tbody>
                {visibleCoaches.map((coach) => (
                  <tr
                    key={coach.id}
                    onClick={() => openCoach(coach.id)}
                    className="cursor-pointer hover:bg-surface-2 transition-colors border-b border-border last:border-0 even:bg-slate-50/40"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-ww-navy">
                      {coach.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {coach.email}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {TZ_SHORT[coach.timezone] ?? coach.timezone}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 text-center">
                      {coach.workshopsThisWeek}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          COACH_STATUS_BADGE[coach.status] ?? 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {coach.status.charAt(0).toUpperCase() + coach.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: card list */}
          <div className="md:hidden divide-y divide-border">
            {visibleCoaches.map((coach) => (
              <div
                key={coach.id}
                onClick={() => openCoach(coach.id)}
                className="flex items-center justify-between p-4 cursor-pointer active:bg-surface-2"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-ww-navy">{coach.name}</span>
                  <span className="text-xs text-slate-500">{coach.email}</span>
                  <span className="text-xs text-slate-500">
                    {TZ_SHORT[coach.timezone] ?? coach.timezone} · {coach.workshopsThisWeek} workshops this week
                  </span>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    COACH_STATUS_BADGE[coach.status] ?? 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {coach.status.charAt(0).toUpperCase() + coach.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/30 z-20 transition-opacity duration-200 ${
          isPanelOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closePanel}
      />

      {/* Slide panel — bottom sheet on mobile, right slide on desktop */}
      <div
        className={`fixed z-30 bg-slate-50 shadow-2xl flex flex-col transition-transform duration-200 ease-in-out
          inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl
          md:inset-auto md:right-0 md:top-0 md:h-screen md:w-[400px] md:max-h-none md:rounded-none
          ${isPanelOpen ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-y-0 md:translate-x-full'}`}
      >
        {/* Drag handle — mobile only */}
        <div className="md:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300" />
        </div>

        {/* Panel header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <h2 className="text-base font-semibold text-ww-navy">{panelTitle}</h2>
          <button
            onClick={closePanel}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded hover:bg-surface-2"
            aria-label="Close panel"
          >
            <X size={18} />
          </button>
        </div>

        {/* Panel body — scrollable */}
        <div className="flex-1 overflow-y-auto p-5">
          {isPanelOpen && panelMode === 'view' && (
            <CoachDetailPanel
              coach={selectedCoach}
              onEdit={openEdit}
              onRemove={handleRemove}
            />
          )}
          {isPanelOpen && (panelMode === 'create' || panelMode === 'edit') && (
            <CoachForm
              coach={selectedCoach}
              mode={panelMode}
              onClose={closePanel}
              key={selectedCoach?.id ?? 'create'}
            />
          )}
        </div>
      </div>
    </div>
  );
}
