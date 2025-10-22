'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import CharacterActionPanel from './Components/CharacterActionPanel';
import EvidenceActionPanel from './Components/EvidenceActionPanel';
import AnswerPanel from './Components/AnswerPanel';
import ArrestResult from './Components/ArrestResult';
import { ThemeProvider } from '@/utils/theme';
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { TextAnimate } from "@/components/magicui/text-animate";

import { useGameSession } from '@/lib/gameSession';
import { updateUserStatsOnGameStart } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { calculateSimulationScore, formatFinalScores } from '@/utils/scoring';
import GameHeader from '@/components/ui/GameHeader';

interface GameState {
  started: boolean;
  mode: string | null;
  caseDetails: string;
  suspects: string[];
  evidence: string[];
  interrogatedSuspects: string[];
  analyzedEvidence: string[];
  currentAction: string | null;
  currentResponse: string;
  hints: string[];
  currentHint: number;
  currentSuspect: string | null;
  gameOver?: boolean;
  correctSuspect?: string;
  correctSuspectIdentified?: boolean;
  explanation?: string;
  finalElapsedTime?: string;
  arrestResult?: {
    correct: boolean;
    murderer: string;
    suspectArrested: string;
    reasoning: string;
  };
}

export default function GameContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = 'quick';
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const { userData } = useAuth();
  const { startSession, endSession, updateSession, addEvidence, addAction, incrementHints, getCurrentSession } = useGameSession();
  const [gameState, setGameState] = useState<GameState>({
    started: false,
    mode: null,
    caseDetails: '',
    suspects: [],
    evidence: [],
    interrogatedSuspects: [],
    analyzedEvidence: [],
    currentAction: null,
    currentResponse: '',
    hints: [
      "Remember to carefully read the crime scene description for initial clues.",
      "Pay attention to discrepancies in suspects' statements.",
      "Physical evidence often contains crucial information.",
      "The murder weapon may provide insights about the killer.",
      "Consider motive, opportunity, and means for each suspect."
    ],
    currentHint: 0,
    currentSuspect: null,
    gameOver: false
  });
  const [loading, setLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [sessionInfo, setSessionInfo] = useState(getCurrentSession());
  const hasStartedRef = useRef(false); // Prevent duplicate game starts

  // Update session info periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionInfo(getCurrentSession());
    }, 1000);

    return () => clearInterval(interval);
  }, [getCurrentSession]);

  // start new game
  const startGame = useCallback(async () => {
    // Prevent duplicate calls
    if (hasStartedRef.current) {
      console.log('⚠️ Game already started, skipping duplicate call');
      return;
    }

    hasStartedRef.current = true;
    setLoading(true);

    try {
      const response = await fetch('/api/start-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'quick' })
      });

      if (!response.ok) {
        throw new Error('Failed to start game');
      }

      const data = await response.json();

      // Start game session tracking AFTER AI response is received
      await startSession('quick');

      // Update user stats when game starts (count games on start, not end)
      if (userData?.uid) {
        console.log(`📊 Updating user stats for game start: quick`);
        await updateUserStatsOnGameStart(userData.uid, 'quick');
        console.log(`✅ User stats updated for game start`);
      }

      setGameState(prevState => ({
        ...prevState,
        started: true,
        mode: 'quick',
        caseDetails: data.caseDetails,
        suspects: data.suspects,
        evidence: data.evidence,
        interrogatedSuspects: [],
        analyzedEvidence: [],
        currentAction: null,
        currentResponse: '',
        gameOver: false,
        arrestResult: undefined,
        hints: data.hints || []
      }));
      setResetKey(prev => prev + 1);
    } catch (error) {
      console.error('Error starting game:', error);
      alert('Something went wrong. Please try again.');
      hasStartedRef.current = false; // Reset on error
    } finally {
      setLoading(false);
    }
  }, [startSession, userData]);

  // Start game when component is mounted
  useEffect(() => {
    if (!hasStartedRef.current) {
      startGame();
    }
  }, [startGame]);

  // Cleanup session on component unmount or page leave
  useEffect(() => {
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      const session = getCurrentSession();
      if (session.isActive && !gameState.gameOver) {
        // Only end session if game is not over and user is actually leaving
        await endSession(false, 0);
      }
    };

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden') {
        const session = getCurrentSession();
        if (session.isActive && !gameState.gameOver) {
          // Don't end session on visibility change, just let it track time
          console.log('Game minimized, session continues...');
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Don't end session on unmount - let proper game end flow handle it
      // This prevents race conditions where cleanup happens before proper game end
    };
  }, [gameState.gameOver]);

  // toggle theme
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // interrogate suspect
  const interrogateSuspect = async (suspect: string) => {
    if (loading) return;
    
    setLoading(true);
    setGameState(prev => ({ 
      ...prev, 
      currentAction: 'interrogate',
      currentSuspect: suspect 
    }));

    try {
      // Track this action in the session
      await addAction(`Interrogated ${suspect}`);
      
      const response = await fetch('/api/interrogate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suspect,
          caseDetails: gameState.caseDetails,
          interrogatedSuspects: gameState.interrogatedSuspects
        })
      });

      if (!response.ok) {
        throw new Error('Failed to interrogate suspect');
      }

      const data = await response.json();
      
      setGameState(prev => ({
        ...prev,
        currentResponse: data.response,
        interrogatedSuspects: [...prev.interrogatedSuspects, suspect]
      }));
    } catch (error) {
      console.error('Error interrogating suspect:', error);
      alert('Something went wrong during interrogation.');
    } finally {
      setLoading(false);
    }
  };

  // analyse evidence
  const analyzeEvidence = async (evidence: string) => {
    if (loading) return;
    
    setLoading(true);
    setGameState(prev => ({ 
      ...prev, 
      currentAction: 'analyze',
      currentSuspect: null 
    }));

    try {
      // Track evidence analysis
      await addEvidence(`Analyzed: ${evidence}`);
      await addAction(`Analyzed evidence: ${evidence}`);
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evidence,
          caseDetails: gameState.caseDetails,
          analyzedEvidence: gameState.analyzedEvidence
        })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze evidence');
      }

      const data = await response.json();
      
      setGameState(prev => ({
        ...prev,
        currentResponse: data.response,
        analyzedEvidence: [...prev.analyzedEvidence, evidence]
      }));
    } catch (error) {
      console.error('Error analyzing evidence:', error);
      alert('Something went wrong during evidence analysis.');
    } finally {
      setLoading(false);
    }
  };

  // make arrest
  const makeArrest = async (suspect: string) => {
    if (loading) return;
    
    setLoading(true);
    setGameState(prev => ({ 
      ...prev, 
      currentAction: 'arrest',
      currentSuspect: suspect 
    }));

    if (!confirm(`Are you sure you want to arrest ${suspect}? This will end the case.`)) {
      setLoading(false);
      return;
    }

    try {
      // Track the arrest action
      await addAction(`Arrested ${suspect}`);
      
      const res = await fetch('/api/arrest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          suspectName: suspect,
          gameState: {
            suspects: gameState.suspects,
            caseDetails: gameState.caseDetails,
            interrogatedSuspects: gameState.interrogatedSuspects,
            analyzedEvidence: gameState.analyzedEvidence
          }
        }),
      });
      
      const data = await res.json();
      console.log('Arrest API response:', data); // Debug logging
      
      if (data.success) {
        // Calculate 3-parameter score for detective simulation
        const isCorrect = data.correctSuspectIdentified;
        const gameContent = `${gameState.caseDetails} Evidence: ${gameState.analyzedEvidence.join(', ')} Suspects: ${gameState.interrogatedSuspects.join(', ')} Result: ${data.reasoning}`;
        
        const score = calculateSimulationScore('DETECTIVE_SIMULATION', gameContent, {
          correct: isCorrect,
          evidenceAnalyzed: gameState.analyzedEvidence.length,
          suspectsInterrogated: gameState.interrogatedSuspects.length,
          hintsUsed: gameState.currentHint + 1
        });
        
        const finalScore = score.overall;
        
        // Capture elapsed time before ending session
        const finalElapsedMinutes = sessionInfo.timeSpent;
        const minutes = Math.floor(finalElapsedMinutes);
        const seconds = Math.floor((finalElapsedMinutes % 1) * 60);
        const finalElapsedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // Save analysis data to game session before ending
        try {
          await updateSession({
            analysis: data.reasoning || data.explanation,
            caseTitle: gameState.caseDetails.substring(0, 100) || 'Quick Investigation',
            scoreBreakdown: data.scores ? {
              parameter1: data.scores.criticalThinking || data.scores.parameter1,
              parameter1Name: 'Critical Thinking',
              parameter2: data.scores.evidenceAnalysis || data.scores.parameter2,
              parameter2Name: 'Evidence Analysis',
              parameter3: data.scores.intuition || data.scores.parameter3,
              parameter3Name: 'Intuition',
              overall: data.scores.overall,
              summary: data.scores.summary
            } : undefined,
            correctAnswer: data.correctSuspect,
            userAnswer: suspect
          });
          console.log('✅ Analysis data saved to game session');
        } catch (error) {
          console.error('❌ Error saving analysis data:', error);
        }

        // End the game session
        await endSession(isCorrect, finalScore);

        setGameState(prev => ({
          ...prev,
          gameOver: true,
          correctSuspect: data.correctSuspect,
          correctSuspectIdentified: data.correctSuspectIdentified,
          explanation: data.reasoning,
          finalElapsedTime: finalElapsedTime,
          arrestResult: {
            correct: data.correctSuspectIdentified,
            murderer: data.correctSuspect,
            suspectArrested: suspect,
            reasoning: data.reasoning
          },
          currentAction: null // Clear current action to show result
        }));
      } else {
        // Handle API error response
        alert('There was an error processing the arrest. Please try again.');
        setGameState(prev => ({
          ...prev,
          currentAction: null
        }));
      }
    } catch (error) {
      console.error('Error making arrest:', error);
      alert('Something went wrong during arrest. Please try again.');
      // Reset the action state so user can try again
      setGameState(prev => ({
        ...prev,
        currentAction: null,
        currentResponse: '',
        currentSuspect: null
      }));
    } finally {
      setLoading(false);
    }
  };

  // navigate b/w hints
  const nextHint = async () => {
    if (gameState.currentHint >= gameState.hints.length - 1) return;
    
    setGameState(prev => ({
      ...prev,
      currentHint: prev.currentHint + 1
    }));
  };

  // show hint
  const getCurrentHint = () => {
    return gameState.hints[gameState.currentHint] || "No more hints available.";
  };

  // end interrogation or analyssis
  const endAction = () => {
    setGameState(prev => ({
      ...prev,
      currentAction: null,
      currentResponse: '',
      currentSuspect: null
    }));
  };

  // show suspect
  const showSuspects = () => {
    setGameState(prev => ({
      ...prev,
      currentAction: 'suspects'
    }));
  };

  // show evidence
  const showEvidence = () => {
    setGameState(prev => ({
      ...prev,
      currentAction: 'evidence'
    }));
  };

  // arrest option show
  const showArrestOptions = () => {
    setGameState(prev => ({
      ...prev,
      currentAction: 'arrest-options'
    }));
  };

  // action panel content
  const renderActionPanel = () => {
    if (!gameState.currentAction) return null;
    
    switch (gameState.currentAction) {
      case 'suspects':
        return (
          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-300'}`}>
            <h3 className="text-xl font-bold mb-4">Suspects</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {gameState.suspects.map((suspect, index) => (
                <button
                  key={index}
                  onClick={() => interrogateSuspect(suspect)}
                  className={`p-3 rounded-lg ${
                    gameState.interrogatedSuspects.includes(suspect)
                      ? theme === 'dark' ? 'bg-green-800' : 'bg-green-600 text-white'
                      : theme === 'dark' ? 'bg-gray-700' : 'bg-white text-gray-800'
                  } hover:bg-blue-600 hover:text-white`}
                >
                  {suspect}
                </button>
              ))}
            </div>
          </div>
        );
        
      case 'evidence':
        return (
          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-300'}`}>
            <h3 className="text-xl font-bold mb-4">Evidence</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {gameState.evidence.map((item, index) => (
                <button
                  key={index}
                  onClick={() => analyzeEvidence(item)}
                  className={`p-3 rounded-lg ${
                    gameState.analyzedEvidence.includes(item)
                      ? theme === 'dark' ? 'bg-green-800' : 'bg-green-600 text-white'
                      : theme === 'dark' ? 'bg-gray-700' : 'bg-white text-gray-800'
                  } hover:bg-blue-600 hover:text-white`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        );
        
      case 'arrest-options':
        return (
          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-300'}`}>
            <h3 className="text-xl font-bold mb-4">Make an Arrest</h3>
            <p className="mb-4">Who do you think is the murderer?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {gameState.suspects.map((suspect, index) => (
                <button
                  key={index}
                  onClick={() => makeArrest(suspect)}
                  className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-red-800' : 'bg-red-600'} hover:bg-red-700 text-white`}
                >
                  {suspect}
                </button>
              ))}
            </div>
          </div>
        );
        
      case 'interrogate':
      case 'analyze':
      case 'arrest':
        return (
          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-300'}`}>
            <h3 className="text-xl font-bold mb-4">
              {gameState.currentAction === 'interrogate'
                ? `Interrogation: ${gameState.currentSuspect}`
                : gameState.currentAction === 'analyze'
                ? 'Evidence Analysis'
                : 'Case Resolution'}
            </h3>
            <div className={`p-3 rounded-lg mb-4 whitespace-pre-wrap ${theme === 'dark' ? 'bg-gray-700' : 'bg-white text-gray-800'}`}>
              {gameState.currentResponse.split('\n\n').map((section, index) => {
                if (section.startsWith('INVESTIGATION SUGGESTIONS:')) {
                  return (
                    <div key={index} className="mb-4">
                      <h4 className="text-lg font-semibold text-blue-400 mb-2">Investigation Suggestions:</h4>
                      <div className={`pl-4 ${theme === 'light' ? 'text-gray-800' : ''}`}>
                        {section.replace('INVESTIGATION SUGGESTIONS:', '').trim()}
                      </div>
                    </div>
                  );
                }
                if (section.startsWith('SUSPECT STATEMENT:')) {
                  return (
                    <div key={index}>
                      <h4 className="text-lg font-semibold text-green-400 mb-2">Suspect Statement:</h4>
                      <div className={`pl-4 ${theme === 'light' ? 'text-gray-800' : ''}`}>
                        {section.replace('SUSPECT STATEMENT:', '').trim()}
                      </div>
                    </div>
                  );
                }
                return <div key={index} className={theme === 'light' ? 'text-gray-800' : ''}>{section}</div>;
              })}
            </div>
            <button
              onClick={endAction}
              className="p-2 bg-blue-700 hover:bg-blue-600 rounded text-white"
            >
              {gameState.currentAction === 'interrogate' ? 'End Interrogation' : 'Back'}
            </button>
          </div>
        );
        
      default:
        return null;
    }
  };

  // main game interface
  return (
    <ThemeProvider value={{ theme, toggleTheme }}>
      <GameHeader 
        gameTitle="Quick Investigation" 
        showTimestamp={true} 
        startTiming={sessionInfo.isActive && !gameState.gameOver}
        gameEnded={gameState.gameOver}
        resetKey={resetKey}
        sessionStartTime={sessionInfo.startTime}
      />
      <div className={`game-content min-h-screen p-4 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-slate-100 text-black'}`}>
        {/* Header and theme toggle */}
        <div className="flex justify-between items-center mb-4">
          <TextAnimate
            className="text-2xl font-bold"
            animation="slideUp"
            by="word" 
            duration={0.3}
          >
            Mystery Detective Game
          </TextAnimate>
          <div className="flex space-x-2">
            <ShimmerButton
              onClick={toggleTheme}
              className="px-3 py-1"
              shimmerColor="rgba(255, 255, 255, 0.5)"
              shimmerSize="0.05em"
              shimmerDuration="2s"
              borderRadius="0.375rem"
              background={theme === 'dark' ? 'rgb(51, 65, 85)' : 'rgb(203, 213, 225)'}
            >
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </ShimmerButton>
            {gameState.hints.length < gameState.hints.length && (
              <ShimmerButton
                onClick={nextHint}
                className="px-3 py-1"
                shimmerColor="rgba(255, 255, 255, 0.8)"
                shimmerSize="0.05em"
                shimmerDuration="2s"
                borderRadius="0.375rem"
                background="rgb(79, 70, 229)"
              >
                Unlock Hint ({gameState.currentHint + 1}/{gameState.hints.length})
              </ShimmerButton>
            )}
          </div>
        </div>

        {/* Display arrest result if available */}
        {gameState.arrestResult ? (
          <ArrestResult gameState={gameState} resetGame={startGame} />
        ) : (
          <>
            {/* Rest of game content */}
            <div className="flex">
              {/* sidebar */}
              <div className={`w-48 fixed h-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}>
                <div className="flex flex-col h-full">
                  <div className="p-4 flex justify-center">
                    <Link href="/">
                      <Image 
                        src="/img.png" 
                        alt="DetectAive Logo" 
                        width={80} 
                        height={80} 
                        className="cursor-pointer"
                        priority
                        unoptimized
                      />
                    </Link>
                  </div>
                  
                  {/* Home Button */}
                  <div className="px-4 mb-0">
                    <Link href="/">
                      <ShimmerButton 
                        className="w-full p-2 flex items-center justify-center"
                        shimmerColor="rgba(255, 255, 255, 0.5)"
                        shimmerSize="0.05em"
                        shimmerDuration="2s"
                        borderRadius="0.375rem"
                        background={theme === 'dark' ? 'rgb(55, 65, 81)' : 'rgb(255, 255, 255)'}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`} viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                        </svg>
                        <span className={theme === 'dark' ? 'text-white' : 'text-gray-800'}>Home</span>
                      </ShimmerButton>
                    </Link>
                  </div>
                  
                  <div className="p-4 flex-grow">
                    <div className="mb-2">
                      <ShimmerButton 
                        onClick={startGame}
                        className="w-full p-2 flex justify-between"
                        shimmerColor="rgba(255, 255, 255, 0.5)"
                        shimmerSize="0.05em"
                        shimmerDuration="2s"
                        borderRadius="0.375rem"
                        background={theme === 'dark' ? 'rgb(55, 65, 81)' : 'rgb(255, 255, 255)'}
                      >
                        <span className={theme === 'dark' ? 'text-white' : 'text-gray-800'}>New Case</span>
                      </ShimmerButton>
                    </div>
                    
                    {gameState.started && (
                      <div className="mt-8">
                        <p className="text-sm text-amber-500 font-normal mb-2">
                          Case Info
                        </p>
                        <div className={`mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                          {(gameState.mode || 'Quick').charAt(0).toUpperCase() + (gameState.mode || 'Quick').slice(1)} Case
                        </div>
                        <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                          <div className="mb-1">Suspects: {gameState.interrogatedSuspects.length}/{gameState.suspects.length}</div>
                          <div>Evidence: {gameState.analyzedEvidence.length}/{gameState.evidence.length}</div>
                        </div>
                        
                        <div className="mt-4">
                          <ShimmerButton 
                            onClick={() => setShowGuide(!showGuide)}
                            className="w-full p-2 flex justify-between items-center"
                            shimmerColor="rgba(255, 255, 255, 0.5)"
                            shimmerSize="0.05em"
                            shimmerDuration="2s"
                            borderRadius="0.375rem"
                            background="rgb(217, 119, 6)"
                          >
                            <span className="text-white">Guide</span>
                            <span className="text-white">{showGuide ? '▲' : '▼'}</span>
                          </ShimmerButton>
                          
                          {showGuide && (
                            <div className={`mt-2 p-3 ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-amber-100 text-gray-800'} rounded`}>
                              <div className="mb-2">{getCurrentHint()}</div>
                              <ShimmerButton
                                onClick={nextHint}
                                className="w-full p-2 text-sm"
                                shimmerColor="rgba(255, 255, 255, 0.5)"
                                shimmerSize="0.05em"
                                shimmerDuration="2s"
                                borderRadius="0.375rem"
                                background={theme === 'dark' ? 'rgb(30, 41, 59)' : 'rgb(217, 119, 6)'}
                              >
                                <span className="text-white">Next Hint</span>
                              </ShimmerButton>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className={`p-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`}>
                    <div className="flex justify-center">
                      <ShimmerButton
                        onClick={toggleTheme}
                        className="w-full px-3 py-2 flex items-center justify-center"
                        shimmerColor="rgba(255, 255, 255, 0.5)"
                        shimmerSize="0.05em"
                        shimmerDuration="2s"
                        borderRadius="0.375rem"
                        background={theme === 'dark' ? 'rgb(51, 65, 85)' : 'rgb(209, 213, 219)'}
                      >
                        <span className={theme === 'dark' ? 'text-white' : 'text-gray-800'}>
                          {theme === 'dark' ? '🌙 Light Mode' : '☀️ Dark Mode'}
                        </span>
                      </ShimmerButton>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* main content */}
              <div className="ml-48 flex-grow p-8">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-2xl">Loading...</div>
                  </div>
                ) : (
                  <div className="max-w-4xl mx-auto">
                    {/* case details */}
                    <div className="mb-8">
                      <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-300'}`}>
                        <TextAnimate
                          className="text-xl font-bold mb-4"
                          animation="slideUp"
                          by="word"
                          duration={0.3}
                        >
                          Case File
                        </TextAnimate>
                        <div className={`p-6 rounded-lg whitespace-pre-wrap ${theme === 'dark' ? 'bg-gray-700' : 'bg-white text-gray-800'}`}>
                          {gameState.caseDetails}
                        </div>
                      </div>
                    </div>
                    
                    {/* action buttons */}
                    {gameState.started && !gameState.currentAction && (
                      <div className="mb-8">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <ShimmerButton
                            onClick={showSuspects}
                            className="w-full p-4 text-white"
                            shimmerColor="rgba(255, 255, 255, 0.8)"
                            shimmerSize="0.1em"
                            shimmerDuration="2s"
                            background="rgb(29, 78, 216)"
                            borderRadius="0.5rem"
                          >
                            Interrogate Suspects
                          </ShimmerButton>
                          <ShimmerButton
                            onClick={showEvidence}
                            className="w-full p-4 text-white"
                            shimmerColor="rgba(255, 255, 255, 0.8)"
                            shimmerSize="0.1em"
                            shimmerDuration="2s"
                            background="rgb(21, 128, 61)"
                            borderRadius="0.5rem"
                          >
                            Analyze Evidence
                          </ShimmerButton>
                          <ShimmerButton
                            onClick={showArrestOptions}
                            className="w-full p-4 text-white"
                            shimmerColor="rgba(255, 255, 255, 0.8)"
                            shimmerSize="0.1em"
                            shimmerDuration="2s"
                            background="rgb(185, 28, 28)"
                            borderRadius="0.5rem"
                          >
                            Make an Arrest
                          </ShimmerButton>
                        </div>
                      </div>
                    )}
                    
                    {/* action panel */}
                    {renderActionPanel()}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </ThemeProvider>
  );
} 