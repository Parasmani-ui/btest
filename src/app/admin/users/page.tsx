'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useState, useEffect } from 'react';
import { UserData, Organization } from '@/types/user';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  UsersIcon, 
  EditIcon, 
  TrashIcon, 
  SearchIcon,
  FilterIcon,
  DownloadIcon,
  PlusIcon,
  BuildingIcon,
  ShieldIcon,
  UserIcon
} from 'lucide-react';

export default function AdminUsersPage() {
  const { userData } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<UserData | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load users
      const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const usersSnapshot = await getDocs(usersQuery);
      const usersData = usersSnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as UserData[];
      setUsers(usersData);

      // Load organizations
      const orgsSnapshot = await getDocs(collection(db, 'organizations'));
      const orgsData = orgsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Organization[];
      setOrganizations(orgsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<UserData>) => {
    try {
      await updateDoc(doc(db, 'users', userId), updates);
      setUsers(prev => prev.map(user => 
        user.uid === userId ? { ...user, ...updates } : user
      ));
      setEditingUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <ShieldIcon className="w-4 h-4 text-red-500" />;
      case 'group_admin':
        return <BuildingIcon className="w-4 h-4 text-blue-500" />;
      default:
        return <UserIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'group_admin':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const exportToCSV = () => {
    const csvData = [
      ['Name', 'Email', 'Role', 'Organization', 'Created At', 'Last Login', 'Total Playtime', 'Games Played'],
      ...filteredUsers.map(user => [
        user.displayName,
        user.email,
        user.role,
        user.organizationName || 'N/A',
        new Date(user.createdAt).toLocaleDateString(),
        new Date(user.lastLoginAt).toLocaleDateString(),
        (user.totalPlaytime || 0).toString(),
        (user.gamesPlayed || 0).toString()
      ])
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
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

  return (
    <ProtectedRoute requireAdmin={true}>
      <DashboardLayout title="User Management">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">User Management</h1>
              <p className="text-gray-400">Manage users, roles, and organizations</p>
            </div>
            <button
              onClick={exportToCSV}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white"
            >
              <DownloadIcon className="w-5 h-5 mr-2" />
              Export CSV
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center">
                <UsersIcon className="w-8 h-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Users</p>
                  <p className="text-2xl font-bold text-white">{users.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center">
                <ShieldIcon className="w-8 h-8 text-red-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-400">Admins</p>
                  <p className="text-2xl font-bold text-white">
                    {users.filter(u => u.role === 'admin').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center">
                <BuildingIcon className="w-8 h-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-400">Group Admins</p>
                  <p className="text-2xl font-bold text-white">
                    {users.filter(u => u.role === 'group_admin').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center">
                <UserIcon className="w-8 h-8 text-gray-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-400">Regular Users</p>
                  <p className="text-2xl font-bold text-white">
                    {users.filter(u => u.role === 'user').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="group_admin">Group Admin</option>
                  <option value="user">User</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">User</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">Organization</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">Stats</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">Last Login</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredUsers.map((user) => (
                    <tr key={user.uid} className="hover:bg-gray-700">
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-white">{user.displayName}</p>
                          <p className="text-sm text-gray-400">{user.email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          {getRoleIcon(user.role)}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                            {user.role.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-300">
                          {user.organizationName || 'N/A'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm">
                          <p className="text-white">{user.gamesPlayed || 0} games</p>
                          <p className="text-gray-400">{Math.floor((user.totalPlaytime || 0) / 60)}h played</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-300">
                          {new Date(user.lastLoginAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="inline-flex items-center px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                        >
                          <EditIcon className="w-4 h-4 mr-1" />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Edit User Modal */}
          {editingUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold text-white mb-4">Edit User</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={editingUser.displayName}
                      onChange={(e) => setEditingUser({...editingUser, displayName: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Role
                    </label>
                    <select
                      value={editingUser.role}
                      onChange={(e) => setEditingUser({...editingUser, role: e.target.value as any})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="user">User</option>
                      <option value="group_admin">Group Admin</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => handleUpdateUser(editingUser.uid, {
                        displayName: editingUser.displayName,
                        role: editingUser.role
                      })}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setEditingUser(null)}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 