'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useState, useEffect } from 'react';
import { getUserGames } from '@/lib/firestore';
import { UserStats } from '@/types/user';
import { useUserDataRefresh } from '@/hooks/useUserDataRefresh';
import Link from 'next/link';
import {
  UserIcon,
  GamepadIcon,
  TrophyIcon,
  ClockIcon,
  TrendingUpIcon,
  ActivityIcon,
  HomeIcon,
  PlayIcon,
  BookOpenIcon,
  AlertTriangleIcon,
  NewspaperIcon,
  LinkIcon,
  Building2Icon
} from 'lucide-react';

export default function UserDashboardPage() {
  const { userData } = useAuth();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { refresh: refreshUserData, isRefreshing } = useUserDataRefresh();

  const loadUserStats = async () => {
    try {
      if (userData?.uid) {
        const stats = await getUserGames(userData.uid);
        setUserStats(stats);
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
      // Fallback to default stats if there's an error
      setUserStats({
        totalPlaytime: 0,
        gamesPlayed: 0,
        casesCompleted: 0,
        averageScore: 0,
        recentSessions: [],
        gameTypeBreakdown: {}
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshData = async () => {
    await refreshUserData(); // Refresh auth context data
    await loadUserStats(); // Reload dashboard stats
  };

  useEffect(() => {
    if (userData?.uid) {
      loadUserStats();
    } else {
      setLoading(false);
    }
  }, [userData?.uid]);

  // Add visibility change handler to refresh data when user returns to dashboard
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && userData?.uid) {
        // Refresh data when user returns to the dashboard (e.g., after playing a game)
        console.log('Dashboard became visible, refreshing stats...');
        loadUserStats();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userData?.uid]);

  // Add focus listener to refresh when user navigates back to dashboard
  useEffect(() => {
    const handleFocus = () => {
      if (userData?.uid) {
        console.log('Dashboard gained focus, refreshing stats...');
        loadUserStats();
      }
    };

    const handlePageShow = () => {
      if (userData?.uid) {
        console.log('Dashboard page shown (back navigation), refreshing stats...');
        loadUserStats();
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('pageshow', handlePageShow);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [userData?.uid]);

  // Add periodic refresh every 30 seconds when dashboard is visible
  useEffect(() => {
    if (!userData?.uid) return;

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        console.log('Periodic refresh of stats...');
        loadUserStats();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [userData?.uid]);

  // Manual refresh function
  const handleRefresh = async () => {
    console.log('Manual refresh requested...');
    await handleRefreshData();
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    }
    return `${secs}s`;
  };

  const getGameTypeIcon = (gameType: string) => {
    switch (gameType) {
      case 'quick':
        return BookOpenIcon;
      case 'simulation':
        return GamepadIcon;
      case 'hospital':
        return AlertTriangleIcon;
      case 'fake-news':
        return NewspaperIcon;
      case 'chainfail':
        return LinkIcon;
      default:
        return GamepadIcon;
    }
  };

  const getGameTypeName = (gameType: string) => {
    switch (gameType) {
      case 'quick':
        return 'Quick Investigation';
      case 'simulation':
        return 'Complex Investigation';
      case 'hospital':
        return 'Crisis Response';
      case 'fake-news':
        return 'Information Scrutiny';
      case 'chainfail':
        return 'Chain Analysis';
      default:
        return gameType;
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  const stats = [
    {
      name: 'Games Played',
      value: userStats?.gamesPlayed.toString() || '0',
      icon: GamepadIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Cases Solved',
      value: userStats?.casesCompleted.toString() || '0',
      icon: TrophyIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Total Playtime',
      value: formatDuration(userStats?.totalPlaytime || 0),
      icon: ClockIcon,
      color: 'bg-yellow-500',
    },
    {
      name: 'Average Score',
      value: `${userStats?.averageScore?.toFixed(1) || '0'}%`,
      icon: TrendingUpIcon,
      color: 'bg-purple-500',
    },
  ];

  return (
    <ProtectedRoute>
      <DashboardLayout title="My Dashboard">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <UserIcon className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">
                    Welcome, {userData?.displayName}!
                  </h1>
                  <p className="text-blue-100 mt-1">
                    Track your progress and continue your learning journey.
                  </p>
                  {userData?.organizationName && (
                    <div className="flex items-center gap-2 mt-2 text-blue-200">
                      <Building2Icon className="w-4 h-4" />
                      <span className="text-sm">
                        Organization: <span className="font-semibold">{userData.organizationName}</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleRefresh}
                  className="inline-flex items-center px-4 py-2 bg-blue-800 bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors disabled:opacity-50"
                  disabled={loading || isRefreshing}
                >
                  <TrendingUpIcon className={`w-5 h-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </button>
                <Link
                  href="/"
                  className="inline-flex items-center px-4 py-2 bg-blue-800 bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
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

          {/* Game Type Breakdown */}
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Game Type Performance</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(userStats?.gameTypeBreakdown || {}).map(([gameType, data]) => {
                  const Icon = getGameTypeIcon(gameType);
                  return (
                    <div key={gameType} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <Icon className="w-6 h-6 text-blue-400" />
                        <h3 className="font-medium text-white">{getGameTypeName(gameType)}</h3>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Sessions:</span>
                          <span className="text-white">{data.sessions}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Playtime:</span>
                          <span className="text-white">{formatDuration(data.playtime)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Avg Score:</span>
                          <span className="text-white">{data.averageScore?.toFixed(1) || '0'}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-lg font-semibold text-white">Recent Sessions</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {userStats?.recentSessions.map((session) => (
                    <div key={session.id} className="flex items-start space-x-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${session.caseSolved ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">
                          {getGameTypeName(session.gameType)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDuration((session as any).elapsedTime || session.duration * 60)} • {new Date(session.startedAt).toLocaleDateString()}
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

            {/* Quick Actions */}
            <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 gap-4">
                  <Link
                    href="/game"
                    className="flex items-center p-4 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <GamepadIcon className="w-8 h-8 text-blue-500 mr-4" />
                    <div>
                      <h3 className="font-medium text-white">Start New Game</h3>
                      <p className="text-sm text-gray-400">Begin a new detective case</p>
                    </div>
                  </Link>
                  
                  <Link
                    href="/simulation"
                    className="flex items-center p-4 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <ActivityIcon className="w-8 h-8 text-green-500 mr-4" />
                    <div>
                      <h3 className="font-medium text-white">Practice Simulation</h3>
                      <p className="text-sm text-gray-400">Hone your skills in various scenarios</p>
                    </div>
                  </Link>
                  
                  <Link
                    href="/dashboard/profile"
                    className="flex items-center p-4 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <UserIcon className="w-8 h-8 text-purple-500 mr-4" />
                    <div>
                      <h3 className="font-medium text-white">Edit Profile</h3>
                      <p className="text-sm text-gray-400">Update your information</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 