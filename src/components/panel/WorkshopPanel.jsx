import { X } from 'lucide-react';
import WorkshopForm from './WorkshopForm';

export default function WorkshopPanel({ isOpen, onClose, workshop, coaches, mode, slotContext, conflicts }) {
  // Dynamic panel title
  const panelTitle =
    mode === 'create' ? 'New Workshop' : (workshop?.title ?? 'Workshop Details');

  return (
    <>
      {/* Overlay backdrop — always in DOM, toggled via opacity and pointer-events */}
      <div
        className={`fixed inset-0 bg-black/30 z-20 transition-opacity duration-200 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panel — bottom sheet on mobile, right slide on desktop */}
      <div
        className={`fixed z-30 bg-slate-50 shadow-2xl flex flex-col transition-transform duration-200
          inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl
          md:inset-auto md:right-0 md:top-0 md:h-screen md:w-[400px] md:max-h-none md:rounded-none
          ${isOpen ? 'ease-panel-open' : 'ease-panel-close'}
          ${isOpen ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-y-0 md:translate-x-full'}`}
      >
        {/* Drag handle — mobile only */}
        <div className="md:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300" />
        </div>

        {/* Panel header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <h2 className="text-base font-semibold text-ww-navy">{panelTitle}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded hover:bg-surface-2"
            aria-label="Close panel"
          >
            <X size={18} />
          </button>
        </div>

        {/* Panel body — scrollable */}
        <div className="flex-1 overflow-y-auto p-5">
          {isOpen && (
            <WorkshopForm
              workshop={workshop}
              coaches={coaches}
              mode={mode}
              slotContext={slotContext}
              onClose={onClose}
              conflicts={conflicts}
              key={workshop?.id ?? 'create'}
            />
          )}
        </div>
      </div>
    </>
  );
}
