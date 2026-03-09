import { useState } from 'react';
import { useLocation } from 'react-router';
import { Calendar, Users, FileText, PanelLeftClose, PanelLeftOpen, ChevronDown, ChevronUp } from 'lucide-react';
import NavItem from '../nav/NavItem';
import { useApp } from '../../context/AppContext';

// ── Static filter options ─────────────────────────────────────────────────────

const WORKSHOP_TYPES = ['All In', 'Coaching Corner', 'Movement/Fitness', 'Special Event', 'Weekly Connection'];
const WORKSHOP_STATUSES = ['Published', 'Draft', 'Cancelled'];
const WORKSHOP_MARKETS = ['US', 'CA', 'UK', 'ANZ'];

const NAV_ITEMS = [
  { to: '/', icon: Calendar, label: 'Schedule Calendar' },
  { to: '/roster', icon: Users, label: 'Coach Roster' },
  { to: '/drafts', icon: FileText, label: 'Draft Manager' },
];

// ── FilterSection sub-component ───────────────────────────────────────────────

/**
 * Collapsible accordion section containing a list of filter checkboxes.
 *
 * @param {{ title: string, items: {key: string, label: string}[], dimension: string,
 *           filters: Object, toggleFilter: Function, defaultOpen?: boolean,
 *           scrollable?: boolean }} props
 */
function FilterSection({ title, items, dimension, filters, toggleFilter, defaultOpen = true, scrollable = false }) {
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
          <span className="text-white/60 uppercase text-[10px] tracking-wider font-semibold">
            {title}
          </span>
          {activeCount > 0 && (
            <span className="bg-ww-blue text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
              {activeCount}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp size={12} className="text-white/40 shrink-0" />
        ) : (
          <ChevronDown size={12} className="text-white/40 shrink-0" />
        )}
      </button>

      {/* Checkbox list */}
      {isOpen && (
        <div className={scrollable ? 'max-h-48 overflow-y-auto' : 'max-h-32 overflow-y-auto'}>
          {items.map((item) => (
            <label
              key={item.key}
              className="flex items-center gap-2 px-1 py-1 cursor-pointer hover:bg-white/5 rounded-sm"
            >
              <input
                type="checkbox"
                checked={filters[dimension]?.includes(item.key) ?? false}
                onChange={() => toggleFilter(dimension, item.key)}
                className="accent-ww-blue shrink-0"
              />
              <span className="text-white/80 text-xs truncate">{item.label}</span>
            </label>
          ))}
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
    <aside className="col-start-1 row-start-1 row-span-2 bg-ww-navy flex flex-col overflow-hidden">
      {/* Logo / app name */}
      <div className="h-14 flex items-center px-4 shrink-0 border-b border-white/10">
        {collapsed ? (
          <span className="text-white font-bold text-base mx-auto select-none">WW</span>
        ) : (
          <span className="text-white font-semibold text-sm leading-tight select-none">
            WW Workshop<br />Scheduler
          </span>
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
        <div className="border-t border-white/10 px-2 py-3 overflow-y-auto flex-1">
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

      {/* Collapse toggle */}
      <div className="shrink-0 border-t border-white/10 p-2">
        <button
          type="button"
          onClick={onToggle}
          className="w-full flex items-center justify-center p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
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
