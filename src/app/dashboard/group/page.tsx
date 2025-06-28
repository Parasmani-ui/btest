'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useState, useEffect } from 'react';
import { getGroupUsersWithGames } from '@/lib/firestore';
import { GroupStats } from '@/types/user';
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
  StarIcon
} from 'lucide-react';

export default function GroupDashboardPage() {
  const { userData } = useAuth();
  const [groupStats, setGroupStats] = useState<GroupStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userData?.organizationId) {
      loadGroupStats();
    }
  }, [userData]);

  const loadGroupStats = async () => {
    try {
      if (userData?.organizationId) {
        const stats = await getGroupUsersWithGames(userData.organizationId);
        setGroupStats(stats);
      }
    } catch (error) {
      console.error('Error loading group stats:', error);
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
    if (!groupStats) return;
    
    const csvData = [
      ['User Name', 'Email', 'Total Playtime (minutes)', 'Games Played'],
      ...groupStats.topUsers.map(user => [
        user.displayName,
        user.email,
        (user.totalPlaytime || 0).toString(),
        (user.gamesPlayed || 0).toString()
      ])
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${groupStats.organizationName}_group_stats.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <ProtectedRoute requireAdmin={false}>
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!userData?.organizationId) {
    return (
      <ProtectedRoute requireAdmin={false}>
        <DashboardLayout title="Group Dashboard">
          <div className="text-center py-12">
            <BuildingIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No Organization Found</h2>
            <p className="text-gray-400">You are not associated with any organization.</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const stats = [
    {
      name: 'Total Users',
      value: groupStats?.totalUsers.toString() || '0',
      icon: UsersIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Total Sessions',
      value: groupStats?.totalSessions.toString() || '0',
      icon: GamepadIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Total Playtime',
      value: formatDuration(groupStats?.totalPlaytime || 0),
      icon: ClockIcon,
      color: 'bg-yellow-500',
    },
    {
      name: 'Avg User Playtime',
      value: formatDuration(groupStats?.averageUserPlaytime || 0),
      icon: TrendingUpIcon,
      color: 'bg-purple-500',
    },
  ];

  return (
    <ProtectedRoute requireAdmin={false}>
      <DashboardLayout title="Group Dashboard">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <BuildingIcon className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">
                    {groupStats?.organizationName}
                  </h1>
                  <p className="text-green-100 mt-1">
                    Organization Dashboard - Track your team's progress
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={exportToCSV}
                  className="inline-flex items-center px-4 py-2 bg-green-800 bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
                >
                  <DownloadIcon className="w-5 h-5 mr-2" />
                  Export CSV
                </button>
                <Link
                  href="/"
                  className="inline-flex items-center px-4 py-2 bg-green-800 bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
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

          {/* Top Performers */}
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Top Performers</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {groupStats?.topUsers.map((user, index) => (
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
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">
                        {formatDuration(user.totalPlaytime || 0)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {user.gamesPlayed || 0} games
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Game Type Statistics */}
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Game Type Performance</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(groupStats?.gameTypeStats || {}).map(([gameType, data]) => (
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
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Recent Team Activity</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {groupStats?.recentActivity.slice(0, 10).map((session) => (
                  <div key={session.id} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${session.caseSolved ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">
                        {session.gameType.charAt(0).toUpperCase() + session.gameType.slice(1)} Session
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDuration(session.duration)} • {new Date(session.startedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      session.caseSolved
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {session.caseSolved ? 'Solved' : 'Incomplete'}
                    </span>
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