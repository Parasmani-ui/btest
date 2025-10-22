'use client';

import { useState } from 'react';
import NegotiationSimulationClient from './client-page';
import { useGameSession } from '@/lib/gameSession';
import { updateUserStatsOnGameStart } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';
import GameHeader from '@/components/ui/GameHeader';

interface SubGame {
  id: number;
  title: string;
  description: string;
  level: string;
}

const SUB_GAMES: SubGame[] = [
  {
    id: 0,
    title: "Salary Negotiation",
    description: "Learn to negotiate your first job offer with confidence and data-driven arguments while maintaining professionalism.",
    level: "Beginner"
  },
  {
    id: 1,
    title: "Project Timeline Negotiation",
    description: "Master stakeholder expectations and push back on unrealistic deadlines while maintaining team confidence.",
    level: "Advanced"
  },
  {
    id: 2,
    title: "Vendor Discount Conflict",
    description: "Navigate procurement negotiations focused on value creation rather than aggressive cost-cutting tactics.",
    level: "Beginner"
  },
  {
    id: 3,
    title: "Cross-Functional Team Negotiation",
    description: "Align competing departmental priorities and achieve consensus across marketing, finance, and operations teams.",
    level: "Advanced"
  },
  {
    id: 4,
    title: "Crisis Negotiation in Product Recall",
    description: "Handle high-pressure crisis negotiations while balancing transparency, brand protection, and public trust.",
    level: "Advanced"
  }
];

export default function NegotiationSimulationPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [simulationText, setSimulationText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [selectedSubGame, setSelectedSubGame] = useState<number | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const { userData } = useAuth();
  const { startSession } = useGameSession();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const generateSimulation = async (subGameIndex: number) => {
    setIsLoading(true);
    setError(null);
    setSelectedSubGame(subGameIndex);
    
    try {
      // Start game session tracking
      await startSession('negotiation');
      
      // Update user stats when game starts (count games on start, not end)
      console.log(`📊 Updating user stats for game start: negotiation`);
      await updateUserStatsOnGameStart(userData.uid, 'negotiation');
      console.log(`✅ User stats updated for game start`);
    } catch (sessionError) {
      console.error('Error starting session:', sessionError);
    }
    
    // Create an AbortController to handle request timeouts
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 70000); // 70 seconds timeout
    
    try {
      const response = await fetch('/api/negotiation-simulation/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subGameIndex }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setSimulationText(data.scenario);
      setHasStarted(true);
      setSessionStartTime(new Date());
      setSessionActive(true);
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('Error generating simulation:', error);
      if (error.name === 'AbortError') {
        setError('Request timeout. Please try again.');
      } else {
        setError(error.message || 'An error occurred while generating the simulation. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSessionStart = (startTime: Date) => {
    setSessionStartTime(startTime);
    setSessionActive(true);
  };

  const handleSessionEnd = (endTime: Date, elapsedTime: string) => {
    setSessionActive(false);
    setGameEnded(true);
  };

  const startNewCase = async () => {
    if (selectedSubGame !== null) {
      setHasStarted(false);
      setSimulationText('');
      setError(null);
      setGameEnded(false);
      setSessionActive(false);
      await generateSimulation(selectedSubGame);
    }
  };

  const backToSelection = () => {
    setHasStarted(false);
    setSimulationText('');
    setError(null);
    setSelectedSubGame(null);
    setGameEnded(false);
    setSessionActive(false);
  };

  if (hasStarted && simulationText) {
    return (
      <NegotiationSimulationClient
        simulationText={simulationText}
        subGameIndex={selectedSubGame!}
        onStartNewCase={startNewCase}
        onBackToSelection={backToSelection}
        onSessionStart={handleSessionStart}
        onSessionEnd={handleSessionEnd}
      />
    );
  }

  // Landing page for negotiation simulation
  return (
    <div>
      <GameHeader 
        gameTitle="Negotiation Simulation" 
        showTimestamp={true} 
        startTiming={sessionActive}
        gameEnded={gameEnded}
        sessionStartTime={sessionStartTime}
      />
      <div className={`flex h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
        {/* Sidebar */}
        <div className={`w-64 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'} flex flex-col p-4 border-r ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>
          {/* Logo */}
          <div className="mb-4 flex justify-center">
            <div className="w-24 h-24 relative">
              <img 
                src="/img.png" 
                alt="Negotiation Logo" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          
          {/* Home Button */}
          <button
            onClick={() => window.location.href = '/'}
            className={`group mb-4 w-full py-2 px-4 flex items-center justify-center transition rounded ${
              theme === 'dark' 
                ? 'text-white bg-gray-700 hover:bg-gray-600' 
                : 'text-gray-700 bg-gray-300 hover:bg-gray-400'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            Home
          </button>
          
          {/* Theme toggle button */}
          <button
            onClick={toggleTheme}
            className={`mb-4 w-full py-2 px-4 flex items-center justify-center transition rounded ${
              theme === 'dark' 
                ? 'text-white bg-gray-700 hover:bg-gray-600' 
                : 'text-gray-700 bg-gray-300 hover:bg-gray-400'
            }`}
          >
            {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto px-8 py-6">
            {/* Header */}
            <div className="mb-8 text-center">
              <h1 className={`text-4xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Negotiation Simulation
              </h1>
              <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Master the art of negotiation through realistic workplace scenarios
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-300">
                {error}
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-12">
                <div className="inline-flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                  <span className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    Generating negotiation scenario...
                  </span>
                </div>
              </div>
            )}

            {/* Sub-Games Grid */}
            {!isLoading && (
              <div className="grid gap-6">
                {SUB_GAMES.map((subGame, index) => (
                  <div
                    key={subGame.id}
                    className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg overflow-hidden transition-all duration-200 hover:shadow-xl hover:scale-105`}
                  >
                    <button
                      onClick={() => generateSimulation(index)}
                      disabled={isLoading}
                      className="w-full p-4 text-left focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-purple-600'}`}>
                          {subGame.title}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          subGame.level === 'Beginner' 
                            ? 'bg-green-500 bg-opacity-50 text-green-800' 
                            : 'bg-orange-500 bg-opacity-100 text-orange-800'
                        }`}>
                          {subGame.level}
                        </span>
                      </div>
                      <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm line-clamp-2`}>
                        {subGame.description}
                      </p>
                      <div className="mt-2 flex items-center">
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-purple-600'}`}>
                          Click to start →
                        </span>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Footer Info */}
            <div className={`mt-12 text-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              <p className="text-sm">
                Each simulation takes 5-10 minutes and includes 5 negotiation rounds with performance feedback
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 