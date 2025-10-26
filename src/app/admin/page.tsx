'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import {
  UsersIcon,
  GamepadIcon,
  ChartBarIcon,
  CogIcon,
  AlertTriangleIcon,
  TrendingUpIcon,
  BuildingIcon
} from 'lucide-react';

export default function AdminPage() {
  const { userData } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeGames: 0,
    totalGames: 0,
    organizationName: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminStats();
  }, [userData]);

  const loadAdminStats = async () => {
    try {
      if (!userData) return;

      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const users = data.users || [];

        // Calculate stats
        const totalGames = users.reduce((sum: number, u: any) => sum + (u.gamesPlayed || 0), 0);
        const activeUsers = users.filter((u: any) => {
          const lastLogin = u.lastLoginAt ? new Date(u.lastLoginAt) : null;
          if (!lastLogin) return false;
          const daysSinceLogin = (Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceLogin <= 7; // Active if logged in within last 7 days
        }).length;

        setStats({
          totalUsers: users.length,
          activeGames: activeUsers,
          totalGames,
          organizationName: userData.organizationName || '',
        });
      }
    } catch (error) {
      console.error('Error loading admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const adminStats = [
    {
      name: userData?.role === 'group_admin' ? 'Organization Users' : 'Total Users',
      value: loading ? '...' : stats.totalUsers.toString(),
      icon: UsersIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Active Users (7 days)',
      value: loading ? '...' : stats.activeGames.toString(),
      icon: TrendingUpIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Total Games Played',
      value: loading ? '...' : stats.totalGames.toString(),
      icon: GamepadIcon,
      color: 'bg-purple-500',
    },
    {
      name: userData?.role === 'group_admin' ? 'Organization' : 'System Status',
      value: userData?.role === 'group_admin' ? (stats.organizationName || 'N/A') : 'Operational',
      icon: userData?.role === 'group_admin' ? BuildingIcon : AlertTriangleIcon,
      color: userData?.role === 'group_admin' ? 'bg-yellow-500' : 'bg-green-500',
    },
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'user_registered',
      title: 'New user registration: john.doe@example.com',
      time: '5 minutes ago',
      severity: 'info',
    },
    {
      id: 2,
      type: 'game_completed',
      title: 'High number of game completions detected',
      time: '12 minutes ago',
      severity: 'success',
    },
    {
      id: 3,
      type: 'system_alert',
      title: 'Database response time above threshold',
      time: '1 hour ago',
      severity: 'warning',
    },
    {
      id: 4,
      type: 'content_updated',
      title: 'Game content updated by admin',
      time: '2 hours ago',
      severity: 'info',
    },
  ];

  const quickActions = [
    {
      name: 'User Management',
      href: '/admin/users',
      icon: UsersIcon,
      description: 'View and manage user accounts',
      color: 'text-blue-400 bg-blue-900 bg-opacity-50',
    },
    {
      name: 'Game Analytics',
      href: '/admin/analytics',
      icon: ChartBarIcon,
      description: 'View game statistics and metrics',
      color: 'text-green-400 bg-green-900 bg-opacity-50',
    },
    {
      name: 'Content Management',
      href: '/admin/content',
      icon: CogIcon,
      description: 'Manage game content and settings',
      color: 'text-purple-400 bg-purple-900 bg-opacity-50',
    },
    {
      name: 'System Health',
      href: '/admin/system',
      icon: AlertTriangleIcon,
      description: 'Monitor system performance',
      color: 'text-red-400 bg-red-900 bg-opacity-50',
    },
  ];

  return (
    <ProtectedRoute requireAdmin>
      <DashboardLayout title="Admin Panel">
        <div className="space-y-8">
          {/* Admin Header */}
          <div className="bg-gradient-to-r from-red-600 to-pink-600 rounded-lg p-6 text-white">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <CogIcon className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-red-100 mt-1">
                  Monitor and manage the DetectAive platform
                </p>
              </div>
            </div>
          </div>

          {/* Admin Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {adminStats.map((stat) => (
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
                <div className="mt-4 flex items-center">
                  <span className={`text-sm font-medium ${
                    stat.changeType === 'increase' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-400 ml-2">from last week</span>
                </div>
              </div>
            ))}
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* System Activity */}
            <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-lg font-semibold text-white">System Activity</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.severity === 'success' ? 'bg-green-500' :
                        activity.severity === 'warning' ? 'bg-yellow-500' :
                        activity.severity === 'error' ? 'bg-red-500' : 'bg-blue-500'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">
                          {activity.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        activity.severity === 'success' ? 'bg-green-100 text-green-800' :
                        activity.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        activity.severity === 'error' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {activity.severity}
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
                  {quickActions.map((action) => (
                    <a
                      key={action.name}
                      href={action.href}
                      className="flex items-center p-4 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <div className={`${action.color} p-3 rounded-lg mr-4`}>
                        <action.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{action.name}</h3>
                        <p className="text-sm text-gray-400">{action.description}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 