'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import {
  BuildingIcon,
  UsersIcon,
  GamepadIcon,
  TrendingUpIcon,
  EyeIcon,
  FileTextIcon,
  FileSpreadsheetIcon,
  SearchIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  ClockIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

interface OrganizationStats {
  id: string;
  name: string;
  totalUsers: number;
  activeUsers: number;
  totalGames: number;
  totalPlaytime: number;
  averageScore: number;
  createdAt?: string;
}

export default function OrganizationsPage() {
  const { userData } = useAuth();
  const router = useRouter();
  const [organizations, setOrganizations] = useState<OrganizationStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadOrganizations();
  }, []);

  const getAuthToken = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    return await user.getIdToken();
  };

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();

      // Fetch all users with recalculated stats
      const response = await fetch('/api/admin/users?recalculateStats=true', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to load users');

      const data = await response.json();
      const users = data.users || [];

      // Group users by organization
      const orgMap = new Map<string, any>();

      users.forEach((user: any) => {
        const orgId = user.organizationId || 'no-organization';
        const orgName = user.organizationName || 'No Organization';

        if (!orgMap.has(orgId)) {
          orgMap.set(orgId, {
            id: orgId,
            name: orgName,
            users: [],
            totalGames: 0,
            totalPlaytime: 0,
            totalScore: 0,
            usersWithScores: 0,
            activeUsers: 0,
          });
        }

        const org = orgMap.get(orgId);
        org.users.push(user);
        org.totalGames += user.gamesPlayed || 0;
        org.totalPlaytime += user.totalPlaytime || 0;

        if (user.averageScore && user.averageScore > 0) {
          org.totalScore += user.averageScore;
          org.usersWithScores += 1;
        }

        // Check if user is active (logged in within last 7 days)
        if (user.lastLoginAt) {
          const lastLogin = new Date(user.lastLoginAt);
          const daysSinceLogin = (Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceLogin <= 7) {
            org.activeUsers += 1;
          }
        }
      });

      // Convert to array and calculate averages
      const orgsArray = Array.from(orgMap.values()).map((org) => ({
        id: org.id,
        name: org.name,
        totalUsers: org.users.length,
        activeUsers: org.activeUsers,
        totalGames: org.totalGames,
        totalPlaytime: org.totalPlaytime,
        averageScore: org.usersWithScores > 0 ? org.totalScore / org.usersWithScores : 0,
      }));

      // Sort by total users (largest first)
      orgsArray.sort((a, b) => b.totalUsers - a.totalUsers);

      setOrganizations(orgsArray);
    } catch (error: any) {
      console.error('Error loading organizations:', error);
      toast.error(error.message || 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrganization = (orgId: string) => {
    router.push(`/admin/organizations/${orgId}`);
  };

  const handleExportPDF = async (orgId: string) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`/api/admin/reports/organization/${orgId}?format=pdf`, {
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

  const handleExportExcel = async (orgId: string) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`/api/admin/reports/organization/${orgId}?format=xlsx`, {
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

  const filteredOrganizations = organizations.filter((org) =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase())
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
      <DashboardLayout title="Organizations">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Organizations</h1>
              <p className="text-gray-400">Manage and monitor all organizations</p>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Organizations</p>
                  <p className="text-3xl font-bold text-white mt-2">{organizations.length}</p>
                </div>
                <BuildingIcon className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Users</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {organizations.reduce((sum, org) => sum + org.totalUsers, 0)}
                  </p>
                </div>
                <UsersIcon className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Games</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {organizations.reduce((sum, org) => sum + org.totalGames, 0)}
                  </p>
                </div>
                <GamepadIcon className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Playtime</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {formatDuration(organizations.reduce((sum, org) => sum + org.totalPlaytime, 0))}
                  </p>
                </div>
                <ClockIcon className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search organizations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Organizations Table */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">Organization</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">Users</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">Active Users</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">Total Games</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">Avg Score</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">Total Playtime</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredOrganizations.map((org) => (
                    <tr key={org.id} className="hover:bg-gray-700">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <BuildingIcon className="w-5 h-5 text-blue-500" />
                          <span className="font-medium text-white">{org.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-300">{org.totalUsers}</td>
                      <td className="py-4 px-4 text-gray-300">{org.activeUsers}</td>
                      <td className="py-4 px-4 text-gray-300">{org.totalGames}</td>
                      <td className="py-4 px-4 text-gray-300">{org.averageScore.toFixed(1)}%</td>
                      <td className="py-4 px-4 text-gray-300">{formatDuration(org.totalPlaytime)}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewOrganization(org.id)}
                            className="inline-flex items-center px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                            title="View Details"
                          >
                            <EyeIcon className="w-4 h-4 mr-1" />
                            View
                          </button>
                          <button
                            onClick={() => handleExportPDF(org.id)}
                            className="inline-flex items-center px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                            title="Export PDF"
                          >
                            <FileTextIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleExportExcel(org.id)}
                            className="inline-flex items-center px-3 py-1 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors"
                            title="Export Excel"
                          >
                            <FileSpreadsheetIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
