import { Calendar, Users, FileText, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import NavItem from '../nav/NavItem';

const NAV_ITEMS = [
  { to: '/', icon: Calendar, label: 'Schedule Calendar' },
  { to: '/roster', icon: Users, label: 'Coach Roster' },
  { to: '/drafts', icon: FileText, label: 'Draft Manager' },
];

export default function Sidebar({ collapsed, onToggle }) {
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

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 flex flex-col gap-1">
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
