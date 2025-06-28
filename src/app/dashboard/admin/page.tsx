'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useState, useEffect } from 'react';
import { getAllStats } from '@/lib/firestore';
import { DashboardStats } from '@/types/user';
import Link from 'next/link';
import { 
  UsersIcon, 
  GamepadIcon, 
  TrophyIcon, 
  ClockIcon,
  TrendingUpIcon,
  ActivityIcon,
  HomeIcon,
  DownloadIcon,
  BuildingIcon,
  StarIcon,
  ShieldIcon,
  Settings2Icon
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { userData } = useAuth();
  const [adminStats, setAdminStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userData?.role === 'admin') {
      loadAdminStats();
    }
  }, [userData]);

  const loadAdminStats = async () => {
    try {
      const stats = await getAllStats();
      setAdminStats(stats);
    } catch (error) {
      console.error('Error loading admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const exportToCSV = () => {
    if (!adminStats) return;
    
    const csvData = [
      ['Metric', 'Value'],
      ['Total Users', adminStats.totalUsers.toString()],
      ['Total Organizations', adminStats.totalOrganizations.toString()],
      ['Total Sessions', adminStats.totalSessions.toString()],
      ['Total Playtime (minutes)', adminStats.totalPlaytime.toString()],
      ['Average Session Duration (minutes)', adminStats.averageSessionDuration.toString()],
      ['', ''],
      ['Top Users by Playtime', ''],
      ['User Name', 'Total Playtime (minutes)'],
      ...adminStats.topPerformingUsers.slice(0, 10).map(user => [
        user.displayName,
        (user.totalPlaytime || 0).toString()
      ])
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin_dashboard_stats_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <ProtectedRoute requireAdmin={true}>
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  const stats = [
    {
      name: 'Total Users',
      value: adminStats?.totalUsers.toString() || '0',
      icon: UsersIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Organizations',
      value: adminStats?.totalOrganizations.toString() || '0',
      icon: BuildingIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Total Sessions',
      value: adminStats?.totalSessions.toString() || '0',
      icon: GamepadIcon,
      color: 'bg-yellow-500',
    },
    {
      name: 'Total Playtime',
      value: formatDuration(adminStats?.totalPlaytime || 0),
      icon: ClockIcon,
      color: 'bg-purple-500',
    },
  ];

  return (
    <ProtectedRoute requireAdmin={true}>
      <DashboardLayout title="Admin Dashboard">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-red-600 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <ShieldIcon className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">
                    Admin Dashboard
                  </h1>
                  <p className="text-red-100 mt-1">
                    System-wide analytics and user management
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={exportToCSV}
                  className="inline-flex items-center px-4 py-2 bg-red-800 bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
                >
                  <DownloadIcon className="w-5 h-5 mr-2" />
                  Export CSV
                </button>
                <Link
                  href="/admin/users"
                  className="inline-flex items-center px-4 py-2 bg-red-800 bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
                >
                  <Settings2Icon className="w-5 h-5 mr-2" />
                  Manage Users
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center px-4 py-2 bg-red-800 bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
                >
                  <HomeIcon className="w-5 h-5 mr-2" />
                  Home
                </Link>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.name} className="bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">{stat.name}</p>
                    <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">System Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Average Session Duration:</span>
                  <span className="text-white font-medium">
                    {formatDuration(adminStats?.averageSessionDuration || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Users per Organization:</span>
                  <span className="text-white font-medium">
                    {adminStats?.totalOrganizations 
                      ? Math.round((adminStats.totalUsers || 0) / adminStats.totalOrganizations) 
                      : 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Sessions per User:</span>
                  <span className="text-white font-medium">
                    {adminStats?.totalUsers 
                      ? Math.round((adminStats.totalSessions || 0) / adminStats.totalUsers) 
                      : 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Top Organizations</h3>
              <div className="space-y-3">
                {adminStats?.topPerformingOrganizations.slice(0, 5).map((org, index) => (
                  <div key={org.id} className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-6 h-6 bg-gray-600 rounded-full">
                      <span className="text-xs text-gray-300">{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{org.name}</p>
                      <p className="text-xs text-gray-400">{org.totalUsers} users</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-white">{formatDuration(org.totalPlaytime)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Game Type Analytics */}
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Game Type Analytics</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(adminStats?.gameTypeStats || {}).map(([gameType, data]) => (
                  <div key={gameType} className="bg-gray-700 rounded-lg p-4">
                    <h3 className="font-medium text-white mb-3 capitalize">{gameType.replace('-', ' ')}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Sessions:</span>
                        <span className="text-white">{data.totalSessions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Playtime:</span>
                        <span className="text-white">{formatDuration(data.totalPlaytime)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Avg Score:</span>
                        <span className="text-white">{data.averageScore.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">% of Total:</span>
                        <span className="text-white">
                          {((data.totalSessions / (adminStats?.totalSessions || 1)) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Performers */}
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Top Performing Users</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {adminStats?.topPerformingUsers.slice(0, 10).map((user, index) => (
                  <div key={user.uid} className="flex items-center space-x-4 p-4 bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-center w-8 h-8 bg-gray-600 rounded-full">
                      {index < 3 ? (
                        <StarIcon className={`w-4 h-4 ${
                          index === 0 ? 'text-yellow-400' : 
                          index === 1 ? 'text-gray-300' : 
                          'text-orange-400'
                        }`} />
                      ) : (
                        <span className="text-sm text-gray-400">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white truncate">{user.displayName}</h3>
                      <p className="text-sm text-gray-400 truncate">{user.email}</p>
                      {user.organizationName && (
                        <p className="text-xs text-gray-500">{user.organizationName}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">
                        {formatDuration(user.totalPlaytime || 0)}
                      </p>
                      <p className="text-xs text-gray-400">
                        Avg: {user.averageScore?.toFixed(1) || 0}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 