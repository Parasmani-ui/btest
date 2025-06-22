'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { MenuIcon, BellIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title = 'Dashboard',
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { userData } = useAuth();

  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-gray-800 shadow-sm border-b border-gray-700">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-200 hover:bg-gray-700 lg:hidden"
              >
                <MenuIcon className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-semibold text-white">{title}</h1>
            </div>

            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-200 relative">
                <BellIcon className="w-6 h-6" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-blue-500 ring-2 ring-gray-800" />
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium text-white">
                    {userData?.displayName}
                  </p>
                  <p className="text-xs text-gray-400 capitalize">{userData?.role}</p>
                </div>
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {userData?.displayName?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-900">
          <div className="container mx-auto px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}; 