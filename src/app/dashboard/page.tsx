'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (userData) {
        // Redirect based on user role
        switch (userData.role) {
          case 'admin':
            router.push('/dashboard/admin');
            break;
          case 'group_admin':
            router.push('/dashboard/group');
            break;
          case 'user':
          default:
            router.push('/dashboard/user');
            break;
        }
      } else {
        // If userData is not loaded but user is authenticated, default to user dashboard
        router.push('/dashboard/user');
      }
    }
  }, [userData, loading, router]);

  // Show loading while redirecting
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-white mt-4">Redirecting to your dashboard...</p>
        </div>
      </div>
    </ProtectedRoute>
  );
} 