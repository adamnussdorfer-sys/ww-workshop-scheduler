import { useState, useMemo, useCallback, useRef } from 'react';
import { AlertTriangle, Plus, Trash2, X, Filter } from 'lucide-react';
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { useApp } from '../context/AppContext';
import Checkbox from '../components/ui/Checkbox';
import MiniCalendar from '../components/ui/MiniCalendar';
import { buildConflictMap } from '../utils/conflictEngine';
import WorkshopPanel from '../components/panel/WorkshopPanel';

const TYPE_PILL_STYLES = {
  'Weekly Connection': 'bg-sky-100 text-sky-800',
  'All In': 'bg-fuchsia-100 text-fuchsia-800',
  'Special Event': 'bg-pink-100 text-pink-800',
  'Coaching Corner': 'bg-slate-200 text-slate-700',
  'Movement/Fitness': 'bg-violet-200 text-violet-800',
};

export default function DraftManager() {
  const { workshops, coaches, setWorkshops, toast } = useApp();

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [createPanelOpen, setCreatePanelOpen] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState(null);
  const [sortBy, setSortBy] = useState('date'); // 'date' | 'title' | 'coach'
  const [sortDir, setSortDir] = useState('asc');
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [fromCalOpen, setFromCalOpen] = useState(false);
  const [toCalOpen, setToCalOpen] = useState(false);
  const fromRef = useRef(null);
  const toRef = useRef(null);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  // Derived data
  const allDrafts = useMemo(
    () => workshops.filter((w) => w.status === 'Draft'),
    [workshops]
  );

  const draftWorkshops = useMemo(() => {
    let list = [...allDrafts];

    // Date filter
    if (dateFrom) {
      const from = startOfDay(dateFrom);
      list = list.filter((w) => !isBefore(parseISO(w.startTime), from));
    }
    if (dateTo) {
      const to = endOfDay(dateTo);
      list = list.filter((w) => !isAfter(parseISO(w.startTime), to));
    }

    // Sort
    list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'date') {
        cmp = new Date(a.startTime) - new Date(b.startTime);
      } else if (sortBy === 'title') {
        cmp = (a.title || '').localeCompare(b.title || '');
      } else if (sortBy === 'coach') {
        const nameA = coaches.find((c) => c.id === a.coachId)?.name || '';
        const nameB = coaches.find((c) => c.id === b.coachId)?.name || '';
        cmp = nameA.localeCompare(nameB);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [allDrafts, sortBy, sortDir, dateFrom, dateTo, coaches]);

  const conflictMap = useMemo(
    () => buildConflictMap(workshops, coaches),
    [workshops, coaches]
  );

  const coachMap = useMemo(
    () => new Map(coaches.map((c) => [c.id, c])),
    [coaches]
  );

  // Intersection of selectedIds and current draft IDs — prevents stale selection after publish
  const effectiveSelectedIds = useMemo(
    () => new Set([...selectedIds].filter((id) => draftWorkshops.some((w) => w.id === id))),
    [selectedIds, draftWorkshops]
  );

  const selectedConflictCount = useMemo(
    () => [...effectiveSelectedIds].filter((id) => conflictMap.get(id)?.hasConflicts).length,
    [effectiveSelectedIds, conflictMap]
  );

  // Checkbox helpers
  const allSelected =
    draftWorkshops.length > 0 && effectiveSelectedIds.size === draftWorkshops.length;
  const someSelected = effectiveSelectedIds.size > 0 && !allSelected;

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === draftWorkshops.length && draftWorkshops.every((w) => prev.has(w.id))) {
        return new Set();
      }
      return new Set(draftWorkshops.map((w) => w.id));
    });
  }, [draftWorkshops]);

  const toggleOne = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // Publish handler
  function handlePublishConfirm() {
    setWorkshops((prev) =>
      prev.map((w) =>
        effectiveSelectedIds.has(w.id) ? { ...w, status: 'Published' } : w
      )
    );
    const count = effectiveSelectedIds.size;
    setSelectedIds(new Set());
    setModalOpen(false);
    toast(`${count} workshop${count !== 1 ? 's' : ''} published`);
  }

  function handleDeleteConfirm() {
    const count = effectiveSelectedIds.size;
    setWorkshops((prev) => prev.filter((w) => !effectiveSelectedIds.has(w.id)));
    setSelectedIds(new Set());
    setDeleteModalOpen(false);
    toast(`${count} draft${count !== 1 ? 's' : ''} deleted`);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-4 flex-shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-ww-navy">Drafts</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {draftWorkshops.length === allDrafts.length
              ? `${allDrafts.length} drafts`
              : `${draftWorkshops.length} of ${allDrafts.length} drafts`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter button */}
          <button
            onClick={() => setFilterOpen((o) => !o)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-full border-[1.5px] transition-colors ${
              filterOpen || dateFrom || dateTo
                ? 'bg-ww-blue/5 border-ww-blue text-ww-blue'
                : 'bg-white border-border text-slate-600 hover:border-slate-400'
            }`}
          >
            <Filter size={14} />
            Dates
            {(dateFrom || dateTo) && (
              <span className="w-1.5 h-1.5 rounded-full bg-ww-blue" />
            )}
          </button>

          {/* Bulk actions — only when items selected */}
          {effectiveSelectedIds.size > 0 && (
            <>
              <button
                onClick={() => setDeleteModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 bg-white border-[1.5px] border-red-300 rounded-full hover:bg-red-50 transition-colors"
              >
                <Trash2 size={14} />
                Delete {effectiveSelectedIds.size}
              </button>
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-ww-blue rounded-full hover:bg-ww-blue/90 transition-colors"
              >
                Publish {effectiveSelectedIds.size}
                {selectedConflictCount > 0 && (
                  <span className="inline-flex items-center gap-1 bg-white/30 text-white text-xs px-1.5 py-0.5 rounded-full ml-2">
                    <AlertTriangle size={10} />
                    {selectedConflictCount}
                  </span>
                )}
              </button>
            </>
          )}

          {/* Add Draft button — hidden in bulk mode */}
          <button
            onClick={() => setCreatePanelOpen(true)}
            disabled={effectiveSelectedIds.size > 0}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-full transition-colors ${
              effectiveSelectedIds.size > 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-ww-blue text-white hover:bg-ww-blue/90'
            }`}
          >
            <Plus size={16} />
            Add Draft
          </button>
        </div>
      </div>

      {/* Date filter expandable row */}
      {filterOpen && (
        <div className="flex flex-wrap items-center gap-2 px-6 pb-3">
          <div className="relative" ref={fromRef}>
            <button
              onClick={() => { setFromCalOpen((o) => !o); setToCalOpen(false); }}
              className={`rounded-2xl border px-4 h-[42px] flex items-center bg-white transition-all cursor-pointer ${dateFrom ? 'border-ww-blue' : 'border-[#84ABFF]'}`}
            >
              <span className="text-[13px] font-semibold text-[#031AA1]">
                {dateFrom ? format(dateFrom, 'MM/dd/yyyy') : 'From'}
              </span>
            </button>
            {fromCalOpen && (
              <MiniCalendar
                selected={dateFrom}
                onSelect={(d) => setDateFrom(d)}
                onClose={() => setFromCalOpen(false)}
              />
            )}
          </div>
          <span className="text-sm text-slate-400">to</span>
          <div className="relative" ref={toRef}>
            <button
              onClick={() => { setToCalOpen((o) => !o); setFromCalOpen(false); }}
              className={`rounded-2xl border px-4 h-[42px] flex items-center bg-white transition-all cursor-pointer ${dateTo ? 'border-ww-blue' : 'border-[#84ABFF]'}`}
            >
              <span className="text-[13px] font-semibold text-[#031AA1]">
                {dateTo ? format(dateTo, 'MM/dd/yyyy') : 'To'}
              </span>
            </button>
            {toCalOpen && (
              <MiniCalendar
                selected={dateTo}
                onSelect={(d) => setDateTo(d)}
                onClose={() => setToCalOpen(false)}
              />
            )}
          </div>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(null); setDateTo(null); }}
              className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Clear dates"
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {/* Table / cards area */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="rounded-2xl border border-border bg-white overflow-hidden">

          {/* Desktop: table */}
          <div className="hidden md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-slate-50/60">
                  <th className="w-12 px-4 py-3">
                    <Checkbox
                      checked={allSelected}
                      indeterminate={someSelected}
                      onChange={toggleAll}
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none" onClick={() => handleSort('title')}>
                    Title {sortBy === 'title' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none" onClick={() => handleSort('coach')}>
                    Coach {sortBy === 'coach' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none" onClick={() => handleSort('date')}>
                    Day &amp; Time {sortBy === 'date' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Conflicts
                  </th>
                </tr>
              </thead>
              <tbody>
                {draftWorkshops.map((w) => (
                  <tr
                    key={w.id}
                    className="hover:bg-surface-2 transition-colors border-b border-border last:border-0 even:bg-slate-50/40 cursor-pointer"
                    onClick={() => setEditingWorkshop(w)}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={effectiveSelectedIds.has(w.id)}
                        onChange={() => toggleOne(w.id)}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-ww-navy">{w.title}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {coachMap.get(w.coachId)?.name ?? 'Unknown'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {format(parseISO(w.startTime), 'EEE MMM d, h:mm a')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${TYPE_PILL_STYLES[w.type] ?? 'bg-slate-100 text-slate-600'}`}>
                        {w.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {conflictMap.get(w.id)?.hasConflicts && (
                        <div className="flex items-start gap-1.5">
                          <AlertTriangle size={14} className="text-ww-coral flex-shrink-0 mt-0.5" />
                          <div className="text-xs text-red-600">
                            {conflictMap.get(w.id).conflicts.map((c, i) => (
                              <span key={i} className="block">{c.message}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: card list */}
          <div className="md:hidden">
            {/* Select-all header */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-slate-50/60">
              <Checkbox checked={allSelected} indeterminate={someSelected} onChange={toggleAll} />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Select all</span>
            </div>

            <div className="divide-y divide-border">
              {draftWorkshops.map((w) => (
                <div key={w.id} className="p-4 flex items-start gap-3 cursor-pointer hover:bg-surface-2 transition-colors" onClick={() => setEditingWorkshop(w)}>
                  <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={effectiveSelectedIds.has(w.id)}
                      onChange={() => toggleOne(w.id)}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-ww-navy truncate block">{w.title}</span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {coachMap.get(w.coachId)?.name ?? 'Unknown'} &middot; {format(parseISO(w.startTime), 'EEE MMM d, h:mm a')}
                    </p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${TYPE_PILL_STYLES[w.type] ?? 'bg-slate-100 text-slate-600'}`}>
                      {w.type}
                    </span>
                    {conflictMap.get(w.id)?.hasConflicts && (
                      <div className="flex items-start gap-1.5 mt-1.5">
                        <AlertTriangle size={12} className="text-ww-coral flex-shrink-0 mt-0.5" />
                        <div className="text-[11px] text-red-600">
                          {conflictMap.get(w.id).conflicts.map((c, i) => (
                            <span key={i} className="block">{c.message}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Empty state */}
        {draftWorkshops.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <p>No draft workshops</p>
            <p className="text-sm mt-1">All workshops have been published</p>
          </div>
        )}
      </div>

      {/* Create draft panel */}
      <WorkshopPanel
        isOpen={createPanelOpen}
        onClose={() => setCreatePanelOpen(false)}
        workshop={null}
        coaches={coaches}
        mode="create"
        slotContext={null}
        conflicts={[]}
      />

      {/* Edit draft panel */}
      <WorkshopPanel
        isOpen={!!editingWorkshop}
        onClose={() => setEditingWorkshop(null)}
        workshop={editingWorkshop}
        coaches={coaches}
        mode="view"
        slotContext={null}
        conflicts={editingWorkshop ? (conflictMap.get(editingWorkshop.id)?.conflicts ?? []) : []}
        key={editingWorkshop?.id}
      />

      {/* Publish confirmation modal */}
      {modalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-20"
            onClick={() => setModalOpen(false)}
          />
          <div className="fixed inset-0 z-30 flex items-center justify-center p-4">
            <div
              className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-semibold text-ww-navy">Publish Workshops</h2>
              <p className="mt-2 text-sm text-slate-600">
                You are about to publish {effectiveSelectedIds.size} workshop
                {effectiveSelectedIds.size !== 1 ? 's' : ''}.
              </p>

              {selectedConflictCount > 0 && (
                <div className="mt-4 flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <AlertTriangle
                    size={18}
                    className="text-orange-500 mt-0.5 flex-shrink-0"
                  />
                  <p className="text-sm text-orange-800">
                    {selectedConflictCount} of your selected workshops{' '}
                    {selectedConflictCount === 1 ? 'has' : 'have'} scheduling conflicts.
                    Publishing will not resolve these conflicts.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-border rounded-full hover:bg-surface-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePublishConfirm}
                  className="px-4 py-2 text-sm font-medium text-white bg-ww-blue rounded-full hover:bg-ww-blue/90 transition-colors"
                >
                  {selectedConflictCount > 0 ? 'Publish anyway' : 'Publish'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete confirmation modal */}
      {deleteModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-20"
            onClick={() => setDeleteModalOpen(false)}
          />
          <div className="fixed inset-0 z-30 flex items-center justify-center p-4">
            <div
              className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-semibold text-ww-navy">Delete Drafts</h2>
              <p className="mt-2 text-sm text-slate-600">
                Are you sure you want to delete {effectiveSelectedIds.size} draft
                {effectiveSelectedIds.size !== 1 ? 's' : ''}? This cannot be undone.
              </p>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-border rounded-full hover:bg-surface-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-full hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
