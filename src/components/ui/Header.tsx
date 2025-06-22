'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { LogIn, User } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, userData, logout, loading } = useAuth();

  if (loading) {
    return (
      <header className="bg-gray-900 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <Image src="/img.png" alt="DetectAive Logo" width={80} height={70} className="cursor-pointer" priority/>
              </Link>
            </div>
            <div className="flex items-center">
              <div className="animate-pulse h-8 w-20 bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-gray-900 shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image src="/img.png" alt="DetectAive Logo" width={50} height={50} className="cursor-pointer" priority/>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              // Authenticated user menu
              <div className="flex items-center space-x-4">
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-2 text-gray-300 hover:text-blue-400 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:block">{userData?.displayName}</span>
                </Link>
                <button
                  onClick={logout}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              // Unauthenticated user buttons
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center px-4 py-2 border border-gray-500 text-sm font-medium rounded-md text-gray-300 bg-transparent hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}; 