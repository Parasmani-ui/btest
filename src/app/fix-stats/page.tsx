'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useState } from 'react';
import { fixUserStats } from '@/lib/fixUserStats';
import { cleanupUserSessions } from '@/lib/cleanupUserSessions';
import { debugUserStats } from '@/lib/debugUserStats';

export default function FixStatsPage() {
  const { user, userData, refreshUserData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const handleFixStats = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    setStatus('');
    
    try {
      setStatus('🧹 Cleaning up duplicate sessions...');
      const cleanupResult = await cleanupUserSessions(user.uid);
      console.log('Cleanup result:', cleanupResult);
      
      setStatus('🔧 Fixing user stats...');
      const fixResult = await fixUserStats(user.uid);
      console.log('Fix result:', fixResult);
      
      setStatus('🔄 Refreshing user data...');
      await refreshUserData();
      
      if (fixResult.fixed) {
        setStatus(`✅ Stats fixed! Games: ${fixResult.oldStats.gamesPlayed} → ${fixResult.newStats.gamesPlayed}, Cases: ${fixResult.oldStats.casesCompleted} → ${fixResult.newStats.casesCompleted}, Playtime: ${fixResult.oldStats.totalPlaytime}m → ${fixResult.newStats.totalPlaytime}m`);
      } else {
        setStatus('✅ Stats were already consistent!');
      }
    } catch (error) {
      console.error('Error fixing stats:', error);
      setStatus('❌ Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDebugStats = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    setStatus('🔍 Debugging user stats...');
    
    try {
      const debug = await debugUserStats(user.uid);
      setDebugInfo(debug);
      setStatus('✅ Debug complete! Check console for details.');
    } catch (error) {
      console.error('Error debugging stats:', error);
      setStatus('❌ Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupHospital = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    setStatus('🧹 Cleaning up hospital simulation sessions...');
    
    try {
      const result = await cleanupUserSessions(user.uid, 'hospital');
      setStatus(`✅ Cleaned up hospital sessions: ${result.deletedSessions} deleted, ${result.cleanSessions} remaining`);
      
      // Also refresh data
      await refreshUserData();
    } catch (error) {
      console.error('Error cleaning up hospital sessions:', error);
      setStatus('❌ Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Fix User Stats</h1>
          
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Current User Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-gray-700 p-4 rounded">
                <div className="text-2xl font-bold text-blue-400">{userData?.gamesPlayed || 0}</div>
                <div className="text-sm text-gray-300">Games Played</div>
              </div>
              <div className="bg-gray-700 p-4 rounded">
                <div className="text-2xl font-bold text-green-400">{userData?.casesCompleted || 0}</div>
                <div className="text-sm text-gray-300">Cases Completed</div>
              </div>
              <div className="bg-gray-700 p-4 rounded">
                <div className="text-2xl font-bold text-yellow-400">{userData?.totalPlaytime || 0}m</div>
                <div className="text-sm text-gray-300">Total Playtime</div>
              </div>
              <div className="bg-gray-700 p-4 rounded">
                <div className="text-2xl font-bold text-purple-400">{(userData?.averageScore || 0).toFixed(1)}%</div>
                <div className="text-sm text-gray-300">Average Score</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Fixes</h3>
              <div className="space-y-3">
                <button
                  onClick={handleFixStats}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  {loading ? 'Fixing...' : '🔧 Fix All Stats & Clean Duplicates'}
                </button>
                
                <button
                  onClick={handleCleanupHospital}
                  disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  {loading ? 'Cleaning...' : '🏥 Fix Hospital Simulation (12 → 3 sessions)'}
                </button>
                
                <button
                  onClick={handleDebugStats}
                  disabled={loading}
                  className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  {loading ? 'Debugging...' : '🔍 Debug Stats (Check Console)'}
                </button>
              </div>
            </div>

            {status && (
              <div className={`p-4 rounded-lg ${status.includes('❌') ? 'bg-red-900 text-red-200' : status.includes('✅') ? 'bg-green-900 text-green-200' : 'bg-blue-900 text-blue-200'}`}>
                {status}
              </div>
            )}

            {debugInfo && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Debug Results</h3>
                <div className="space-y-2 text-sm font-mono">
                  <div>Sessions Found: {debugInfo.sessions?.length || 0}</div>
                  <div>Games Played Consistent: {debugInfo.isConsistent?.gamesPlayed ? '✅' : '❌'}</div>
                  <div>Cases Completed Consistent: {debugInfo.isConsistent?.casesCompleted ? '✅' : '❌'}</div>
                  <div>Playtime Consistent: {debugInfo.isConsistent?.playtime ? '✅' : '❌'}</div>
                </div>
              </div>
            )}

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">What This Does</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• <strong>Fix All Stats:</strong> Recalculates your stats based on actual game sessions</li>
                <li>• <strong>Clean Duplicates:</strong> Removes duplicate or incomplete game sessions</li>
                <li>• <strong>Fix Hospital:</strong> Specifically cleans up hospital simulation duplicate sessions</li>
                <li>• <strong>Debug:</strong> Shows detailed comparison between current stats and calculated stats</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
