import { useEffect } from 'react';
import { X } from 'lucide-react';
import WorkshopForm from './WorkshopForm';

export default function WorkshopPanel({ isOpen, onClose, workshop, coaches, mode, slotContext, conflicts }) {
  // Escape key listener — adds when open, cleans up via AbortController
  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    document.addEventListener(
      'keydown',
      (e) => {
        if (e.key === 'Escape') onClose();
      },
      { signal: controller.signal }
    );
    return () => controller.abort();
  }, [isOpen, onClose]);

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

      {/* Slide panel — always in DOM, translate-x-full when closed so exit animation plays */}
      <div
        className={`fixed right-0 top-0 h-screen w-[400px] bg-white z-30 shadow-2xl
          flex flex-col transition-transform duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
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
