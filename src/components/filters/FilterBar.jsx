import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, SlidersHorizontal, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Checkbox from '../ui/Checkbox';

const WORKSHOP_TYPES = ['All In', 'Coaching Corner', 'Community', 'Education', 'GLP-1 & Diabetes', 'Life Stage', 'Mindset & Wellness', 'Movement & Fitness', 'Nutrition & Cooking', 'Real Room', 'Weekly Connection', 'Weekly Workshop'];
const WORKSHOP_STATUSES = ['Published', 'Draft'];
const WORKSHOP_MARKETS = ['US', 'CA', 'UK', 'ANZ'];
const ZOOM_TYPES = ['meeting', 'webinar'];

const TYPE_CHECKBOX_COLORS = {
  'Weekly Workshop': { checked: 'bg-sky-500 border-sky-500', unchecked: 'border-sky-400' },
  'Weekly Connection': { checked: 'bg-teal-500 border-teal-500', unchecked: 'border-teal-400' },
  'All In': { checked: 'bg-fuchsia-500 border-fuchsia-500', unchecked: 'border-fuchsia-400' },
  'GLP-1 & Diabetes': { checked: 'bg-emerald-500 border-emerald-500', unchecked: 'border-emerald-400' },
  'Movement & Fitness': { checked: 'bg-violet-500 border-violet-500', unchecked: 'border-violet-400' },
  'Nutrition & Cooking': { checked: 'bg-amber-500 border-amber-500', unchecked: 'border-amber-400' },
  'Mindset & Wellness': { checked: 'bg-rose-500 border-rose-500', unchecked: 'border-rose-400' },
  'Community': { checked: 'bg-orange-500 border-orange-500', unchecked: 'border-orange-400' },
  'Education': { checked: 'bg-indigo-500 border-indigo-500', unchecked: 'border-indigo-400' },
  'Real Room': { checked: 'bg-red-500 border-red-500', unchecked: 'border-red-400' },
  'Life Stage': { checked: 'bg-pink-500 border-pink-500', unchecked: 'border-pink-400' },
  'Coaching Corner': { checked: 'bg-slate-500 border-slate-500', unchecked: 'border-slate-400' },
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

function FilterDropdown({ title, items, dimension, filters, toggleFilter, colorMap = null, searchable = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);
  const searchInputRef = useRef(null);

  const activeCount = filters[dimension]?.length ?? 0;

  const filteredItems = useMemo(() => {
    if (!searchable || !search.trim()) return items;
    const q = search.toLowerCase();
    // When searching, show only matching selectable items (no headers)
    return items.filter((item) => !item.type && item.label.toLowerCase().includes(q));
  }, [items, search, searchable]);

  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

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
        <div className="absolute left-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 z-40 min-w-[180px]">
          {searchable && (
            <div className="px-2 pt-2 pb-1">
              <div className="flex items-center gap-1.5 px-2 py-1.5 border border-slate-200 rounded-md bg-slate-50">
                <Search size={12} className="text-slate-400 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="bg-transparent outline-none text-xs text-slate-700 w-full placeholder:text-slate-400"
                />
              </div>
            </div>
          )}
          <div className="py-1 max-h-56 overflow-y-auto">
            {filteredItems.length === 0 ? (
              <p className="px-3 py-2 text-xs text-slate-400">No results</p>
            ) : (
              filteredItems.map((item, idx) => {
                if (item.type === 'header') {
                  return (
                    <div key={`h-${idx}`} className="px-3 pt-2.5 pb-1 first:pt-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</span>
                    </div>
                  );
                }
                if (item.type === 'subheader') {
                  return (
                    <div key={`sh-${idx}`} className="px-3 pt-1.5 pb-0.5 pl-5">
                      <span className="text-[10px] font-semibold text-slate-400 tracking-wide">{item.label}</span>
                    </div>
                  );
                }
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
              })
            )}
          </div>
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

  const coachItems = useMemo(() => {
    const creators = coaches.filter((c) => c.group === 'Coach Creator').sort((a, b) => a.name.localeCompare(b.name));
    const clinicians = coaches.filter((c) => c.group === 'Expert' && c.subgroup === 'Clinician').sort((a, b) => a.name.localeCompare(b.name));
    const rds = coaches.filter((c) => c.group === 'Expert' && c.subgroup === 'RD').sort((a, b) => a.name.localeCompare(b.name));
    const guests = coaches.filter((c) => c.group === 'Expert' && c.subgroup === 'Guest / Partner').sort((a, b) => a.name.localeCompare(b.name));
    const legacy = coaches.filter((c) => c.group === 'Legacy Coach').sort((a, b) => a.name.localeCompare(b.name));
    return [
      { type: 'header', label: 'Coach Creators' },
      ...creators.map((c) => ({ key: c.id, label: c.name })),
      { type: 'header', label: 'Experts' },
      { type: 'subheader', label: 'Clinicians' },
      ...clinicians.map((c) => ({ key: c.id, label: c.name })),
      { type: 'subheader', label: "RD's" },
      ...rds.map((c) => ({ key: c.id, label: c.name })),
      { type: 'subheader', label: 'Guests / Partners' },
      ...guests.map((c) => ({ key: c.id, label: c.name })),
      { type: 'header', label: 'Legacy Coaches' },
      ...legacy.map((c) => ({ key: c.id, label: c.name })),
    ];
  }, [coaches]);
  const typeItems = WORKSHOP_TYPES.map((v) => ({ key: v, label: v }));
  const statusItems = WORKSHOP_STATUSES.map((v) => ({ key: v, label: v }));
  const marketItems = WORKSHOP_MARKETS.map((v) => ({ key: v, label: v }));
  const zoomTypeItems = ZOOM_TYPES.map((v) => ({ key: v, label: v === 'meeting' ? 'Zoom Meeting' : 'Zoom Webinar' }));

  const totalActive =
    (filters.coaches?.length ?? 0) +
    (filters.types?.length ?? 0) +
    (filters.statuses?.length ?? 0) +
    (filters.markets?.length ?? 0) +
    (filters.zoomTypes?.length ?? 0);

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
          searchable
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
        <FilterDropdown
          title="Zoom"
          items={zoomTypeItems}
          dimension="zoomTypes"
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
          <MobileFilterSection
            title="Zoom"
            items={zoomTypeItems}
            dimension="zoomTypes"
            filters={filters}
            toggleFilter={toggleFilter}
          />
        </div>
      )}
    </div>
  );
}
