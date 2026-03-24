import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, SlidersHorizontal } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Checkbox from '../ui/Checkbox';

const WORKSHOP_TYPES = ['All In', 'Coaching Corner', 'Movement/Fitness', 'Special Event', 'Weekly Connection'];
const WORKSHOP_STATUSES = ['Published', 'Draft'];
const WORKSHOP_MARKETS = ['US', 'CA', 'UK', 'ANZ'];

const TYPE_CHECKBOX_COLORS = {
  'Weekly Connection': { checked: 'bg-sky-500 border-sky-500', unchecked: 'border-sky-400' },
  'All In': { checked: 'bg-fuchsia-500 border-fuchsia-500', unchecked: 'border-fuchsia-400' },
  'Special Event': { checked: 'bg-pink-500 border-pink-500', unchecked: 'border-pink-400' },
  'Coaching Corner': { checked: 'bg-slate-500 border-slate-500', unchecked: 'border-slate-400' },
  'Movement/Fitness': { checked: 'bg-violet-500 border-violet-500', unchecked: 'border-violet-400' },
};

function ColoredCheckbox({ checked, colors }) {
  return (
    <span
      className={`w-4 h-4 rounded-[3px] border-2 shrink-0 flex items-center justify-center transition-colors ${
        checked ? colors.checked : colors.unchecked
      }`}
    >
      {checked && <Check size={11} strokeWidth={3} className="text-white" />}
    </span>
  );
}

function FilterDropdown({ title, items, dimension, filters, toggleFilter, colorMap = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  const activeCount = filters[dimension]?.length ?? 0;

  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
          activeCount > 0
            ? 'bg-ww-blue/10 border-ww-blue/30 text-ww-blue'
            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
        }`}
      >
        <span>{title}</span>
        {activeCount > 0 && (
          <span className="bg-ww-blue text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
            {activeCount}
          </span>
        )}
        <ChevronDown size={12} className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-40 min-w-[180px] max-h-56 overflow-y-auto">
          {items.map((item) => {
            const isChecked = filters[dimension]?.includes(item.key) ?? false;
            const colors = colorMap?.[item.key];

            return (
              <label
                key={item.key}
                className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-slate-50"
              >
                {colors ? (
                  <>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleFilter(dimension, item.key)}
                      className="sr-only"
                    />
                    <ColoredCheckbox checked={isChecked} colors={colors} />
                  </>
                ) : (
                  <Checkbox
                    checked={isChecked}
                    onChange={() => toggleFilter(dimension, item.key)}
                  />
                )}
                <span className="text-slate-700 text-xs truncate">{item.label}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Mobile filter section — renders items as an inline checkbox list (no dropdown)
function MobileFilterSection({ title, items, dimension, filters, toggleFilter, colorMap = null }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{title}</p>
      <div className="flex flex-col gap-1">
        {items.map((item) => {
          const isChecked = filters[dimension]?.includes(item.key) ?? false;
          const colors = colorMap?.[item.key];
          return (
            <label key={item.key} className="flex items-center gap-2 cursor-pointer py-0.5">
              {colors ? (
                <>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleFilter(dimension, item.key)}
                    className="sr-only"
                  />
                  <ColoredCheckbox checked={isChecked} colors={colors} />
                </>
              ) : (
                <Checkbox
                  checked={isChecked}
                  onChange={() => toggleFilter(dimension, item.key)}
                />
              )}
              <span className="text-slate-700 text-xs">{item.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default function FilterBar() {
  const { coaches, filters, setFilters } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileRef = useRef(null);

  function toggleFilter(dimension, value) {
    setFilters((prev) => {
      const current = prev[dimension];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [dimension]: next };
    });
  }

  const coachItems = coaches.map((c) => ({ key: c.id, label: c.name }));
  const typeItems = WORKSHOP_TYPES.map((v) => ({ key: v, label: v }));
  const statusItems = WORKSHOP_STATUSES.map((v) => ({ key: v, label: v }));
  const marketItems = WORKSHOP_MARKETS.map((v) => ({ key: v, label: v }));

  const totalActive =
    (filters.coaches?.length ?? 0) +
    (filters.types?.length ?? 0) +
    (filters.statuses?.length ?? 0) +
    (filters.markets?.length ?? 0);

  // Close mobile panel on outside click
  useEffect(() => {
    if (!mobileOpen) return;
    function handleClick(e) {
      if (mobileRef.current && !mobileRef.current.contains(e.target)) setMobileOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [mobileOpen]);

  return (
    <div className="relative flex items-center" ref={mobileRef}>
      {/* Desktop: individual filter dropdowns */}
      <div className="hidden md:flex items-center gap-1.5">
        <FilterDropdown
          title="Coach"
          items={coachItems}
          dimension="coaches"
          filters={filters}
          toggleFilter={toggleFilter}
        />
        <FilterDropdown
          title="Type"
          items={typeItems}
          dimension="types"
          filters={filters}
          toggleFilter={toggleFilter}
          colorMap={TYPE_CHECKBOX_COLORS}
        />
        <FilterDropdown
          title="Status"
          items={statusItems}
          dimension="statuses"
          filters={filters}
          toggleFilter={toggleFilter}
        />
        <FilterDropdown
          title="Market"
          items={marketItems}
          dimension="markets"
          filters={filters}
          toggleFilter={toggleFilter}
        />
      </div>

      {/* Mobile: single "Filters" toggle button */}
      <button
        type="button"
        className={`md:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
          totalActive > 0
            ? 'bg-ww-blue/10 border-ww-blue/30 text-ww-blue'
            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
        }`}
        onClick={() => setMobileOpen((v) => !v)}
      >
        <SlidersHorizontal size={14} />
        <span>Filters</span>
        {totalActive > 0 && (
          <span className="bg-ww-blue text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
            {totalActive}
          </span>
        )}
      </button>

      {/* Mobile filter panel — dropdown below button */}
      {mobileOpen && (
        <div className="md:hidden absolute left-0 top-full mt-1 bg-white border border-border rounded-xl shadow-lg p-3 z-40 flex flex-col gap-3 w-56 max-h-[60vh] overflow-y-auto">
          <MobileFilterSection
            title="Coach"
            items={coachItems}
            dimension="coaches"
            filters={filters}
            toggleFilter={toggleFilter}
          />
          <MobileFilterSection
            title="Type"
            items={typeItems}
            dimension="types"
            filters={filters}
            toggleFilter={toggleFilter}
            colorMap={TYPE_CHECKBOX_COLORS}
          />
          <MobileFilterSection
            title="Status"
            items={statusItems}
            dimension="statuses"
            filters={filters}
            toggleFilter={toggleFilter}
          />
          <MobileFilterSection
            title="Market"
            items={marketItems}
            dimension="markets"
            filters={filters}
            toggleFilter={toggleFilter}
          />
        </div>
      )}
    </div>
  );
}
