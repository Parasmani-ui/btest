'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGameSession } from '@/lib/gameSession';
import { getUserGames } from '@/lib/firestore';
import { UserStats } from '@/types/user';

export default function TestSessionsPage() {
  const { userData } = useAuth();
  const { startSession, endSession, addAction, addEvidence, getCurrentSession } = useGameSession();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [currentSessionInfo, setCurrentSessionInfo] = useState<any>(null);
  const [testLog, setTestLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestLog(prev => [`[${timestamp}] ${message}`, ...prev]);
  };

  const loadStats = async () => {
    if (!userData?.uid) {
      addLog('No user ID available');
      return;
    }
    
    try {
      addLog('Loading user stats...');
      const stats = await getUserGames(userData.uid);
      setUserStats(stats);
      addLog(`Stats loaded: ${stats.gamesPlayed} games, ${stats.totalPlaytime} minutes`);
    } catch (error) {
      addLog(`Error loading stats: ${error}`);
    }
  };

  const updateSessionInfo = () => {
    const session = getCurrentSession();
    setCurrentSessionInfo(session);
  };

  useEffect(() => {
    if (userData?.uid) {
      loadStats();
    }
    
    // Update session info every second
    const interval = setInterval(updateSessionInfo, 1000);
    return () => clearInterval(interval);
  }, [userData]);

  const testStartSession = async () => {
    try {
      addLog('Starting test session...');
      const sessionId = await startSession('quick');
      addLog(`Session started with ID: ${sessionId}`);
    } catch (error) {
      addLog(`Error starting session: ${error}`);
    }
  };

  const testAddAction = async () => {
    try {
      addLog('Adding test action...');
      await addAction('Test action added');
      addLog('Action added successfully');
    } catch (error) {
      addLog(`Error adding action: ${error}`);
    }
  };

  const testAddEvidence = async () => {
    try {
      addLog('Adding test evidence...');
      await addEvidence('Test evidence found');
      addLog('Evidence added successfully');
    } catch (error) {
      addLog(`Error adding evidence: ${error}`);
    }
  };

  const testEndSession = async () => {
    try {
      addLog('Ending session...');
      await endSession(true, 85);
      addLog('Session ended successfully');
      // Reload stats after ending session
      setTimeout(() => loadStats(), 1000);
    } catch (error) {
      addLog(`Error ending session: ${error}`);
    }
  };

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <p>Please log in to test session tracking</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Session Tracking Test Page</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Current Session Info */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Current Session</h2>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-400">Active:</span> {currentSessionInfo?.isActive ? 'Yes' : 'No'}</p>
              <p><span className="text-gray-400">Session ID:</span> {currentSessionInfo?.sessionId || 'None'}</p>
              <p><span className="text-gray-400">Game Type:</span> {currentSessionInfo?.gameType || 'None'}</p>
              <p><span className="text-gray-400">Time Spent:</span> {currentSessionInfo?.timeSpent || 0} minutes</p>
              <p><span className="text-gray-400">Start Time:</span> {currentSessionInfo?.startTime?.toLocaleString() || 'None'}</p>
            </div>
          </div>

          {/* User Stats */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">User Statistics</h2>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-400">Games Played:</span> {userStats?.gamesPlayed || 0}</p>
              <p><span className="text-gray-400">Cases Completed:</span> {userStats?.casesCompleted || 0}</p>
              <p><span className="text-gray-400">Total Playtime:</span> {userStats?.totalPlaytime || 0} minutes</p>
              <p><span className="text-gray-400">Average Score:</span> {userStats?.averageScore?.toFixed(1) || 0}%</p>
              <p><span className="text-gray-400">Recent Sessions:</span> {userStats?.recentSessions?.length || 0}</p>
            </div>
            <button
              onClick={loadStats}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            >
              Refresh Stats
            </button>
          </div>

          {/* Test Controls */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
            <div className="space-y-3">
              <button
                onClick={testStartSession}
                disabled={currentSessionInfo?.isActive}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded transition-colors"
              >
                Start Test Session
              </button>
              
              <button
                onClick={testAddAction}
                disabled={!currentSessionInfo?.isActive}
                className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded transition-colors"
              >
                Add Test Action
              </button>
              
              <button
                onClick={testAddEvidence}
                disabled={!currentSessionInfo?.isActive}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded transition-colors"
              >
                Add Test Evidence
              </button>
              
              <button
                onClick={testEndSession}
                disabled={!currentSessionInfo?.isActive}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded transition-colors"
              >
                End Session (Score: 85)
              </button>
            </div>
          </div>

          {/* Test Log */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Test Log</h2>
            <div className="h-64 overflow-y-auto bg-gray-900 p-3 rounded text-xs space-y-1">
              {testLog.map((log, index) => (
                <div key={index} className="text-gray-300">{log}</div>
              ))}
              {testLog.length === 0 && (
                <div className="text-gray-500">No logs yet...</div>
              )}
            </div>
            <button
              onClick={() => setTestLog([])}
              className="mt-3 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
            >
              Clear Log
            </button>
          </div>
        </div>

        {/* Recent Sessions List */}
        {userStats?.recentSessions && userStats.recentSessions.length > 0 && (
          <div className="mt-8 bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Sessions</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-700">
                    <th className="pb-2">Game Type</th>
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Duration</th>
                    <th className="pb-2">Solved</th>
                    <th className="pb-2">Score</th>
                  </tr>
                </thead>
                <tbody className="space-y-1">
                  {userStats.recentSessions.map((session, index) => (
                    <tr key={index} className="border-b border-gray-700">
                      <td className="py-2 capitalize">{session.gameType}</td>
                      <td className="py-2">{new Date(session.date).toLocaleDateString()}</td>
                      <td className="py-2">{session.duration} min</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          session.caseSolved ? 'bg-green-600' : 'bg-red-600'
                        }`}>
                          {session.caseSolved ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="py-2">{session.score}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 