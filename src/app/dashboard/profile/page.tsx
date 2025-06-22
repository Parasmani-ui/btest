'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserIcon, SaveIcon } from 'lucide-react';

const profileSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { userData, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: userData?.displayName || '',
      email: userData?.email || '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setLoading(true);
    try {
      await updateUserProfile({
        displayName: data.displayName,
        profileComplete: true,
      });
    } catch (error) {
      console.error('Profile update error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout title="Profile">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Profile Header */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-700">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-medium">
                  {userData?.displayName?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{userData?.displayName}</h1>
                <p className="text-gray-300">{userData?.email}</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                  userData?.role === 'admin' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {userData?.role}
                </span>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-700">
            <div className="flex items-center space-x-2 mb-6">
              <UserIcon className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-white">Profile Information</h2>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-300">
                  Full Name
                </label>
                <input
                  {...register('displayName')}
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {errors.displayName && (
                  <p className="mt-1 text-sm text-red-400">{errors.displayName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  {...register('email')}
                  type="email"
                  disabled
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <SaveIcon className="w-4 h-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Account Stats */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4">Account Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Member Since</p>
                <p className="text-lg text-white">
                  {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Last Login</p>
                <p className="text-lg text-white">
                  {userData?.lastLoginAt ? new Date(userData.lastLoginAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Profile Status</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  userData?.profileComplete 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {userData?.profileComplete ? 'Complete' : 'Incomplete'}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Account Type</p>
                <p className="text-lg text-white capitalize">{userData?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 