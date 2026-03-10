import { useEffect } from 'react';

/**
 * Attaches global keyboard shortcuts to the document.
 * Input guard prevents shortcuts from firing when the user is typing in a form field.
 *
 * @param {Object} handlers
 * @param {Function} handlers.onPrev - Navigate to previous period (ArrowLeft) — view-mode-aware
 * @param {Function} handlers.onNext - Navigate to next period (ArrowRight) — view-mode-aware
 * @param {Function} handlers.onToday - Jump to current period (T)
 * @param {Function} handlers.onClosePanel - Close the open panel (Escape)
 * @param {Function} handlers.onNewWorkshop - Open create-workshop with next available slot (N)
 * @param {boolean} handlers.isPanelOpen - Gate for Escape: only fires when panel is open
 */
export function useKeyboardShortcuts({ onPrev, onNext, onToday, onClosePanel, onNewWorkshop, isPanelOpen }) {
  useEffect(() => {
    const controller = new AbortController();

    document.addEventListener(
      'keydown',
      (e) => {
        // Input guard: never fire shortcuts when user is typing in a form field
        const tag = e.target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        if (e.target.isContentEditable) return;

        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            onPrev();
            break;
          case 'ArrowRight':
            e.preventDefault();
            onNext();
            break;
          case 't':
          case 'T':
            onToday();
            break;
          case 'Escape':
            if (isPanelOpen) onClosePanel();
            break;
          case 'n':
          case 'N':
            onNewWorkshop();
            break;
        }
      },
      { signal: controller.signal }
    );

    return () => controller.abort();
  }, [onPrev, onNext, onToday, onClosePanel, onNewWorkshop, isPanelOpen]);
}
