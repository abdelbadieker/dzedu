'use client';

import { useState } from 'react';
import Sidebar from '@/components/dashboard/sidebar';
import Navbar from '@/components/dashboard/navbar';

interface DashboardShellProps {
  userId: string;
  userName: string;
  userRole: string;
  children: React.ReactNode;
}

export default function DashboardShell({ userId, userName, userRole, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        role={userRole as any}
        userName={userName}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex flex-1 flex-col">
        <Navbar userName={userName} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
