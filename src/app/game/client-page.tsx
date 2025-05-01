'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import CharacterActionPanel from './Components/CharacterActionPanel';
import EvidenceActionPanel from './Components/EvidenceActionPanel';
import AnswerPanel from './Components/AnswerPanel';
import ArrestResult from './Components/ArrestResult';

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
  }, []);

  // Start game when component is mounted
  useEffect(() => {
    startGame();
  }, [startGame]);

  // toggle theme
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // interrogate suspect
  const interrogateSuspect = async (suspect: string) => {
    setLoading(true);
    try {
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
    // पहले लोकल हिंट्स की लिस्ट में से
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
          <div className="p-4 rounded-lg bg-gray-800">
            <h3 className="text-xl font-bold mb-4">Suspects</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {gameState.suspects.map((suspect, index) => (
                <button
                  key={index}
                  onClick={() => interrogateSuspect(suspect)}
                  className={`p-3 rounded-lg ${
                    gameState.interrogatedSuspects.includes(suspect)
                      ? 'bg-green-800'
                      : 'bg-gray-700'
                  } hover:bg-gray-600`}
                >
                  {suspect}
                </button>
              ))}
            </div>
          </div>
        );
        
      case 'evidence':
        return (
          <div className="p-4 rounded-lg bg-gray-800">
            <h3 className="text-xl font-bold mb-4">Evidence</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {gameState.evidence.map((item, index) => (
                <button
                  key={index}
                  onClick={() => analyzeEvidence(item)}
                  className={`p-3 rounded-lg ${
                    gameState.analyzedEvidence.includes(item)
                      ? 'bg-green-800'
                      : 'bg-gray-700'
                  } hover:bg-gray-600`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        );
        
      case 'arrest-options':
        return (
          <div className="p-4 rounded-lg bg-gray-800">
            <h3 className="text-xl font-bold mb-4">Make an Arrest</h3>
            <p className="mb-4">Who do you think is the murderer?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {gameState.suspects.map((suspect, index) => (
                <button
                  key={index}
                  onClick={() => makeArrest(suspect)}
                  className="p-3 rounded-lg bg-red-800 hover:bg-red-700"
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
          <div className="p-4 rounded-lg bg-gray-800">
            <h3 className="text-xl font-bold mb-4">
              {gameState.currentAction === 'interrogate'
                ? `Interrogation: ${gameState.currentSuspect}`
                : gameState.currentAction === 'analyze'
                ? 'Evidence Analysis'
                : 'Case Resolution'}
            </h3>
            <div className="p-3 bg-gray-700 rounded-lg mb-4 whitespace-pre-wrap">
              {gameState.currentResponse.split('\n\n').map((section, index) => {
                if (section.startsWith('INVESTIGATION SUGGESTIONS:')) {
                  return (
                    <div key={index} className="mb-4">
                      <h4 className="text-lg font-semibold text-blue-400 mb-2">Investigation Suggestions:</h4>
                      <div className="pl-4">{section.replace('INVESTIGATION SUGGESTIONS:', '').trim()}</div>
                    </div>
                  );
                }
                if (section.startsWith('SUSPECT STATEMENT:')) {
                  return (
                    <div key={index}>
                      <h4 className="text-lg font-semibold text-green-400 mb-2">Suspect Statement:</h4>
                      <div className="pl-4">{section.replace('SUSPECT STATEMENT:', '').trim()}</div>
                    </div>
                  );
                }
                return <div key={index}>{section}</div>;
              })}
            </div>
            <button
              onClick={endAction}
              className="p-2 bg-blue-700 hover:bg-blue-600 rounded"
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
    <div className={`game-content min-h-screen p-4 ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-black'}`}>
      {/* Header and theme toggle */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Mystery Detective Game</h1>
        <div>
          <button
            onClick={toggleTheme}
            className={`px-3 py-1 rounded-md ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-300'}`}
          >
            Toggle {theme === 'dark' ? 'Light' : 'Dark'} Mode
          </button>
          {gameState.hints.length < gameState.hints.length && (
            <button
              onClick={nextHint}
              className="ml-2 px-3 py-1 rounded-md bg-indigo-600 text-white"
            >
              Unlock Hint ({gameState.currentHint + 1}/{gameState.hints.length})
            </button>
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
                <div className="px-4 mb-4">
                  <Link href="/">
                    <button className={`w-full p-2 flex items-center justify-center ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'} rounded hover:bg-gray-600`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                      </svg>
                      Home
                    </button>
                  </Link>
                </div>
                
                <div className="p-4 flex-grow">
                  <div className="mb-4">
                    <button 
                      onClick={startGame} 
                      className={`w-full p-2 flex justify-between ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'} rounded`}
                    >
                      <span>New Case</span>
                    </button>
                  </div>
                  
                  {gameState.started && (
                    <div className="mt-8">
                      <h3 className="text-amber-500 font-bold mb-2">Case Info</h3>
                      <div className="mb-2">{(gameState.mode || 'Quick').charAt(0).toUpperCase() + (gameState.mode || 'Quick').slice(1)} Case</div>
                      <div className="text-sm text-gray-400">
                        <div className="mb-1">Suspects: {gameState.interrogatedSuspects.length}/{gameState.suspects.length}</div>
                        <div>Evidence: {gameState.analyzedEvidence.length}/{gameState.evidence.length}</div>
                      </div>
                      
                      <div className="mt-4">
                        <button 
                          onClick={() => setShowGuide(!showGuide)} 
                          className={`w-full p-2 ${theme === 'dark' ? 'bg-amber-500 hover:bg-amber-700' : 'bg-amber-600 hover:bg-amber-500'} text-white rounded flex justify-between items-center`}
                        >
                          <span>Guide</span>
                          <span>{showGuide ? '▲' : '▼'}</span>
                        </button>
                        
                        {showGuide && (
                          <div className={`mt-2 p-3 ${theme === 'dark' ? 'bg-slate-900' : 'bg-amber-100'} rounded`}>
                            <div className="mb-2">{getCurrentHint()}</div>
                            <button
                              onClick={nextHint}
                              className={`w-full p-2 text-sm ${theme === 'dark' ? 'bg-slate-800 hover:bg-amber-700' : 'bg-amber-500 hover:bg-amber-400'} text-white rounded`}
                            >
                              Next Hint
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className={`p-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`}>
                  <div className="flex justify-end">
                    <button onClick={toggleTheme} className="text-xl">
                      {theme === 'dark' ? '🌙' : '☀️'}
                    </button>
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
                    <div className="p-4 rounded-lg bg-gray-800">
                      <h3 className="text-xl font-bold mb-4">Case File</h3>
                      <div className="p-6 bg-gray-700 rounded-lg whitespace-pre-wrap">
                        {gameState.caseDetails}
                      </div>
                    </div>
                  </div>
                  
                  {/* action buttons */}
                  {gameState.started && !gameState.currentAction && (
                    <div className="mb-8">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <button
                          onClick={showSuspects}
                          className="p-4 bg-blue-700 hover:bg-blue-600 rounded-lg"
                        >
                          Interrogate Suspects
                        </button>
                        <button
                          onClick={showEvidence}
                          className="p-4 bg-green-700 hover:bg-green-600 rounded-lg"
                        >
                          Analyze Evidence
                        </button>
                        <button
                          onClick={showArrestOptions}
                          className="p-4 bg-red-700 hover:bg-red-600 rounded-lg"
                        >
                          Make an Arrest
                        </button>
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
  );
} 