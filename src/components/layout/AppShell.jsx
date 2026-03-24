import { useState } from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

export default function AppShell({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const sidebarWidth = sidebarCollapsed ? '64px' : '240px';

  return (
    <>
      <div
        className="h-screen overflow-hidden grid grid-cols-1 md:grid-cols-[var(--sidebar-w,64px)_1fr]"
        style={{ '--sidebar-w': sidebarWidth, gridTemplateRows: '1fr' }}
      >
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(prev => !prev)}
        />
        <main className="overflow-auto bg-surface p-6 pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-6">
          {children}
        </main>
      </div>
      <BottomNav />
    </>
  );
}
