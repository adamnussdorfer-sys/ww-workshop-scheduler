import { NavLink } from 'react-router';
import { Calendar, Users, FileText } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', icon: Calendar, label: 'Calendar' },
  { to: '/roster', icon: Users, label: 'Roster' },
  { to: '/drafts', icon: FileText, label: 'Drafts' },
];

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border flex items-center justify-around h-14 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 text-[10px] px-4 ${
              isActive ? 'text-ww-blue font-semibold' : 'text-slate-400'
            }`
          }
        >
          <Icon size={20} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
