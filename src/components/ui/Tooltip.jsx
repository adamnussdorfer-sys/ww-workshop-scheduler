import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

export default function Tooltip({ children, content }) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);

  const show = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + 6,
      left: rect.left + rect.width / 2,
    });
    setVisible(true);
  }, []);

  const hide = useCallback(() => setVisible(false), []);

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        className="inline-flex"
      >
        {children}
      </span>
      {visible &&
        createPortal(
          <div
            className="fixed z-[9999] -translate-x-1/2 bg-ww-navy text-white text-[11px] leading-snug rounded-md shadow-lg px-2.5 py-1.5 max-w-56 pointer-events-none"
            style={{ top: pos.top, left: pos.left }}
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
}
