'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { 
  GamepadIcon, 
  TrophyIcon, 
  ClockIcon,
  CalendarIcon,
  EyeIcon
} from 'lucide-react';

export default function GameHistoryPage() {
  // Mock data for game history
  const gameHistory = [
    {
      id: 1,
      title: 'The Missing Diamond',
      type: 'Detective Case',
      status: 'Solved',
      score: 95,
      duration: '45 minutes',
      completedAt: '2024-01-15T10:30:00Z',
      difficulty: 'Medium',
    },
    {
      id: 2,
      title: 'Hospital Emergency Simulation',
      type: 'Simulation',
      status: 'Completed',
      score: 87,
      duration: '32 minutes',
      completedAt: '2024-01-14T15:20:00Z',
      difficulty: 'Hard',
    },
    {
      id: 3,
      title: 'Chain Fail Investigation',
      type: 'Detective Case',
      status: 'Solved',
      score: 78,
      duration: '52 minutes',
      completedAt: '2024-01-12T09:15:00Z',
      difficulty: 'Easy',
    },
    {
      id: 4,
      title: 'Fake News Detection',
      type: 'Simulation',
      status: 'In Progress',
      score: null,
      duration: '15 minutes',
      completedAt: '2024-01-10T14:45:00Z',
      difficulty: 'Medium',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Solved':
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-100 text-green-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout title="Game History">
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-sm border">
            <div className="flex items-center space-x-4">
              <GamepadIcon className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-sky-200">Game History</h1>
                <p className="text-white">Track your detective journey and achievements</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gray-800 rounded-lg p-6 shadow-sm border">
              <div className="flex items-center">
                <GamepadIcon className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-sky-100">Total Games</p>
                  <p className="text-2xl font-bold text-white">{gameHistory.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 shadow-sm border">
              <div className="flex items-center">
                <TrophyIcon className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-sky-100">Cases Solved</p>
                  <p className="text-2xl font-bold text-white">
                    {gameHistory.filter(g => g.status === 'Solved' || g.status === 'Completed').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 shadow-sm border">
              <div className="flex items-center">
                <ClockIcon className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-sky-100">Avg. Time</p>
                  <p className="text-2xl font-bold text-white">41m</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 shadow-sm border">
              <div className="flex items-center">
                <TrophyIcon className="w-8 h-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-sky-100">Avg. Score</p>
                  <p className="text-2xl font-bold text-white">87</p>
                </div>
              </div>
            </div>
          </div>

          {/* Game History List */}
          <div className="bg-gray-800 rounded-lg shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-sky-200">Recent Games</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {gameHistory.map((game) => (
                <div key={game.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="text-lg font-medium text-sky-100">{game.title}</h3>
                          <p className="text-sm text-gray-400">{game.type}</p>
                        </div>
                        <div className="flex space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(game.status)}`}>
                            {game.status}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(game.difficulty)}`}>
                            {game.difficulty}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center space-x-6 text-sm text-white">
                        <div className="flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-1" />
                          {new Date(game.completedAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          {game.duration}
                        </div>
                        {game.score && (
                          <div className="flex items-center">
                            <TrophyIcon className="w-4 h-4 mr-1" />
                            Score: {game.score}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        <EyeIcon className="w-4 h-4 mr-2" />
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 