import { useState, useMemo, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useApp } from '../context/AppContext';
import { buildConflictMap } from '../utils/conflictEngine';

export default function DraftManager() {
  const { workshops, coaches, setWorkshops, toast } = useApp();

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [modalOpen, setModalOpen] = useState(false);

  // Derived data
  const draftWorkshops = useMemo(
    () => workshops.filter((w) => w.status === 'Draft'),
    [workshops]
  );

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

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-ww-navy">Draft Manager</h1>
          <p className="text-sm text-slate-500 mt-0.5">{draftWorkshops.length} drafts</p>
        </div>

        {/* Publish button */}
        <button
          onClick={() => setModalOpen(true)}
          disabled={effectiveSelectedIds.size === 0}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-ww-blue rounded-full hover:bg-ww-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Publish
          {selectedConflictCount > 0 && (
            <span className="bg-ww-coral text-white text-xs px-1.5 py-0.5 rounded-full ml-2">
              {selectedConflictCount} conflict{selectedConflictCount !== 1 ? 's' : ''}
            </span>
          )}
        </button>
      </div>

      {/* Table area */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  checked={allSelected}
                  onChange={toggleAll}
                  className="rounded border-slate-300 text-ww-blue focus:ring-ww-blue/30 cursor-pointer"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Coach
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Day &amp; Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Conflicts
              </th>
            </tr>
          </thead>
          <tbody>
            {draftWorkshops.map((w) => (
              <tr
                key={w.id}
                className="hover:bg-surface-2 transition-colors border-b border-border last:border-0"
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={effectiveSelectedIds.has(w.id)}
                    onChange={() => toggleOne(w.id)}
                    className="rounded border-slate-300 text-ww-blue focus:ring-ww-blue/30 cursor-pointer"
                  />
                </td>
                <td className="px-4 py-3 text-sm font-medium text-ww-navy">{w.title}</td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {coachMap.get(w.coachId)?.name ?? 'Unknown'}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {format(parseISO(w.startTime), 'EEE MMM d, h:mm a')}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{w.type}</td>
                <td className="px-4 py-3 text-center">
                  {conflictMap.get(w.id)?.hasConflicts && (
                    <span className="relative group inline-flex">
                      <AlertTriangle size={14} className="text-ww-coral" />
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-max max-w-xs px-3 py-2 text-xs text-white bg-ww-navy rounded-lg shadow-lg z-10 pointer-events-none">
                        {conflictMap.get(w.id).conflicts.map((c, i) => (
                          <span key={i} className="block">{c.message}</span>
                        ))}
                      </span>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Empty state */}
        {draftWorkshops.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <p>No draft workshops</p>
            <p className="text-sm mt-1">All workshops have been published</p>
          </div>
        )}
      </div>

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
    </div>
  );
}
