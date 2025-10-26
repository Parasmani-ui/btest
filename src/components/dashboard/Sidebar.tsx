'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  HomeIcon,
  UserIcon,
  CogIcon,
  LogOut,
  ShieldCheckIcon,
  GamepadIcon,
  ChartBarIcon,
  BuildingIcon,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { userData, logout } = useAuth();

  const userNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Profile', href: '/dashboard/profile', icon: UserIcon },
    { name: 'Game History', href: '/dashboard/history', icon: GamepadIcon },
  ];

  const adminNavigation = [
    { name: 'Admin Panel', href: '/admin', icon: ShieldCheckIcon },
    { name: 'User Management', href: '/admin/users', icon: UserIcon },
    { name: 'Organizations', href: '/admin/organizations', icon: BuildingIcon },
    { name: 'Game Analytics', href: '/admin/analytics', icon: ChartBarIcon },
    { name: 'Content Management', href: '/admin/content', icon: CogIcon },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center ml-8 mt-2">
            <Link href="/" className="flex items-center">
              <Image src="/img.png" alt="Parasmani Logo" width={80} height={80} className="cursor-pointer" priority/>
              {/* <span className="ml-2 text-xl font-bold text-white">Simulation</span> */}
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {/* User Navigation */}
            <div className="space-y-1">
              {userNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                    ${
                      isActive(item.href)
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }
                  `}
                  onClick={onClose}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Admin Navigation */}
            {userData?.role === 'admin' && (
              <>
                <div className="border-t border-gray-700 pt-4 mt-4">
                  <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Admin
                  </h3>
                  <div className="mt-2 space-y-1">
                    {adminNavigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`
                          flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                          ${
                            isActive(item.href)
                              ? 'bg-red-600 text-white'
                              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                          }
                        `}
                        onClick={onClose}
                      >
                        <item.icon className="w-5 h-5 mr-3" />
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            )}
          </nav>

          {/* User Info & Logout */}
          <div className="border-t border-gray-700 p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {userData?.displayName?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {userData?.displayName}
                </p>
                <p className="text-xs text-gray-400 truncate">{userData?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}; 