'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

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
}

export default function Game() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get('mode') || 'quick';
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
    currentHint: 0
  });
  const [loading, setLoading] = useState(true);

  // गेम शुरू करें जब कंपोनेंट माउंट हो
  useEffect(() => {
    startGame(mode);
  }, [mode]);

  // थीम टॉगल करें
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // नई गेम शुरू करें
  const startGame = async (gameMode: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/start-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: gameMode })
      });

      if (!response.ok) {
        throw new Error('Failed to start game');
      }

      const data = await response.json();
      
      setGameState({
        ...gameState,
        started: true,
        mode: gameMode,
        caseDetails: data.caseDetails,
        suspects: data.suspects,
        evidence: data.evidence,
        interrogatedSuspects: [],
        analyzedEvidence: [],
        currentAction: null,
        currentResponse: ''
      });
    } catch (error) {
      console.error('Error starting game:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // suspect interrogation
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
        interrogatedSuspects: [...gameState.interrogatedSuspects, suspect]
      });
    } catch (error) {
      console.error('Error interrogating suspect:', error);
      alert('Something went wrong during interrogation.');
    } finally {
      setLoading(false);
    }
  };

  // evidence analyse
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

  // arrest
  const makeArrest = async (suspect: string) => {
    if (!confirm(`Are you sure you want to arrest ${suspect}? This will end the case.`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/arrest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suspect })
      });

      if (!response.ok) {
        throw new Error('Failed to make arrest');
      }

      const data = await response.json();
      
      const result = data.correct
        ? `You were RIGHT! ${suspect} was indeed the murderer.`
        : `You were WRONG! ${suspect} was innocent. The real murderer was ${data.murderer}.`;
        
      setGameState({
        ...gameState,
        currentAction: 'arrest',
        currentResponse: result,
        started: false
      });
    } catch (error) {
      console.error('Error making arrest:', error);
      alert('Something went wrong during arrest.');
    } finally {
      setLoading(false);
    }
  };

  // hints navigate
  const nextHint = async () => {
    // local list
    if (gameState.currentHint < gameState.hints.length - 1) {
      setGameState({
        ...gameState,
        currentHint: gameState.currentHint + 1
      });
      return;
    }
    
    // if local hints end
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

  // show hints
  const getCurrentHint = () => {
    return gameState.hints[gameState.currentHint];
  };

  // interrogate analysis end
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

  // arrest options show
  const showArrestOptions = () => {
    setGameState({
      ...gameState,
      currentAction: 'arrest-options'
    });
  };

  // list of action panel
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
                ? 'Interrogation'
                : gameState.currentAction === 'analyze'
                ? 'Evidence Analysis'
                : 'Case Resolution'}
            </h3>
            <div className="p-3 bg-gray-700 rounded-lg mb-4 whitespace-pre-wrap">
              {gameState.currentResponse}
            </div>
            {gameState.currentAction !== 'arrest' && (
              <button
                onClick={endAction}
                className="p-2 bg-blue-700 hover:bg-blue-600 rounded"
              >
                {gameState.currentAction === 'interrogate' ? 'End Interrogation' : 'Back'}
              </button>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };

  // main game interface
  return (
    <main className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className="flex">
        {/* साइडबार */}
        <div className={`w-48 fixed h-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}>
          <div className="flex flex-col h-full">
            <div className="p-4 flex justify-center">
              <Link href="/">
                <Image src="/img.png" alt="DetectAive Logo" width={80} height={80} className="cursor-pointer" />
              </Link>
            </div>
            
            <div className="p-4 flex-grow">
              <div className="mb-4">
                <button 
                  onClick={() => router.push('/')} 
                  className={`w-full p-2 flex justify-between ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'} rounded`}
                >
                  <span>New Case</span>
                </button>
              </div>
              
              {gameState.started && (
                <div className="mt-8">
                  <h3 className="text-amber-500 font-bold mb-2">Case Info</h3>
                  <div className="mb-2">{(gameState.mode || 'Quick').charAt(0).toUpperCase() + (gameState.mode || 'Quick').slice(1)} Case</div>
                  {/* <div className="mb-2">{gameState.mode?.charAt(0).toUpperCase() + gameState.mode?.slice(1)} Case</div> */}
                  <div className="text-sm text-gray-400">
                    <div className="mb-1">Suspects: {gameState.interrogatedSuspects.length}/{gameState.suspects.length}</div>
                    <div>Evidence: {gameState.analyzedEvidence.length}/{gameState.evidence.length}</div>
                  </div>
                </div>
              )}
            </div>
            
            <div className={`p-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`}>
              <div className="flex justify-between items-center">
                <Link href="/admin" className={`px-2 py-1 ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-400'} rounded`}>
                  Admin
                </Link>
                <button onClick={toggleTheme} className="text-xl">
                  {theme === 'dark' ? '🌙' : '☀️'}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* main containt*/}
        <div className="ml-48 flex-grow p-8">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-2xl">Loading...</div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">
                {gameState.mode?.charAt(0).toUpperCase() + gameState.mode?.slice(1)} Case
              </h2>
              
              <div className="mb-8 p-6 rounded-lg bg-gray-800 whitespace-pre-wrap">
                {gameState.caseDetails}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <button
                  onClick={showSuspects}
                  className="p-3 rounded-lg bg-blue-700 hover:bg-blue-600"
                >
                  Interrogate Suspects
                </button>
                <button
                  onClick={showEvidence}
                  className="p-3 rounded-lg bg-green-700 hover:bg-green-600"
                >
                  Analyze Evidence
                </button>
                <button
                  onClick={showArrestOptions}
                  className="p-3 rounded-lg bg-red-700 hover:bg-red-600"
                >
                  Make an Arrest
                </button>
              </div>
              
              <div className="mb-8 p-4 rounded-lg bg-amber-900">
                <h3 className="text-xl font-bold mb-2">Detective's Hint:</h3>
                <div className="mb-2 p-3 bg-amber-950 rounded">
                  {getCurrentHint()}
                </div>
                <button
                  onClick={nextHint}
                  className="p-2 bg-amber-800 hover:bg-amber-700 rounded"
                >
                  Next Hint
                </button>
              </div>
              
              {renderActionPanel()}
            </div>
          )}
        </div>
      </div>
      
      <footer className={`fixed bottom-0 w-full p-2 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}>
        <div className="flex justify-between items-center">
          <span>@Parasmani Skill Pvt</span>
        </div>
      </footer>
    </main>
  );
}