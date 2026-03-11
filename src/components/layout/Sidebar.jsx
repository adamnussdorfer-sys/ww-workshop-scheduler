import { useLocation } from 'react-router';
import { Calendar, Users, FileText, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import NavItem from '../nav/NavItem';

const NAV_ITEMS = [
  { to: '/', icon: Calendar, label: 'Schedule Calendar' },
  { to: '/roster', icon: Users, label: 'Coach Roster' },
  { to: '/drafts', icon: FileText, label: 'Draft Manager' },
];

export default function Sidebar({ collapsed, onToggle }) {
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

      {/* Nav items */}
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

      {/* Spacer pushes user + toggle to bottom */}
      <div className="flex-1" />

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
