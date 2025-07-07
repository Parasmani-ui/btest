'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GameHeader from '@/components/ui/GameHeader';
import { SparklesText } from '@/components/magicui/sparkles-text';
import { handleGameEnd } from '@/lib/gameSession';
import { useGameSession } from '@/lib/gameSession';

// Define colors for the food safety theme (cyan/teal theme)
const SPARKLE_COLORS = {
  cyan: { first: "#0891b2", second: "#06b6d4" }
};

interface FoodSafetyState {
  caseTitle: string;
  scenario: string;
  interactions: Array<{
    type: 'fssai' | 'ceo';
    content: string;
    timestamp: Date;
  }>;
  currentRound: number;
  maxRounds: number;
  gameStarted: boolean;
  gameEnded: boolean;
  finalVerdict?: 'ban_lifted' | 'ban_upheld';
  scores?: {
    insightfulness: number;
    evidenceEvaluation: number;
  };
  finalStatement?: string;
}

export default function FoodSafetySimulationClientPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [gameState, setGameState] = useState<FoodSafetyState>({
    caseTitle: '',
    scenario: '',
    interactions: [],
    currentRound: 0,
    maxRounds: 5,
    gameStarted: false,
    gameEnded: false,
  });
  const [userInput, setUserInput] = useState('');
  const { startSession } = useGameSession();

  useEffect(() => {
    setMounted(true);
  }, []);

  const startFoodSafetySimulation = async () => {
    setLoading(true);
    try {
      // Start game session tracking
      await startSession('food-safety');
      
      const response = await fetch('/api/food-safety-simulation/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'start_simulation'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGameState(prev => ({
          ...prev,
          caseTitle: data.caseTitle,
          scenario: data.scenario,
          interactions: [
            {
              type: 'fssai',
              content: data.openingStatement,
              timestamp: new Date()
            }
          ],
          gameStarted: true,
          currentRound: 1
        }));
      }
    } catch (error) {
      console.error('Error starting food safety simulation:', error);
    }
    setLoading(false);
  };

  const handleCEOResponse = async (action: string, input?: string) => {
    if (gameState.currentRound >= gameState.maxRounds || gameState.gameEnded) return;

    setLoading(true);
    try {
      const requestBody = {
        action,
        input: input || userInput,
        currentRound: gameState.currentRound,
        interactions: gameState.interactions,
        caseTitle: gameState.caseTitle
      };

      const response = await fetch('/api/food-safety-simulation/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        
        const newInteractions = [
          ...gameState.interactions,
          {
            type: 'ceo' as const,
            content: input || userInput || action,
            timestamp: new Date()
          },
          {
            type: 'fssai' as const,
            content: data.fssaiResponse,
            timestamp: new Date()
          }
        ];

        setGameState(prev => ({
          ...prev,
          interactions: newInteractions,
          currentRound: prev.currentRound + 1,
          gameEnded: data.gameEnded || prev.currentRound + 1 >= prev.maxRounds,
          scores: data.scores,
          finalVerdict: data.finalVerdict,
          finalStatement: data.finalStatement
        }));

        // Update user stats when game ends
        if (data.gameEnded || gameState.currentRound + 1 >= gameState.maxRounds) {
          try {
            const totalScore = data.scores ? 
              ((data.scores.insightfulness + data.scores.evidenceEvaluation) / 10) * 100 : 50;
            const caseSolved = data.finalVerdict === 'ban_lifted';
            
            await handleGameEnd(caseSolved, totalScore);
            console.log('User stats updated after food safety simulation');
          } catch (error) {
            console.error('Error updating user stats:', error);
          }
        }

        setUserInput('');
      }
    } catch (error) {
      console.error('Error processing CEO response:', error);
    }
    setLoading(false);
  };

  const getHint = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/food-safety-simulation/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get_hint',
          currentRound: gameState.currentRound,
          interactions: gameState.interactions,
          caseTitle: gameState.caseTitle
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGameState(prev => ({
          ...prev,
          interactions: [
            ...prev.interactions,
            {
              type: 'fssai',
              content: data.fssaiResponse,
              timestamp: new Date()
            }
          ]
        }));
      }
    } catch (error) {
      console.error('Error getting hint:', error);
    }
    setLoading(false);
  };

  const restartGame = () => {
    setGameState({
      caseTitle: '',
      scenario: '',
      interactions: [],
      currentRound: 0,
      maxRounds: 5,
      gameStarted: false,
      gameEnded: false,
    });
    setResetKey(prev => prev + 1);
  };

  if (!mounted) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-blue-50 dark:from-gray-900 dark:via-cyan-900 dark:to-teal-900">
      <GameHeader 
        gameTitle="Food Safety Simulation"
        showTimestamp={true}
        startTiming={gameState.gameStarted && !gameState.gameEnded}
        gameEnded={gameState.gameEnded}
        resetKey={resetKey}
      />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <SparklesText 
              className="text-4xl font-bold mb-4"
              colors={SPARKLE_COLORS.cyan}
            >
              Food Safety Crisis
            </SparklesText>
            <p className="text-lg text-cyan-700 dark:text-cyan-300">
              Critical Thinking | Maggi Crisis Simulation
            </p>
          </div>

          {!gameState.gameStarted ? (
            /* Start Screen */
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
              <h2 className="text-2xl font-bold mb-4 text-cyan-800 dark:text-cyan-200">
                Test Your Critical Thinking Skills
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                You are the CEO of Nestlé India during the 2015 Maggi crisis. The FSSAI has 
                issued a nationwide ban claiming excess lead and MSG. Use critical thinking 
                to challenge their evidence and save your product.
              </p>
              <button
                onClick={startFoodSafetySimulation}
                disabled={loading}
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
              >
                {loading ? 'Starting Crisis...' : 'Enter Crisis Room'}
              </button>
            </div>
          ) : (
            /* Game Interface */
            <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[600px]">
              
              {/* Left Column - Case Info & Actions */}
              <div className="lg:col-span-1 space-y-4">
                {/* Case Information */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sticky top-4">
                  <h2 className="text-lg font-bold mb-2 text-cyan-800 dark:text-cyan-200">
                    {gameState.caseTitle || 'Food Safety Crisis'}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Round {gameState.currentRound} of {gameState.maxRounds}
                  </p>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div 
                      className="bg-cyan-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${(gameState.currentRound / gameState.maxRounds) * 100}%` }}
                    ></div>
                  </div>
                  
                  {/* Current Scores */}
                  {gameState.scores && (
                    <div className="space-y-2">
                      <div className="text-center p-2 bg-cyan-50 dark:bg-cyan-900/20 rounded">
                        <p className="text-sm text-cyan-700 dark:text-cyan-300">
                          Insightfulness: <span className="font-bold">{gameState.scores.insightfulness}/5</span>
                        </p>
                      </div>
                      <div className="text-center p-2 bg-cyan-50 dark:bg-cyan-900/20 rounded">
                        <p className="text-sm text-cyan-700 dark:text-cyan-300">
                          Evidence Evaluation: <span className="font-bold">{gameState.scores.evidenceEvaluation}/5</span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {!gameState.gameEnded && (
                  /* Action Panel */
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sticky top-4">
                    <h3 className="text-lg font-semibold mb-3 text-cyan-800 dark:text-cyan-200">
                      CEO Response Options
                    </h3>
                    
                    <div className="space-y-2">
                      <button
                        onClick={() => handleCEOResponse('ask_lab_report')}
                        disabled={loading}
                        className="w-full bg-cyan-100 hover:bg-cyan-200 dark:bg-cyan-800 dark:hover:bg-cyan-700 text-cyan-800 dark:text-cyan-200 px-3 py-2 rounded border disabled:opacity-50 text-sm text-left"
                      >
                        📊 Ask for Lab Report
                      </button>
                      <button
                        onClick={() => handleCEOResponse('ask_calibration_data')}
                        disabled={loading}
                        className="w-full bg-cyan-100 hover:bg-cyan-200 dark:bg-cyan-800 dark:hover:bg-cyan-700 text-cyan-800 dark:text-cyan-200 px-3 py-2 rounded border disabled:opacity-50 text-sm text-left"
                      >
                        🔬 Ask for Calibration Data
                      </button>
                      <button
                        onClick={() => handleCEOResponse('ask_testing_process')}
                        disabled={loading}
                        className="w-full bg-cyan-100 hover:bg-cyan-200 dark:bg-cyan-800 dark:hover:bg-cyan-700 text-cyan-800 dark:text-cyan-200 px-3 py-2 rounded border disabled:opacity-50 text-sm text-left"
                      >
                        🧪 Ask About Testing Process
                      </button>
                      <button
                        onClick={() => handleCEOResponse('challenge_sample_size')}
                        disabled={loading}
                        className="w-full bg-cyan-100 hover:bg-cyan-200 dark:bg-cyan-800 dark:hover:bg-cyan-700 text-cyan-800 dark:text-cyan-200 px-3 py-2 rounded border disabled:opacity-50 text-sm text-left"
                      >
                        📋 Challenge Sample Size
                      </button>
                      <button
                        onClick={() => handleCEOResponse('submit_final_position')}
                        disabled={loading}
                        className="w-full bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700 text-red-800 dark:text-red-200 px-3 py-2 rounded border disabled:opacity-50 text-sm text-left"
                      >
                        📋 Submit Final Position
                      </button>
                      <button
                        onClick={getHint}
                        disabled={loading}
                        className="w-full bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-800 dark:hover:bg-yellow-700 text-yellow-800 dark:text-yellow-200 px-3 py-2 rounded border disabled:opacity-50 text-sm text-left"
                      >
                        💡 Get Hint
                      </button>
                    </div>

                    <div className="mt-4 space-y-2">
                      <textarea
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder="Enter your custom question or challenge..."
                        className="w-full p-3 border rounded-lg resize-none h-20 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-sm"
                        disabled={loading}
                      />
                      <button
                        onClick={() => handleCEOResponse('custom_response')}
                        disabled={loading || !userInput.trim()}
                        className="w-full bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 text-sm"
                      >
                        {loading ? 'Processing...' : 'Send Response'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Conversation History */}
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg h-full min-h-[600px] flex flex-col">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-cyan-800 dark:text-cyan-200">
                      Crisis Meeting
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Live conversation between FSSAI Head and CEO
                    </p>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-4">
                      {gameState.interactions.length === 0 ? (
                        <div className="text-center text-gray-500 mt-8">
                          <p>Crisis meeting will begin shortly...</p>
                        </div>
                      ) : (
                        gameState.interactions.map((interaction, index) => (
                          <div
                            key={index}
                            className={`flex ${interaction.type === 'ceo' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[80%] p-4 rounded-lg ${
                              interaction.type === 'fssai'
                                ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                                : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                            }`}>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold text-sm">
                                  {interaction.type === 'fssai' ? '🏛️ FSSAI Head' : '👤 CEO'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {interaction.timestamp.toLocaleTimeString()}
                                </span>
                              </div>
                              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                {interaction.content}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {gameState.gameEnded && (
              /* Results Section */
              <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-cyan-800 dark:text-cyan-200">
                  Crisis Results
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Insightfulness:</p>
                      <p className="text-lg font-bold text-cyan-600">{gameState.scores?.insightfulness || 0}/5</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Evidence Evaluation:</p>
                      <p className="text-lg font-bold text-cyan-600">{gameState.scores?.evidenceEvaluation || 0}/5</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Final Verdict:</p>
                      <p className={`text-lg font-bold ${
                        gameState.finalVerdict === 'ban_lifted' 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {gameState.finalVerdict === 'ban_lifted' ? 'Ban Lifted' : 'Ban Upheld'}
                      </p>
                    </div>
                  </div>
                  {gameState.finalStatement && (
                    <div>
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Final Assessment:</p>
                      <div className="text-sm bg-gray-50 dark:bg-gray-700 p-4 rounded border">
                        <div className="whitespace-pre-wrap leading-relaxed">
                          {gameState.finalStatement}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-4">
                    <button
                      onClick={restartGame}
                      className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg"
                    >
                      Start New Crisis
                    </button>
                    <button
                      onClick={() => router.push('/')}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
                    >
                      Return Home
                    </button>
                  </div>
                </div>
              </div>
            )}
            </>
          )}
        </div>
      </div>
    </main>
  );
} 