'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useState } from 'react';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserData } from '@/types/user';

export default function FixUserPage() {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');

  const fixUserRole = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    setStatus('Checking user data...');
    
    try {
      // Get current user data
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        setStatus('Creating user document...');
        // Create user document if it doesn't exist
        const newUserData: UserData = {
          uid: user.uid,
          email: user.email!,
          displayName: user.displayName || user.email!.split('@')[0],
          role: 'user',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          profileComplete: true,
          totalPlaytime: 0,
          gamesPlayed: 0,
          casesCompleted: 0,
          averageScore: 0,
        };
        
        await setDoc(doc(db, 'users', user.uid), newUserData);
        setStatus('✅ User document created successfully! Reload the page.');
      } else {
        const currentData = userDoc.data();
        setStatus('Updating user role...');
        
        // Update the user role to 'user' if it's not set or wrong
        const updates: Partial<UserData> = {};
        
        if (!currentData.role || currentData.role !== 'user') {
          updates.role = 'user';
        }
        
        // Add missing fields
        if (typeof currentData.totalPlaytime !== 'number') {
          updates.totalPlaytime = 0;
        }
        if (typeof currentData.gamesPlayed !== 'number') {
          updates.gamesPlayed = 0;
        }
        if (typeof currentData.casesCompleted !== 'number') {
          updates.casesCompleted = 0;
        }
        if (typeof currentData.averageScore !== 'number') {
          updates.averageScore = 0;
        }
        
        if (Object.keys(updates).length > 0) {
          await updateDoc(doc(db, 'users', user.uid), updates);
          setStatus('✅ User data updated successfully! Reload the page.');
        } else {
          setStatus('✅ User data is already correct!');
        }
      }
    } catch (error) {
      console.error('Error fixing user:', error);
      setStatus('❌ Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Fix User Data</h1>
          
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Current User Info</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Email:</span>
                <span className="text-white">{user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Display Name:</span>
                <span className="text-white">{user?.displayName || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">UID:</span>
                <span className="text-white font-mono text-xs">{user?.uid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">UserData Loaded:</span>
                <span className="text-white">{userData ? 'Yes' : 'No'}</span>
              </div>
              {userData && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Current Role:</span>
                  <span className="text-white font-semibold">{userData.role}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Fix User Data</h2>
            <p className="text-gray-300 mb-4">
              This will ensure your user document exists in Firestore with the correct role and fields.
            </p>
            
            {status && (
              <div className="mb-4 p-3 bg-gray-700 rounded border border-gray-600">
                <p className="text-white text-sm">{status}</p>
              </div>
            )}
            
            <button
              onClick={fixUserRole}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded transition-colors"
            >
              {loading ? 'Fixing...' : 'Fix User Data'}
            </button>
            
            <div className="mt-4 space-y-2">
              <a
                href="/dashboard"
                className="block w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors text-center"
              >
                Go to Dashboard
              </a>
              <a
                href="/dashboard/user"
                className="block w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors text-center"
              >
                Go Directly to User Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 