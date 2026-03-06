import { Bell } from 'lucide-react';

export default function TopBar() {
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
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-ww-navy text-white text-xs font-semibold flex items-center justify-center select-none">
            KT
          </div>
          <span className="text-sm font-medium text-ww-navy">Kathleen Toth</span>
        </div>
      </div>
    </header>
  );
}
