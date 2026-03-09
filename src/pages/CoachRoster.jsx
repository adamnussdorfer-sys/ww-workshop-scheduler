import { useState, useMemo, useCallback, useEffect } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import CoachDetailPanel from '../components/panel/CoachDetailPanel';

const COACH_STATUS_BADGE = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-slate-100 text-slate-600',
};

function SortHeader({ label, sortKey, sort, onSort, align = 'left' }) {
  const isActive = sort.key === sortKey;
  return (
    <th className={`px-4 py-3 text-${align}`}>
      <button
        onClick={() => onSort(sortKey)}
        className="flex items-center gap-1 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-ww-navy transition-colors"
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
  const { coaches } = useApp();

  const [sort, setSort] = useState({ key: 'name', direction: 'asc' });
  const [search, setSearch] = useState('');
  const [selectedCoachId, setSelectedCoachId] = useState(null);

  const selectedCoach = coaches.find((c) => c.id === selectedCoachId) ?? null;
  const isPanelOpen = selectedCoachId !== null;

  const openCoach = useCallback((id) => setSelectedCoachId(id), []);
  const closePanel = useCallback(() => setSelectedCoachId(null), []);

  function handleSort(key) {
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );
  }

  const visibleCoaches = useMemo(() => {
    let rows = coaches;
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((c) => c.name.toLowerCase().includes(q));
    }
    return [...rows].sort((a, b) => {
      const aVal = a[sort.key];
      const bVal = b[sort.key];
      if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [coaches, search, sort]);

  // Escape key handler — closes panel when open, guards against input focus
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

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-ww-navy">Coach Roster</h1>
          <p className="text-sm text-slate-500 mt-0.5">{coaches.length} coaches</p>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search coaches..."
            className="pl-9 pr-8 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-ww-blue/30 focus:border-ww-blue w-64"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Table container — scrollable */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <SortHeader
                label="Name"
                sortKey="name"
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
                className="cursor-pointer hover:bg-surface-2 transition-colors border-b border-border last:border-0"
              >
                <td className="px-4 py-3 text-sm font-medium text-ww-navy">
                  {coach.name}
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

        {/* Empty search state */}
        {visibleCoaches.length === 0 && search.trim() && (
          <div className="text-center py-12 text-slate-500">
            <p className="mb-2">No coaches matching &ldquo;{search}&rdquo;</p>
            <button
              onClick={() => setSearch('')}
              className="text-sm text-ww-blue hover:underline"
            >
              Clear search
            </button>
          </div>
        )}
      </div>

      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/30 z-20 transition-opacity duration-200 ${
          isPanelOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closePanel}
      />

      {/* Slide panel */}
      <div
        className={`fixed right-0 top-0 h-screen w-[400px] bg-white z-30 shadow-2xl flex flex-col transition-transform duration-200 ease-in-out ${
          isPanelOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <h2 className="text-base font-semibold text-ww-navy">
            {selectedCoach?.name ?? 'Coach Details'}
          </h2>
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
          {isPanelOpen && <CoachDetailPanel coach={selectedCoach} />}
        </div>
      </div>
    </div>
  );
}
