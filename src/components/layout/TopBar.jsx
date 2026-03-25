import { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router';
import { Bell, LogOut } from 'lucide-react';
import { AppContext } from '../../context/AppContext';

export default function TopBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { logout } = useContext(AppContext);

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
    <header className="col-start-2 row-start-1 h-14 bg-white border-b border-border flex items-center justify-between px-6">
      <div className="flex items-center">
        {/* Page title area — populated by child routes in later phases */}
      </div>

      <div className="flex items-center gap-4">
        {/* Notification bell with badge */}
        <button
          type="button"
          className="relative p-1.5 text-slate-500 hover:text-ww-navy transition-colors"
          aria-label="Notifications"
        >
          <Bell size={20} strokeWidth={1.75} />
          <span className="absolute top-0 right-0 min-w-[16px] h-4 bg-ww-coral text-white text-[10px] font-semibold rounded-full flex items-center justify-center px-1">
            3
          </span>
        </button>

        {/* User info */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 cursor-pointer rounded-lg hover:bg-slate-50 transition-colors p-1 -m-1"
          >
            <div className="w-8 h-8 rounded-full bg-ww-navy text-white text-xs font-semibold flex items-center justify-center select-none">
              KT
            </div>
            <span className="text-sm font-medium text-ww-navy">Kathleen Toth</span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 bg-white border border-border rounded-xl shadow-lg py-1 min-w-[160px] z-50">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-sm font-semibold text-ww-navy">Kathleen Toth</p>
                <p className="text-xs text-slate-400">kathleen@ww.com</p>
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
      </div>
    </header>
  );
}
