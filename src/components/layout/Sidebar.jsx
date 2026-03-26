import { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router';
import { Calendar, Users, FileText, PanelLeftClose, PanelLeftOpen, LogOut, Globe } from 'lucide-react';
import NavItem from '../nav/NavItem';
import { AppContext } from '../../context/AppContext';
import { TIMEZONE_OPTIONS, getTzAbbr } from '../../utils/timezone';

const NAV_ITEMS = [
  { to: '/', icon: Calendar, label: 'Calendar' },
  { to: '/roster', icon: Users, label: 'Coaches' },
  { to: '/drafts', icon: FileText, label: 'Drafts' },
];

export default function Sidebar({ collapsed, onToggle }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { logout, userTimezone, setUserTimezone } = useContext(AppContext);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  function handleSignOut() {
    setMenuOpen(false);
    logout();
    navigate('/login');
  }

  return (
    <aside className="hidden md:flex bg-white flex-col overflow-hidden border-r border-border">
      {/* Logo */}
      <div className="h-14 flex items-center px-3 shrink-0 border-b border-border">
        {collapsed ? (
          <img src="/ww-glyph.svg" alt="WeightWatchers" className="h-8 mx-auto" />
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
      <div className="shrink-0 border-t border-border px-3 py-3 relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="w-full cursor-pointer flex items-center gap-2 rounded-lg hover:bg-slate-50 transition-colors p-1 -m-1"
        >
          <div className="w-8 h-8 rounded-full bg-ww-blue text-white text-xs font-semibold flex items-center justify-center select-none shrink-0">
            KT
          </div>
          {!collapsed && (
            <span className="text-slate-700 text-sm font-medium truncate">Kathleen Toth</span>
          )}
        </button>

        {menuOpen && (
          <div className={`fixed ${collapsed ? 'left-[68px]' : 'left-[12px]'} bottom-[90px] bg-white border border-border rounded-xl shadow-lg py-1 min-w-[160px] z-50`}>
            <div className="px-3 py-2 border-b border-border">
              <p className="text-sm font-semibold text-ww-navy">Kathleen Toth</p>
              <p className="text-xs text-slate-400">kathleen@ww.com</p>
            </div>
            <div className="px-3 py-2 border-b border-border">
              <label className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5">
                <Globe size={12} />
                Timezone
              </label>
              <select
                value={userTimezone}
                onChange={(e) => setUserTimezone(e.target.value)}
                className="w-full text-sm text-ww-navy bg-slate-50 border border-border rounded-lg px-2 py-1.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-ww-blue"
              >
                {TIMEZONE_OPTIONS.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label} — {getTzAbbr(tz.value)}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-ww-coral transition-colors cursor-pointer"
            >
              <LogOut size={15} />
              Sign out
            </button>
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
