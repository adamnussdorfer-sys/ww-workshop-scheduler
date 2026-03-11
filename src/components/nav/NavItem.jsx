import { NavLink } from 'react-router';

export default function NavItem({ to, icon: Icon, label, collapsed }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        [
          'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
          collapsed ? 'justify-center' : '',
          isActive
            ? 'bg-ww-blue/10 text-ww-blue font-semibold'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
        ].join(' ')
      }
    >
      <Icon size={20} strokeWidth={1.75} className="shrink-0" />
      {!collapsed && <span className="text-sm font-medium">{label}</span>}
    </NavLink>
  );
}
