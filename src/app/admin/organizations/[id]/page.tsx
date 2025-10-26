'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth } from '@/lib/firebase';
import {
  BuildingIcon,
  UsersIcon,
  GamepadIcon,
  TrendingUpIcon,
  ClockIcon,
  FileTextIcon,
  FileSpreadsheetIcon,
  SearchIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  EyeIcon,
  ArrowLeftIcon,
  ActivityIcon,
  TargetIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface UserData {
  uid: string;
  displayName: string;
  email: string;
  role: string;
  organizationId?: string;
  organizationName?: string;
  gamesPlayed: number;
  casesCompleted: number;
  averageScore: number;
  totalPlaytime: number;
  lastLoginAt?: string;
  createdAt?: string;
}

interface OrganizationStats {
  totalUsers: number;
  activeUsers: number;
  totalGames: number;
  totalCasesCompleted: number;
  averageScore: number;
  totalPlaytime: number;
  completionRate: number;
}

export default function OrganizationDetailPage() {
  const { userData } = useAuth();
  const router = useRouter();
  const params = useParams();
  const organizationId = params?.id as string;

  const [organizationName, setOrganizationName] = useState('');
  const [users, setUsers] = useState<UserData[]>([]);
  const [stats, setStats] = useState<OrganizationStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalGames: 0,
    totalCasesCompleted: 0,
    averageScore: 0,
    totalPlaytime: 0,
    completionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (organizationId) {
      loadOrganizationData();
    }
  }, [organizationId]);

  const getAuthToken = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    return await user.getIdToken();
  };

  const loadOrganizationData = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();

      // Fetch all users with recalculated stats
      const response = await fetch('/api/admin/users?recalculateStats=true', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to load users');

      const data = await response.json();
      const allUsers = data.users || [];

      // Filter users for this organization
      const orgUsers = allUsers.filter((user: any) =>
        user.organizationId === organizationId
      );

      if (orgUsers.length === 0) {
        toast.error('No users found in this organization');
        setLoading(false);
        return;
      }

      // Get organization name from first user
      const orgName = orgUsers[0]?.organizationName || organizationId;
      setOrganizationName(orgName);

      // Calculate organization statistics
      let totalGames = 0;
      let totalCasesCompleted = 0;
      let totalPlaytime = 0;
      let totalScore = 0;
      let usersWithScores = 0;
      let activeUsers = 0;

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      orgUsers.forEach((user: any) => {
        totalGames += user.gamesPlayed || 0;
        totalCasesCompleted += user.casesCompleted || 0;
        totalPlaytime += user.totalPlaytime || 0;

        if (user.averageScore && user.averageScore > 0) {
          totalScore += user.averageScore;
          usersWithScores += 1;
        }

        // Check if user is active (logged in within last 7 days)
        if (user.lastLoginAt) {
          const lastLogin = new Date(user.lastLoginAt);
          if (lastLogin >= sevenDaysAgo) {
            activeUsers += 1;
          }
        }
      });

      const avgScore = usersWithScores > 0 ? totalScore / usersWithScores : 0;
      const completionRate = totalGames > 0 ? (totalCasesCompleted / totalGames) * 100 : 0;

      setStats({
        totalUsers: orgUsers.length,
        activeUsers,
        totalGames,
        totalCasesCompleted,
        averageScore: avgScore,
        totalPlaytime,
        completionRate,
      });

      setUsers(orgUsers);
    } catch (error: any) {
      console.error('Error loading organization data:', error);
      toast.error(error.message || 'Failed to load organization data');
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = (userId: string) => {
    router.push(`/admin/users/${userId}`);
  };

  const handleExportPDF = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`/api/admin/reports/organization/${organizationId}?format=pdf`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      a.download = filenameMatch ? filenameMatch[1] : 'organization_report.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('PDF report downloaded successfully');
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      toast.error(error.message || 'Failed to generate PDF');
    }
  };

  const handleExportExcel = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`/api/admin/reports/organization/${organizationId}?format=xlsx`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate Excel');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      a.download = filenameMatch ? filenameMatch[1] : 'organization_report.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Excel report downloaded successfully');
    } catch (error: any) {
      console.error('Error generating Excel:', error);
      toast.error(error.message || 'Failed to generate Excel');
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredUsers = users.filter((user) =>
    user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <ProtectedRoute requireAdmin>
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAdmin>
      <DashboardLayout title={organizationName}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin/organizations')}
                className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors border border-gray-700"
                title="Back to Organizations"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <BuildingIcon className="w-8 h-8 text-blue-500" />
                  <h1 className="text-2xl font-bold text-white">{organizationName}</h1>
                </div>
                <p className="text-gray-400 mt-1">Organization Details & User Management</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportPDF}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <FileTextIcon className="w-4 h-4 mr-2" />
                Export PDF
              </button>
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
              >
                <FileSpreadsheetIcon className="w-4 h-4 mr-2" />
                Export Excel
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Users</p>
                  <p className="text-3xl font-bold text-white mt-2">{stats.totalUsers}</p>
                  <p className="text-sm text-green-400 mt-1">
                    {stats.activeUsers} active (7 days)
                  </p>
                </div>
                <UsersIcon className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Games</p>
                  <p className="text-3xl font-bold text-white mt-2">{stats.totalGames}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {stats.totalCasesCompleted} completed
                  </p>
                </div>
                <GamepadIcon className="w-8 h-8 text-purple-500" />
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Average Score</p>
                  <p className="text-3xl font-bold text-white mt-2">{stats.averageScore.toFixed(1)}%</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {stats.completionRate.toFixed(1)}% completion
                  </p>
                </div>
                <TargetIcon className="w-8 h-8 text-yellow-500" />
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Playtime</p>
                  <p className="text-3xl font-bold text-white mt-2">{formatDuration(stats.totalPlaytime)}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {stats.totalUsers > 0 ? formatDuration(Math.floor(stats.totalPlaytime / stats.totalUsers)) : '0s'} avg/user
                  </p>
                </div>
                <ClockIcon className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Organization Members</h2>
              <p className="text-sm text-gray-400 mt-1">
                {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} found
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">User</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">Games</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">Completed</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">Avg Score</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">Playtime</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">Last Login</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredUsers.map((user) => {
                    const isActive = user.lastLoginAt &&
                      (Date.now() - new Date(user.lastLoginAt).getTime()) / (1000 * 60 * 60 * 24) <= 7;

                    return (
                      <tr key={user.uid} className="hover:bg-gray-700">
                        <td className="py-4 px-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-white">{user.displayName}</p>
                              {isActive && (
                                <span className="flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-400">{user.email}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'admin' ? 'bg-red-900 text-red-200' :
                            user.role === 'group_admin' ? 'bg-purple-900 text-purple-200' :
                            'bg-gray-700 text-gray-300'
                          }`}>
                            {user.role === 'admin' ? 'Admin' :
                             user.role === 'group_admin' ? 'Group Admin' :
                             'User'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-gray-300">{user.gamesPlayed || 0}</td>
                        <td className="py-4 px-4 text-gray-300">{user.casesCompleted || 0}</td>
                        <td className="py-4 px-4 text-gray-300">
                          {user.averageScore ? `${user.averageScore.toFixed(1)}%` : 'N/A'}
                        </td>
                        <td className="py-4 px-4 text-gray-300">{formatDuration(user.totalPlaytime || 0)}</td>
                        <td className="py-4 px-4 text-gray-300">{formatDate(user.lastLoginAt)}</td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleViewUser(user.uid)}
                            className="inline-flex items-center px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                            title="View Details"
                          >
                            <EyeIcon className="w-4 h-4 mr-1" />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Performance Insights */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4">Performance Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <ActivityIcon className="w-6 h-6 text-blue-400" />
                  <div>
                    <p className="text-sm text-gray-400">User Engagement</p>
                    <p className="text-xl font-bold text-white">
                      {stats.totalUsers > 0 ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(0) : 0}%
                    </p>
                    <p className="text-xs text-gray-500">Active in last 7 days</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <TrendingUpIcon className="w-6 h-6 text-green-400" />
                  <div>
                    <p className="text-sm text-gray-400">Completion Rate</p>
                    <p className="text-xl font-bold text-white">{stats.completionRate.toFixed(1)}%</p>
                    <p className="text-xs text-gray-500">Cases completed</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <GamepadIcon className="w-6 h-6 text-purple-400" />
                  <div>
                    <p className="text-sm text-gray-400">Avg Games/User</p>
                    <p className="text-xl font-bold text-white">
                      {stats.totalUsers > 0 ? (stats.totalGames / stats.totalUsers).toFixed(1) : 0}
                    </p>
                    <p className="text-xs text-gray-500">Total games played</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
