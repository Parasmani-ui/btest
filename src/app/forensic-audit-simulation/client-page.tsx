'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GameHeader from '@/components/ui/GameHeader';
import { SparklesText } from '@/components/magicui/sparkles-text';
import { useGameSession, handleGameEnd } from '@/lib/gameSession';

// Define colors for the forensic audit theme (gold/amber theme)
const SPARKLE_COLORS = {
  gold: { first: "#f59e0b", second: "#fbbf24" }
};

interface ForensicAuditState {
  caseTitle: string;
  keyAnomalies: string[];
  interactions: Array<{
    type: 'auditor' | 'cfo';
    content: string;
    timestamp: Date;
  }>;
  currentRound: number;
  maxRounds: number;
  gameStarted: boolean;
  gameEnded: boolean;
  outcome?: 'escalation' | 'internal_audit';
  cfoScore?: number;
  finalStatement?: string;
}

export default function ForensicAuditSimulationClientPage() {
  const router = useRouter();
  const { startSession } = useGameSession();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [gameState, setGameState] = useState<ForensicAuditState>({
    caseTitle: '',
    keyAnomalies: [],
    interactions: [],
    currentRound: 0,
    maxRounds: 5,
    gameStarted: false,
    gameEnded: false,
  });
  const [userInput, setUserInput] = useState('');
  const [actionType, setActionType] = useState<string>('');
  const [sessionStarted, setSessionStarted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const startForensicAudit = async () => {
    setLoading(true);
    try {
      // Start game session tracking
      if (!sessionStarted) {
        await startSession('forensic-audit');
        console.log('✅ Forensic audit simulation session started');
        setSessionStarted(true);
      }
      
      const response = await fetch('/api/forensic-audit-simulation/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'start_audit'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGameState(prev => ({
          ...prev,
          caseTitle: data.caseTitle,
          keyAnomalies: data.keyAnomalies,
          interactions: [
            {
              type: 'auditor',
              content: data.openingStatement,
              timestamp: new Date()
            }
          ],
          gameStarted: true,
          currentRound: 1
        }));
      }
    } catch (error) {
      console.error('Error starting forensic audit:', error);
    }
    setLoading(false);
  };

  const handleCFOResponse = async (action: string, input?: string) => {
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

      const response = await fetch('/api/forensic-audit-simulation/analyze', {
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
            type: 'cfo' as const,
            content: input || userInput || action,
            timestamp: new Date()
          },
          {
            type: 'auditor' as const,
            content: data.auditorResponse,
            timestamp: new Date()
          }
        ];

        setGameState(prev => ({
          ...prev,
          interactions: newInteractions,
          currentRound: prev.currentRound + 1,
          gameEnded: data.gameEnded || prev.currentRound + 1 >= prev.maxRounds,
          cfoScore: data.cfoScore,
          outcome: data.outcome,
          finalStatement: data.finalStatement
        }));

        // End game session when simulation completes
        if (data.gameEnded || gameState.currentRound + 1 >= gameState.maxRounds) {
          const totalScore = calculateForensicScore(data.cfoScore, data.outcome);
          const caseSolved = totalScore >= 70; // Consider case solved if score >= 70%
          
          try {
            await handleGameEnd(caseSolved, totalScore);
            console.log('✅ Forensic audit simulation stats updated successfully');
          } catch (error) {
            console.error('❌ Error updating forensic audit simulation stats:', error);
          }
        }

        setUserInput('');
        setActionType('');
      }
    } catch (error) {
      console.error('Error processing CFO response:', error);
    }
    setLoading(false);
  };

  const getHint = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/forensic-audit-simulation/analyze', {
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
              type: 'auditor',
              content: data.auditorResponse,
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
      keyAnomalies: [],
      interactions: [],
      currentRound: 0,
      maxRounds: 5,
      gameStarted: false,
      gameEnded: false,
    });
    setResetKey(prev => prev + 1);
  };

  // Calculate score for forensic audit simulation
  const calculateForensicScore = (cfoScore?: number, outcome?: string): number => {
    // Use the score from the API if available
    if (cfoScore && cfoScore > 0) {
      return cfoScore;
    }
    
    // Otherwise calculate based on outcome
    let score = 50; // Base score
    
    if (outcome === 'escalation') {
      score += 30; // Successful escalation
    } else if (outcome === 'internal_audit') {
      score += 20; // Internal audit resolved
    }
    
    return Math.min(100, score);
  };

  if (!mounted) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-gray-900 dark:via-amber-900 dark:to-yellow-900">
      <GameHeader 
        gameTitle="Forensic Audit Simulation"
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
              colors={SPARKLE_COLORS.gold}
            >
              Forensic Audit Simulation
            </SparklesText>
            <p className="text-lg text-amber-700 dark:text-amber-300">
              Critical Ledger | Financial Anomaly Investigation
            </p>
          </div>

          {!gameState.gameStarted ? (
            /* Start Screen */
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
              <h2 className="text-2xl font-bold mb-4 text-amber-800 dark:text-amber-200">
                Test Your Financial Investigation Skills
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                You are the CFO facing a forensic audit. Analyse financial anomalies, 
                challenge inconsistencies, and decide whether to escalate to the board 
                or recommend internal review.
              </p>
              <button
                onClick={startForensicAudit}
                disabled={loading}
                className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
              >
                {loading ? 'Starting Audit...' : 'Start Forensic Audit'}
              </button>
            </div>
          ) : (
            /* Game Interface - Improved Layout */
            <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[600px]">
              
              {/* Left Column - Case Info & Actions */}
              <div className="lg:col-span-1 space-y-4">
                {/* Case Information */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sticky top-4">
                  <h2 className="text-lg font-bold mb-2 text-amber-800 dark:text-amber-200">
                    {gameState.caseTitle || 'Forensic Audit Case'}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Round {gameState.currentRound} of {gameState.maxRounds}
                  </p>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div 
                      className="bg-amber-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${(gameState.currentRound / gameState.maxRounds) * 100}%` }}
                    ></div>
                  </div>
                  
                  {/* Current Score */}
                  {gameState.cfoScore !== undefined && (
                    <div className="text-center p-2 bg-amber-50 dark:bg-amber-900/20 rounded">
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        Investigation Score: <span className="font-bold">{gameState.cfoScore}/4</span>
                      </p>
                    </div>
                  )}
                </div>

                {!gameState.gameEnded && (
                  /* Action Panel */
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sticky top-4">
                    <h3 className="text-lg font-semibold mb-3 text-amber-800 dark:text-amber-200">
                      CFO Response Options
                    </h3>
                    
                    <div className="space-y-2">
                      <button
                        onClick={() => handleCFOResponse('request_excel_metadata')}
                        disabled={loading}
                        className="w-full bg-amber-100 hover:bg-amber-200 dark:bg-amber-800 dark:hover:bg-amber-700 text-amber-800 dark:text-amber-200 px-3 py-2 rounded border disabled:opacity-50 text-sm text-left"
                      >
                        📊 Request Excel Metadata
                      </button>
                      <button
                        onClick={() => handleCFOResponse('request_sap_logs')}
                        disabled={loading}
                        className="w-full bg-amber-100 hover:bg-amber-200 dark:bg-amber-800 dark:hover:bg-amber-700 text-amber-800 dark:text-amber-200 px-3 py-2 rounded border disabled:opacity-50 text-sm text-left"
                      >
                        💻 Request SAP Logs
                      </button>
                      <button
                        onClick={() => handleCFOResponse('probe_vendor_gst')}
                        disabled={loading}
                        className="w-full bg-amber-100 hover:bg-amber-200 dark:bg-amber-800 dark:hover:bg-amber-700 text-amber-800 dark:text-amber-200 px-3 py-2 rounded border disabled:opacity-50 text-sm text-left"
                      >
                        🏢 Probe Vendor GST
                      </button>
                      <button
                        onClick={() => handleCFOResponse('challenge_emergency_approvals')}
                        disabled={loading}
                        className="w-full bg-amber-100 hover:bg-amber-200 dark:bg-amber-800 dark:hover:bg-amber-700 text-amber-800 dark:text-amber-200 px-3 py-2 rounded border disabled:opacity-50 text-sm text-left"
                      >
                        ⚠️ Challenge Emergency Approvals
                      </button>
                      <button
                        onClick={() => handleCFOResponse('submit_final_position')}
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
                        placeholder="Enter your custom response or question..."
                        className="w-full p-3 border rounded-lg resize-none h-20 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-sm"
                        disabled={loading}
                      />
                      <button
                        onClick={() => handleCFOResponse('custom_response')}
                        disabled={loading || !userInput.trim()}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 text-sm"
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
                    <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200">
                      Audit Proceedings
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Live conversation between Auditor and CFO
                    </p>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-4">
                      {gameState.interactions.length === 0 ? (
                        <div className="text-center text-gray-500 mt-8">
                          <p>Audit proceedings will appear here...</p>
                        </div>
                      ) : (
                        gameState.interactions.map((interaction, index) => (
                          <div
                            key={index}
                            className={`flex ${interaction.type === 'cfo' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[80%] p-4 rounded-lg ${
                              interaction.type === 'auditor'
                                ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                                : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                            }`}>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold text-sm">
                                  {interaction.type === 'auditor' ? '🔍 Auditor' : '👤 CFO'}
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
              /* Results Section - Shows at the bottom when game ends */
              <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-amber-800 dark:text-amber-200">
                  Audit Results
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">CFO Score:</p>
                      <p className="text-lg font-bold text-amber-600">{gameState.cfoScore}/4</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Outcome:</p>
                      <p className={`text-lg font-bold ${
                        gameState.outcome === 'escalation' 
                          ? 'text-red-600' 
                          : 'text-green-600'
                      }`}>
                        {gameState.outcome === 'escalation' ? 'Board Escalation' : 'Internal Audit'}
                      </p>
                    </div>
                  </div>
                  {gameState.finalStatement && (
                    <div>
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Final Assessment:</p>
                      <p className="text-sm bg-gray-50 dark:bg-gray-700 p-3 rounded">
                        {gameState.finalStatement}
                      </p>
                    </div>
                  )}
                  <div className="flex gap-4">
                    <button
                      onClick={restartGame}
                      className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg"
                    >
                      Start New Audit
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