import { useState } from 'react';
import Sidebar from './Sidebar';

export default function AppShell({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const sidebarWidth = sidebarCollapsed ? '64px' : '240px';

  return (
    <div
      className="h-screen grid overflow-hidden"
      style={{
        gridTemplateColumns: `${sidebarWidth} 1fr`,
        gridTemplateRows: '1fr',
      }}
    >
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(prev => !prev)}
      />
      <main className="overflow-auto bg-surface p-6">
        {children}
      </main>
    </div>
  );
}
