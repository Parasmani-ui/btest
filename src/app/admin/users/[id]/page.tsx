'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import {
  UserIcon,
  MailIcon,
  ShieldIcon,
  BuildingIcon,
  CalendarIcon,
  GamepadIcon,
  TrophyIcon,
  ClockIcon,
  TargetIcon,
  ArrowLeftIcon,
  FileTextIcon,
  FileSpreadsheetIcon,
  Edit2Icon
} from 'lucide-react';
import toast from 'react-hot-toast';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  organizationId?: string;
  organizationName?: string;
  createdAt: string;
  lastLoginAt?: string;
}

interface UserStats {
  gamesPlayed: number;
  casesCompleted: number;
  totalPlaytime: number;
  averageScore: number;
  completionRate: number;
  gameTypeStats: Record<string, any>;
}

interface GameSession {
  id: string;
  gameType: string;
  caseTitle: string;
  caseSolved: boolean;
  startedAt: string;
  elapsedTime: number;
  hintsUsed: number;
  overallScore: number;
  threeParamScores?: any;
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [gameHistory, setGameHistory] = useState<GameSession[]>([]);

  useEffect(() => {
    loadUserData();
  }, [userId]);

  const getAuthToken = async () => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Not authenticated');
    }
    return await user.getIdToken();
  };

  const loadUserData = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();

      const response = await fetch(`/api/admin/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load user data');
      }

      const data = await response.json();
      setProfile(data.profile);
      setStats(data.stats);
      setGameHistory(data.gameHistory);
    } catch (error: any) {
      console.error('Error loading user data:', error);
      toast.error(error.message || 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`/api/admin/reports/user/${userId}?format=pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate PDF report');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `${profile?.displayName}_Report.pdf`;

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('PDF report downloaded successfully');
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      toast.error(error.message || 'Failed to generate PDF report');
    }
  };

  const handleExportExcel = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`/api/admin/reports/user/${userId}?format=xlsx`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate Excel report');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `${profile?.displayName}_Report.xlsx`;

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Excel report downloaded successfully');
    } catch (error: any) {
      console.error('Error generating Excel:', error);
      toast.error(error.message || 'Failed to generate Excel report');
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'group_admin':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requireAdmin>
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!profile) {
    return (
      <ProtectedRoute requireAdmin>
        <DashboardLayout title="User Not Found">
          <div className="text-center py-12">
            <p className="text-gray-400">User not found</p>
            <button
              onClick={() => router.push('/admin/users')}
              className="mt-4 text-blue-500 hover:text-blue-400"
            >
              Back to Users
            </button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAdmin>
      <DashboardLayout title="User Details">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin/users')}
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeftIcon className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">{profile.displayName}</h1>
                <p className="text-gray-400">User Profile & Game History</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push(`/admin/users?edit=${userId}`)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white"
              >
                <Edit2Icon className="w-5 h-5 mr-2" />
                Edit User
              </button>
              <button
                onClick={handleExportPDF}
                className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-white"
              >
                <FileTextIcon className="w-5 h-5 mr-2" />
                PDF
              </button>
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors text-white"
              >
                <FileSpreadsheetIcon className="w-5 h-5 mr-2" />
                Excel
              </button>
            </div>
          </div>

          {/* Profile Card */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4">Profile Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <UserIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-400">Name</p>
                  <p className="text-white font-medium">{profile.displayName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MailIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-400">Email</p>
                  <p className="text-white font-medium">{profile.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ShieldIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-400">Role</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(profile.role)}`}>
                    {profile.role.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <BuildingIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-400">Organization</p>
                  <p className="text-white font-medium">{profile.organizationName || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-400">Account Created</p>
                  <p className="text-white font-medium">{formatDate(profile.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-400">Last Login</p>
                  <p className="text-white font-medium">
                    {profile.lastLoginAt ? formatDate(profile.lastLoginAt) : 'Never'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Dashboard */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Games Played</p>
                    <p className="text-3xl font-bold text-white mt-2">{stats.gamesPlayed}</p>
                  </div>
                  <GamepadIcon className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Cases Solved</p>
                    <p className="text-3xl font-bold text-white mt-2">{stats.casesCompleted}</p>
                  </div>
                  <TrophyIcon className="w-8 h-8 text-green-500" />
                </div>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Total Playtime</p>
                    <p className="text-3xl font-bold text-white mt-2">{formatDuration(stats.totalPlaytime)}</p>
                  </div>
                  <ClockIcon className="w-8 h-8 text-yellow-500" />
                </div>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Average Score</p>
                    <p className="text-3xl font-bold text-white mt-2">{stats.averageScore.toFixed(1)}%</p>
                  </div>
                  <TargetIcon className="w-8 h-8 text-purple-500" />
                </div>
              </div>
            </div>
          )}

          {/* Game Type Performance */}
          {stats && Object.keys(stats.gameTypeStats).length > 0 && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-lg font-semibold text-white mb-4">Performance by Game Type</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-300">Game Type</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-300">Total Played</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-300">Completed</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-300">Avg Score</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-300">Completion Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {Object.entries(stats.gameTypeStats).map(([gameType, typeStats]: [string, any]) => {
                      const completionRate = typeStats.total > 0
                        ? Math.round((typeStats.completed / typeStats.total) * 100)
                        : 0;

                      return (
                        <tr key={gameType} className="hover:bg-gray-700">
                          <td className="py-3 px-4 text-white font-medium">{gameType}</td>
                          <td className="py-3 px-4 text-gray-300">{typeStats.total}</td>
                          <td className="py-3 px-4 text-gray-300">{typeStats.completed}</td>
                          <td className="py-3 px-4 text-gray-300">{typeStats.avgScore.toFixed(2)}%</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-700 rounded-full h-2 max-w-[100px]">
                                <div
                                  className="bg-blue-500 h-2 rounded-full"
                                  style={{ width: `${completionRate}%` }}
                                ></div>
                              </div>
                              <span className="text-gray-300 text-sm">{completionRate}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Game History */}
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Game History ({gameHistory.length} games)</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">#</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">Game Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">Case Title</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">Duration</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">Hints</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {gameHistory.map((game, index) => (
                    <tr key={game.id} className="hover:bg-gray-700">
                      <td className="py-3 px-4 text-gray-400">{index + 1}</td>
                      <td className="py-3 px-4 text-white">{game.gameType}</td>
                      <td className="py-3 px-4 text-gray-300 max-w-[300px] truncate">{game.caseTitle}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          game.caseSolved ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {game.caseSolved ? 'Solved' : 'Incomplete'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-300">{formatDate(game.startedAt)}</td>
                      <td className="py-3 px-4 text-gray-300">{formatDuration(game.elapsedTime || 0)}</td>
                      <td className="py-3 px-4 text-gray-300">{game.hintsUsed || 0}</td>
                      <td className="py-3 px-4 text-white font-medium">{game.overallScore || 0}%</td>
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
