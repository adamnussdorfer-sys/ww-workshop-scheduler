import { useState } from 'react';
import { useLocation } from 'react-router';
import { Calendar, Users, FileText, PanelLeftClose, PanelLeftOpen, ChevronDown, ChevronUp, Check } from 'lucide-react';
import NavItem from '../nav/NavItem';
import { useApp } from '../../context/AppContext';

// ── Static filter options ─────────────────────────────────────────────────────

const WORKSHOP_TYPES = ['All In', 'Coaching Corner', 'Movement/Fitness', 'Special Event', 'Weekly Connection'];
const WORKSHOP_STATUSES = ['Published', 'Draft'];
const WORKSHOP_MARKETS = ['US', 'CA', 'UK', 'ANZ'];

// Checked = filled bg + white check. Unchecked = colored border only.
const TYPE_CHECKBOX_COLORS = {
  'Weekly Connection': { checked: 'bg-sky-500 border-sky-500', unchecked: 'border-sky-400' },
  'All In': { checked: 'bg-fuchsia-500 border-fuchsia-500', unchecked: 'border-fuchsia-400' },
  'Special Event': { checked: 'bg-pink-500 border-pink-500', unchecked: 'border-pink-400' },
  'Coaching Corner': { checked: 'bg-slate-500 border-slate-500', unchecked: 'border-slate-400' },
  'Movement/Fitness': { checked: 'bg-violet-500 border-violet-500', unchecked: 'border-violet-400' },
};

const NAV_ITEMS = [
  { to: '/', icon: Calendar, label: 'Schedule Calendar' },
  { to: '/roster', icon: Users, label: 'Coach Roster' },
  { to: '/drafts', icon: FileText, label: 'Draft Manager' },
];

// ── ColoredCheckbox ──────────────────────────────────────────────────────────

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

// ── FilterSection sub-component ───────────────────────────────────────────────

function FilterSection({ title, items, dimension, filters, toggleFilter, defaultOpen = true, scrollable = false, colorMap = null }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const activeCount = filters[dimension]?.length ?? 0;

  return (
    <div className="mb-3">
      {/* Section header */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-1 py-1 group"
      >
        <div className="flex items-center gap-2">
          <span className="text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
            {title}
          </span>
          {activeCount > 0 && (
            <span className="bg-ww-blue text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
              {activeCount}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp size={12} className="text-slate-400 shrink-0" />
        ) : (
          <ChevronDown size={12} className="text-slate-400 shrink-0" />
        )}
      </button>

      {/* Checkbox list */}
      {isOpen && (
        <div className={scrollable ? 'max-h-48 overflow-y-auto' : 'max-h-32 overflow-y-auto'}>
          {items.map((item) => {
            const isChecked = filters[dimension]?.includes(item.key) ?? false;
            const colors = colorMap?.[item.key];

            return (
              <label
                key={item.key}
                className="flex items-center gap-2 px-1 py-1 cursor-pointer hover:bg-slate-50 rounded-sm"
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
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleFilter(dimension, item.key)}
                    className="accent-ww-blue shrink-0"
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

// ── Sidebar ───────────────────────────────────────────────────────────────────

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const { coaches, filters, setFilters } = useApp();

  // Filter sections are only shown on the Schedule Calendar route when expanded
  const showFilters = location.pathname === '/' && !collapsed;

  /**
   * Toggle a single value in and out of a filter dimension array.
   * Uses functional update form to avoid stale closure issues.
   */
  function toggleFilter(dimension, value) {
    setFilters((prev) => {
      const current = prev[dimension];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [dimension]: next };
    });
  }

  // Build coach items from AppContext coaches (all 18, including inactive)
  const coachItems = coaches.map((c) => ({ key: c.id, label: c.name }));

  // Build type/status/market items from static constants
  const typeItems = WORKSHOP_TYPES.map((v) => ({ key: v, label: v }));
  const statusItems = WORKSHOP_STATUSES.map((v) => ({ key: v, label: v }));
  const marketItems = WORKSHOP_MARKETS.map((v) => ({ key: v, label: v }));

  return (
    <aside className="bg-white flex flex-col overflow-hidden border-r border-border">
      {/* Logo */}
      <div className="h-14 flex items-center px-3 shrink-0 border-b border-border">
        {collapsed ? (
          <img src="/ww-glyph.svg" alt="WeightWatchers" className="h-6 mx-auto" />
        ) : (
          <img src="/ww-logo.svg" alt="WeightWatchers" className="h-6" />
        )}
      </div>

      {/* Nav items — shrink-0 so filter sections can claim the remaining flex space */}
      <nav className="shrink-0 py-4 px-2 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.to}
            to={item.to}
            icon={item.icon}
            label={item.label}
            collapsed={collapsed}
          />
        ))}
      </nav>

      {/* Filter sections — only on Schedule Calendar when sidebar is expanded */}
      {showFilters && (
        <div className="border-t border-border px-2 py-3 overflow-y-auto flex-1">
          <FilterSection
            title="Coach"
            items={coachItems}
            dimension="coaches"
            filters={filters}
            toggleFilter={toggleFilter}
            defaultOpen={true}
            scrollable={true}
          />
          <FilterSection
            title="Type"
            items={typeItems}
            dimension="types"
            filters={filters}
            toggleFilter={toggleFilter}
            defaultOpen={true}
            colorMap={TYPE_CHECKBOX_COLORS}
          />
          <FilterSection
            title="Status"
            items={statusItems}
            dimension="statuses"
            filters={filters}
            toggleFilter={toggleFilter}
            defaultOpen={true}
          />
          <FilterSection
            title="Market"
            items={marketItems}
            dimension="markets"
            filters={filters}
            toggleFilter={toggleFilter}
            defaultOpen={true}
          />

        </div>
      )}

      {/* User profile */}
      <div className="shrink-0 border-t border-border px-3 py-3">
        {collapsed ? (
          <div className="w-8 h-8 mx-auto rounded-full bg-ww-blue text-white text-xs font-semibold flex items-center justify-center select-none">
            KT
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-ww-blue text-white text-xs font-semibold flex items-center justify-center select-none shrink-0">
              KT
            </div>
            <span className="text-slate-700 text-sm font-medium truncate">Kathleen Toth</span>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <div className="shrink-0 border-t border-border p-2">
        <button
          type="button"
          onClick={onToggle}
          className="w-full flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <PanelLeftOpen size={18} strokeWidth={1.75} />
          ) : (
            <PanelLeftClose size={18} strokeWidth={1.75} />
          )}
        </button>
      </div>
    </aside>
  );
}
