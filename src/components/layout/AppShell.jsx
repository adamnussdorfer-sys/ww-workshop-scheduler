import { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function AppShell({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const sidebarWidth = sidebarCollapsed ? '64px' : '240px';

  return (
    <div
      className="h-screen grid overflow-hidden"
      style={{
        gridTemplateColumns: `${sidebarWidth} 1fr`,
        gridTemplateRows: '56px 1fr',
      }}
    >
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(prev => !prev)}
      />
      <TopBar />
      <main className="overflow-auto bg-surface p-6 col-start-2 row-start-2">
        {children}
      </main>
    </div>
  );
}
