'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { SparklesText } from "@/components/magicui/sparkles-text";
import { useGameSession } from '@/lib/gameSession';
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
  const { startSession, endSession, addEvidence, addAction, incrementHints, getCurrentSession } = useGameSession();
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

  // start new game
  const startGame = useCallback(async () => {
    setLoading(true);
    try {
      // Start game session tracking
      await startSession('quick');
      
      const response = await fetch('/api/start-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'quick' })
      });

      if (!response.ok) {
        throw new Error('Failed to start game');
      }

      const data = await response.json();
      
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
        arrestResult: undefined
      }));
    } catch (error) {
      console.error('Error starting game:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [startSession]);

  // Start game when component is mounted
  useEffect(() => {
    startGame();
  }, []);

  // Cleanup session on component unmount or page leave
  useEffect(() => {
    const handleBeforeUnload = async () => {
      const session = getCurrentSession();
      if (session.isActive) {
        // End session without score if user leaves unexpectedly
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
      // End session when component unmounts
      const session = getCurrentSession();
      if (session.isActive && !gameState.gameOver) {
        endSession(false, 0);
      }
    };
  }, []);

  // toggle theme
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // interrogate suspect
  const interrogateSuspect = async (suspect: string) => {
    setLoading(true);
    try {
      // Track this action in the session
      await addAction(`Interrogated ${suspect}`);
      
      const response = await fetch('/api/interrogate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suspect })
      });

      if (!response.ok) {
        throw new Error('Failed to interrogate suspect');
      }

      const data = await response.json();
      
      setGameState({
        ...gameState,
        currentAction: 'interrogate',
        currentResponse: data.response,
        interrogatedSuspects: [...gameState.interrogatedSuspects, suspect],
        currentSuspect: suspect
      });
    } catch (error) {
      console.error('Error interrogating suspect:', error);
      alert('Something went wrong during interrogation.');
    } finally {
      setLoading(false);
    }
  };

  // analyse evidence
  const analyzeEvidence = async (evidence: string) => {
    setLoading(true);
    try {
      // Track evidence analysis
      await addEvidence(`Analyzed: ${evidence}`);
      await addAction(`Analyzed evidence: ${evidence}`);
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evidence })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze evidence');
      }

      const data = await response.json();
      
      setGameState({
        ...gameState,
        currentAction: 'analyze',
        currentResponse: data.response,
        analyzedEvidence: [...gameState.analyzedEvidence, evidence]
      });
    } catch (error) {
      console.error('Error analyzing evidence:', error);
      alert('Something went wrong during evidence analysis.');
    } finally {
      setLoading(false);
    }
  };

  // make arrest
  const makeArrest = async (suspect: string) => {
    if (!confirm(`Are you sure you want to arrest ${suspect}? This will end the case.`)) {
      return;
    }

    setLoading(true);
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
          gameState
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        // Calculate score based on correctness and efficiency
        const isCorrect = data.correctSuspectIdentified;
        const baseScore = isCorrect ? 100 : 0;
        const evidenceBonus = gameState.analyzedEvidence.length * 5; // 5 points per evidence analyzed
        const interrogationBonus = gameState.interrogatedSuspects.length * 3; // 3 points per suspect interrogated
        const hintsUsed = gameState.currentHint + 1;
        const hintPenalty = hintsUsed * 2; // 2 points penalty per hint used
        
        const finalScore = Math.max(0, baseScore + evidenceBonus + interrogationBonus - hintPenalty);
        
        // End the game session
        await endSession(isCorrect, finalScore);
        
        setGameState({
          ...gameState,
          gameOver: true,
          arrestResult: {
            correct: data.correctSuspectIdentified,
            murderer: data.correctSuspect,
            suspectArrested: suspect,
            reasoning: data.reasoning
          },
          currentAction: 'arrest-result'
        });
      }
    } catch (error) {
      console.error('Error making arrest:', error);
      alert('Something went wrong during arrest.');
    } finally {
      setLoading(false);
    }
  };

  // navigate b/w hints
  const nextHint = async () => {
    // Track hint usage
    await incrementHints();
    await addAction('Used a hint');
    
    // first check local hints list
    if (gameState.currentHint < gameState.hints.length - 1) {
      setGameState({
        ...gameState,
        currentHint: gameState.currentHint + 1
      });
      return;
    }
    
    // new hints from server
    try {
      const response = await fetch('/api/hint');
      
      if (!response.ok) {
        throw new Error('Failed to get hint');
      }
      
      const data = await response.json();
      
      if (data.hint && data.hint.trim() !== '') {
        setGameState({
          ...gameState,
          hints: [...gameState.hints, data.hint],
          currentHint: gameState.hints.length
        });
      }
    } catch (error) {
      console.error('Error getting hint:', error);
    }
  };

  // show hint
  const getCurrentHint = () => {
    return gameState.hints[gameState.currentHint];
  };

  // end interrogation or analyssis
  const endAction = () => {
    setGameState({
      ...gameState,
      currentAction: null,
      currentResponse: ''
    });
  };

  // show suspect
  const showSuspects = () => {
    setGameState({
      ...gameState,
      currentAction: 'suspects'
    });
  };

  // show evidence
  const showEvidence = () => {
    setGameState({
      ...gameState,
      currentAction: 'evidence'
    });
  };

  // arrest option show
  const showArrestOptions = () => {
    setGameState({
      ...gameState,
      currentAction: 'arrest-options'
    });
  };

  // action panel content
  const renderActionPanel = () => {
    if (!gameState.currentAction) return null;
    
    switch (gameState.currentAction) {
      case 'suspects':
        return (
          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-blue-800' : 'bg-gray-300'}`}>
            <h3 className="text-xl font-bold mb-4">Suspects</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {gameState.suspects.map((suspect, index) => (
                <button
                  key={index}
                  onClick={() => interrogateSuspect(suspect)}
                  className={`p-3 rounded-lg ${
                    gameState.interrogatedSuspects.includes(suspect)
                      ? theme === 'dark' ? 'bg-green-800' : 'bg-green-600 text-white'
                      : theme === 'dark' ? 'bg-blue-700' : 'bg-white text-gray-800'
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
          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-blue-800' : 'bg-gray-300'}`}>
            <h3 className="text-xl font-bold mb-4">Evidence</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {gameState.evidence.map((item, index) => (
                <button
                  key={index}
                  onClick={() => analyzeEvidence(item)}
                  className={`p-3 rounded-lg ${
                    gameState.analyzedEvidence.includes(item)
                      ? theme === 'dark' ? 'bg-green-800' : 'bg-green-600 text-white'
                      : theme === 'dark' ? 'bg-blue-700' : 'bg-white text-gray-800'
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
          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-blue-800' : 'bg-gray-300'}`}>
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
          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-blue-800' : 'bg-gray-300'}`}>
            <h3 className="text-xl font-bold mb-4">
              {gameState.currentAction === 'interrogate'
                ? `Interrogation: ${gameState.currentSuspect}`
                : gameState.currentAction === 'analyze'
                ? 'Evidence Analysis'
                : 'Case Resolution'}
            </h3>
            <div className={`p-3 rounded-lg mb-4 whitespace-pre-wrap ${theme === 'dark' ? 'bg-blue-700' : 'bg-white text-gray-800'}`}>
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
        startTiming={gameState.started && !loading}
      />
      <div className={`game-content min-h-screen p-4 ${theme === 'dark' ? 'bg-blue-900 text-white' : 'bg-slate-100 text-black'}`}>
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
              <div className={`w-48 fixed h-full ${theme === 'dark' ? 'bg-blue-800' : 'bg-gray-200'}`}>
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
                        <SparklesText
                          className="text-sm text-amber-500 font-normal mb-2"
                          colors={{ first: "#f59e0b", second: "#d97706" }}
                          sparklesCount={4}
                        >
                          Case Info
                        </SparklesText>
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