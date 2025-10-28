'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import {
  GamepadIcon,
  TrophyIcon,
  ClockIcon,
  CalendarIcon,
  EyeIcon,
  XIcon,
  FileSpreadsheet,
  FileText,
  Download
} from 'lucide-react';
import { GameSession } from '@/types/user';
import { getUserGameHistory } from '@/lib/firestore';
import { exportToExcel, exportToPDF, exportSingleGameToPDF } from '@/utils/exportGameHistory';
import toast from 'react-hot-toast';

export default function GameHistoryPage() {
  const { userData } = useAuth();
  const [gameHistory, setGameHistory] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<GameSession | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    if (userData?.uid) {
      fetchGameHistory();
    }
  }, [userData]);

  const fetchGameHistory = async () => {
    try {
      setLoading(true);
      // Call Firestore directly from client-side with user's auth token
      // Fetch ALL games (set limit to 1000 or a very high number)
      const history = await getUserGameHistory(userData?.uid!, 1000);
      setGameHistory(history);
    } catch (error) {
      console.error('Error fetching game history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: boolean) => {
    return status
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  const getGameTypeLabel = (gameType: string) => {
    const labels: Record<string, string> = {
      'quick': 'Quick Investigation',
      'simulation': 'POSH Simulation',
      'hospital': 'Hospital Crisis',
      'fake-news': 'Fake News Detection',
      'chainfail': 'ChainFail Investigation',
      'forensic-audit': 'Forensic Audit',
      'food-safety': 'Food Safety',
      'negotiation': 'Negotiation',
      'financial-negotiation': 'Financial Forensics',
      'powercrisis': 'Power Crisis Simulation'
    };
    return labels[gameType] || gameType;
  };

  // Helper function to strip HTML tags and format analysis text
  const formatAnalysisText = (htmlText: string): string => {
    if (!htmlText) return '';

    // Remove HTML tags and decode entities
    let text = htmlText
      .replace(/<div[^>]*>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<p[^>]*>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<h4[^>]*>/gi, '\n\n')
      .replace(/<\/h4>/gi, ':\n')
      .replace(/<ul[^>]*>/gi, '\n')
      .replace(/<\/ul>/gi, '\n')
      .replace(/<li[^>]*>/gi, '  • ')
      .replace(/<\/li>/gi, '\n')
      .replace(/<strong>/gi, '')
      .replace(/<\/strong>/gi, '')
      .replace(/<span[^>]*>/gi, '')
      .replace(/<\/span>/gi, '')
      .replace(/<[^>]+>/g, '') // Remove any remaining tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Replace multiple newlines with double newline
      .trim();

    return text;
  };

  const calculateAverageScore = () => {
    if (gameHistory.length === 0) return 0;
    const totalScore = gameHistory.reduce((sum, game) => sum + (game.score || 0), 0);
    return Math.round(totalScore / gameHistory.length);
  };

  const calculateAverageTime = () => {
    if (gameHistory.length === 0) return '0m';
    const totalTime = gameHistory.reduce((sum, game) => sum + game.duration, 0);
    const avgMinutes = Math.round(totalTime / gameHistory.length);
    return `${avgMinutes}m`;
  };

  const openDetailsModal = (game: GameSession) => {
    setSelectedGame(game);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedGame(null);
  };

  // Export handlers
  const handleExportExcel = () => {
    if (gameHistory.length === 0) {
      toast.error('No game history to export');
      return;
    }

    const userName = userData?.displayName || 'User';
    const result = exportToExcel(gameHistory, userName);

    if (result.success) {
      toast.success(`Excel file downloaded: ${result.filename}`);
    } else {
      toast.error(result.error || 'Failed to export Excel');
    }
  };

  const handleExportPDF = () => {
    if (gameHistory.length === 0) {
      toast.error('No game history to export');
      return;
    }

    const userName = userData?.displayName || 'User';
    const result = exportToPDF(gameHistory, userName);

    if (result.success) {
      toast.success(`PDF file downloaded: ${result.filename}`);
    } else {
      toast.error(result.error || 'Failed to export PDF');
    }
  };

  const handleExportSingleGame = (game: GameSession) => {
    const userName = userData?.displayName || 'User';
    const result = exportSingleGameToPDF(game, userName);

    if (result.success) {
      toast.success(`Game report downloaded: ${result.filename}`);
    } else {
      toast.error(result.error || 'Failed to export game report');
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout title="Game History">
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <GamepadIcon className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-sky-200">Game History</h1>
                  <p className="text-white">Track your training journey and achievements</p>
                </div>
              </div>

              {/* Export Buttons */}
              {gameHistory.length > 0 && (
                <div className="flex gap-3">
                  <button
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 shadow-md"
                    title="Export to Excel"
                  >
                    <FileSpreadsheet className="w-5 h-5" />
                    <span className="hidden sm:inline">Excel</span>
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 shadow-md"
                    title="Export to PDF"
                  >
                    <FileText className="w-5 h-5" />
                    <span className="hidden sm:inline">PDF</span>
                  </button>
                </div>
              )}
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
                    {gameHistory.filter(g => g.caseSolved).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 shadow-sm border">
              <div className="flex items-center">
                <ClockIcon className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-sky-100">Avg. Time</p>
                  <p className="text-2xl font-bold text-white">{calculateAverageTime()}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 shadow-sm border">
              <div className="flex items-center">
                <TrophyIcon className="w-8 h-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-sky-100">Avg. Score</p>
                  <p className="text-2xl font-bold text-white">{calculateAverageScore()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Game History List */}
          <div className="bg-gray-800 rounded-lg shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-sky-200">Recent Games</h2>
            </div>

            {loading ? (
              <div className="p-6 text-center text-gray-400">Loading game history...</div>
            ) : gameHistory.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                No games played yet. Start playing to see your history!
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {gameHistory.map((game) => (
                  <div key={game.id} className="p-6 hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h3 className="text-lg font-medium text-sky-100">
                              {game.caseTitle || getGameTypeLabel(game.gameType)}
                            </h3>
                            <p className="text-sm text-gray-400">{getGameTypeLabel(game.gameType)}</p>
                          </div>
                          <div className="flex space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(game.caseSolved)}`}>
                              {game.caseSolved ? 'Solved' : 'Unsolved'}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center space-x-6 text-sm text-white">
                          <div className="flex items-center">
                            <CalendarIcon className="w-4 h-4 mr-1" />
                            {game.endedAt ? new Date(game.endedAt).toLocaleDateString() : 'N/A'}
                          </div>
                          <div className="flex items-center">
                            <ClockIcon className="w-4 h-4 mr-1" />
                            {game.duration}m
                          </div>
                          {game.score !== undefined && (
                            <div className="flex items-center">
                              <TrophyIcon className="w-4 h-4 mr-1" />
                              Score: {game.score}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openDetailsModal(game)}
                          className="inline-flex items-center px-3 py-2 border border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                          <EyeIcon className="w-4 h-4 mr-2" />
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Details Modal */}
        {showDetailsModal && selectedGame && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-sky-200">
                  {selectedGame.caseTitle || getGameTypeLabel(selectedGame.gameType)}
                </h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleExportSingleGame(selectedGame)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 text-sm"
                    title="Download Game Report"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export Report</span>
                  </button>
                  <button
                    onClick={closeDetailsModal}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <XIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Game Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <p className="text-sm text-gray-400">Status</p>
                    <p className={`text-lg font-semibold ${selectedGame.caseSolved ? 'text-green-400' : 'text-red-400'}`}>
                      {selectedGame.caseSolved ? 'Solved' : 'Unsolved'}
                    </p>
                  </div>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <p className="text-sm text-gray-400">Score</p>
                    <p className="text-lg font-semibold text-white">{selectedGame.score || 0}/100</p>
                  </div>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <p className="text-sm text-gray-400">Duration</p>
                    <p className="text-lg font-semibold text-white">{selectedGame.duration}m</p>
                  </div>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <p className="text-sm text-gray-400">Hints Used</p>
                    <p className="text-lg font-semibold text-white">{selectedGame.hints || 0}</p>
                  </div>
                </div>

                {/* Score Breakdown */}
                {selectedGame.scoreBreakdown && (
                  <div className="bg-gray-700 p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-sky-200 mb-4">Score Breakdown</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {selectedGame.scoreBreakdown.parameter1Name && (
                        <div className="bg-gray-800 p-4 rounded-lg text-center">
                          <p className="text-sm text-gray-400 mb-2">{selectedGame.scoreBreakdown.parameter1Name}</p>
                          <p className="text-3xl font-bold text-purple-400">{selectedGame.scoreBreakdown.parameter1}/10</p>
                        </div>
                      )}
                      {selectedGame.scoreBreakdown.parameter2Name && (
                        <div className="bg-gray-800 p-4 rounded-lg text-center">
                          <p className="text-sm text-gray-400 mb-2">{selectedGame.scoreBreakdown.parameter2Name}</p>
                          <p className="text-3xl font-bold text-blue-400">{selectedGame.scoreBreakdown.parameter2}/10</p>
                        </div>
                      )}
                      {selectedGame.scoreBreakdown.parameter3Name && (
                        <div className="bg-gray-800 p-4 rounded-lg text-center">
                          <p className="text-sm text-gray-400 mb-2">{selectedGame.scoreBreakdown.parameter3Name}</p>
                          <p className="text-3xl font-bold text-green-400">{selectedGame.scoreBreakdown.parameter3}/10</p>
                        </div>
                      )}
                    </div>
                    {selectedGame.scoreBreakdown.summary && (
                      <div className="mt-4 bg-gray-800 p-4 rounded-lg text-center">
                        <p className="text-sm text-gray-400 mb-2">Overall Outcome</p>
                        <p className="text-lg font-semibold text-yellow-400">{selectedGame.scoreBreakdown.summary}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Analysis/Conclusion */}
                {selectedGame.analysis && (
                  <div className="bg-gray-700 p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-sky-200 mb-4">Analysis & Conclusion</h3>
                    <div className="text-gray-300 whitespace-pre-wrap">
                      {formatAnalysisText(selectedGame.analysis)}
                    </div>
                  </div>
                )}

                {/* User Answers (for detective games) */}
                {selectedGame.userAnswer && (
                  <div className="bg-gray-700 p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-sky-200 mb-4">Your Answer</h3>
                    <p className="text-gray-300 mb-2">
                      <span className="font-semibold">You arrested:</span> {selectedGame.userAnswer}
                    </p>
                    {selectedGame.correctAnswer && (
                      <p className="text-gray-300">
                        <span className="font-semibold">Correct answer:</span> {selectedGame.correctAnswer}
                      </p>
                    )}
                  </div>
                )}

                {/* Actions & Evidence */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedGame.actions && selectedGame.actions.length > 0 && (
                    <div className="bg-gray-700 p-6 rounded-lg">
                      <h3 className="text-xl font-bold text-sky-200 mb-4">Actions Taken</h3>
                      <ul className="space-y-2">
                        {selectedGame.actions.map((action, idx) => (
                          <li key={idx} className="text-gray-300 text-sm">• {action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedGame.evidence && selectedGame.evidence.length > 0 && (
                    <div className="bg-gray-700 p-6 rounded-lg">
                      <h3 className="text-xl font-bold text-sky-200 mb-4">Evidence Collected</h3>
                      <ul className="space-y-2">
                        {selectedGame.evidence.map((item, idx) => (
                          <li key={idx} className="text-gray-300 text-sm">• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
