import { Check, Minus } from 'lucide-react';

export default function Checkbox({ checked, indeterminate, onChange, className = '' }) {
  return (
    <span
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      tabIndex={0}
      onClick={onChange}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          onChange?.(e);
        }
      }}
      className={`w-[18px] h-[18px] rounded-[4px] border-[2.5px] shrink-0 flex items-center justify-center transition-colors cursor-pointer ${
        checked || indeterminate
          ? 'bg-ww-blue border-ww-blue'
          : 'bg-white border-ww-blue'
      } ${className}`}
    >
      {checked && !indeterminate && (
        <Check size={13} strokeWidth={3} className="text-white" />
      )}
      {indeterminate && (
        <Minus size={13} strokeWidth={3} className="text-white" />
      )}
    </span>
  );
}
