import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const WRAPPER_BASE =
  'w-full rounded-2xl border px-4 transition-all flex flex-col justify-center bg-white';
const ACTIVE_STYLE = 'border-transparent shadow-[0_2px_2px_0_rgba(7,5,23,0.04)]';
const LABEL_STYLE = 'block text-[12px] font-normal text-slate-500';
const INPUT_STYLE =
  'w-full outline-none text-[14px] font-semibold bg-transparent';

export default function Input({ label, multiline, rows = 3, className, ...props }) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);
  const hasValue = props.value !== undefined && props.value !== '';
  const showLabel = focused || hasValue;

  const Tag = multiline ? 'textarea' : 'input';

  // Active: white bg + shadow, Populated: dark blue border, Empty: light blue border
  const stateClass = focused
    ? ACTIVE_STYLE
    : hasValue
      ? 'border-ww-blue'
      : 'border-[#84ABFF]';

  return (
    <div
      className={`${WRAPPER_BASE} ${multiline ? 'py-3' : 'h-[62px]'} ${stateClass}`}
      onClick={() => inputRef.current?.focus()}
    >
      {showLabel && <label className={LABEL_STYLE}>{label}</label>}
      <div className={`flex flex-col gap-1 ${showLabel ? 'mt-0.5' : ''}`}>
        <Tag
          ref={inputRef}
          {...props}
          {...(multiline ? { rows } : {})}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          placeholder={showLabel ? props.placeholder : props.placeholder || label}
          className={`${INPUT_STYLE} text-[#031373] placeholder:text-[#031373]/40 ${multiline ? 'resize-none' : ''}`}
        />
      </div>
    </div>
  );
}

export function Select({ label, value, onChange, options, className }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleMouseDown(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [open]);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? value;

  return (
    <div ref={ref} className={`w-full rounded-2xl border bg-white transition-all ${
      open ? 'border-ww-blue' : 'border-ww-blue'
    }`}>
      {/* Trigger row */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full h-[62px] px-4 flex items-center justify-between cursor-pointer"
      >
        <span className="text-[14px] font-semibold text-[#031373]">{selectedLabel}</span>
        <ChevronDown
          size={16}
          className={`text-[#031373] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Options */}
      {open && (
        <div className="px-4 pb-3">
          {options
            .filter((o) => o.value !== value)
            .map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className="w-full text-left py-2.5 text-[14px] font-semibold text-[#031373] hover:text-ww-blue cursor-pointer"
              >
                {o.label}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
