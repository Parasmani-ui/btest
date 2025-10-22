'use client';

import { useState } from 'react';
import { ThemeProvider } from '@/utils/theme';
import { ShimmerButton } from '@/components/magicui/shimmer-button';
import { TextAnimate } from '@/components/magicui/text-animate';
import { useGameAuth } from '@/hooks/useGameAuth';
import { SignInPopup } from '@/components/auth/SignInPopup';

import FinancialNegotiationClient from './client-page';

export default function FinancialNegotiationPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [simulationText, setSimulationText] = useState<string>('');
  const [selectedSubGame, setSelectedSubGame] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  
  // Authentication hook
  const { checkAuthAndProceed, showSignInPopup, closeSignInPopup, onSignInSuccess } = useGameAuth();

  // Toggle theme
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Sub-game configurations
  const SUB_GAMES = [
    {
      title: "Expense Fraud Investigation",
      level: "Beginner",
      emoji: "📋",
      color: "emerald",
      description: "Learn basic forensic techniques in expense fraud detection through structured dialogue.",
      duration: "10-12 min"
    },
    {
      title: "Project Cost Overrun Audit",
      level: "Intermediate", 
      emoji: "🏗️",
      color: "blue",
      description: "Identify causes behind project cost overruns using audit logic and stakeholder probing.",
      duration: "12-15 min"
    },
    {
      title: "Financial Fraud Investigation",
      level: "Advanced",
      emoji: "🔍",
      color: "red", 
      description: "Detect and respond to deep financial fraud under pressure with complex evidence analysis.",
      duration: "15-18 min"
    }
  ];

  // Start simulation for selected sub-game
  const handleStartSimulation = (subGameIndex: number) => {
    checkAuthAndProceed(() => {
      startSimulation(subGameIndex);
    }, 'Financial Investigation');
  };

  const startSimulation = async (subGameIndex: number) => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/financial-negotiation/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subGameIndex: subGameIndex,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSimulationText(data.simulation);
        setSelectedSubGame(subGameIndex);
        setSessionStartTime(new Date());
      } else {
        console.error('Failed to generate Financial Investigation simulation');
      }
    } catch (error) {
      console.error('Error generating Financial Investigation simulation:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Start new case (reset simulation)
  const handleStartNewCase = () => {
    setSimulationText('');
    setSelectedSubGame(null);
    setSessionStartTime(null);
  };

  // Back to selection
  const handleBackToSelection = () => {
    setSimulationText('');
    setSelectedSubGame(null);
    setSessionStartTime(null);
  };

  // Handle session start
  const handleSessionStart = (startTime: Date) => {
    setSessionStartTime(startTime);
  };

  // Handle session end  
  const handleSessionEnd = (endTime: Date, elapsedTime: string) => {
    console.log('Financial Investigation session ended:', { endTime, elapsedTime });
  };

  const getThemeColors = () => {
    const colorClass = theme === 'dark' ? 'text-white' : 'text-gray-900';
    const backgroundClass = theme === 'dark' 
      ? `bg-gray-900`
      : 'bg-gray-50';
    return `${colorClass} ${backgroundClass}`;
  };

  // If simulation is active, render the client component
  if (simulationText && selectedSubGame !== null) {
    return (
      <FinancialNegotiationClient
        simulationText={simulationText}
        subGameIndex={selectedSubGame}
        onStartNewCase={handleStartNewCase}
        onBackToSelection={handleBackToSelection}
        onSessionStart={handleSessionStart}
        onSessionEnd={handleSessionEnd}
      />
    );
  }

  // Landing page for sub-game selection
  return (
    <ThemeProvider value={{ theme, toggleTheme }}>
      <div className={`min-h-screen w-full ${getThemeColors()}`}>
        {/* Header */}
        <div className={`p-4 w-full ${theme === 'dark' 
          ? `bg-gray-800 border-gray-700`
          : `bg-white border-gray-200`
        } flex justify-between items-center shadow-sm border-b`}>
          <div className="flex items-center space-x-4">
            <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
              theme === 'dark' 
                ? 'bg-purple-900 text-purple-200'
                : 'bg-purple-100 text-purple-800'
            }`}>
              💰 Financial Investigation Training
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.location.href = '/'}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                theme === 'dark' 
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              🏠 Home
            </button>
            <button 
              onClick={toggleTheme}
              className={`p-2 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </div>

        {/* Compact Main Content */}
        <main className="container mx-auto px-6 py-8">
          {/* Compact Header */}
          <div className="text-center mb-8">
            <div className="mb-4">
              <h1 className={`text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Financial Investigation Training
              </h1>
            </div>
            <TextAnimate
              className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} max-w-3xl mx-auto`}
            >
              Master financial investigation skills through realistic audit scenarios with confidence.
            </TextAnimate>
          </div>

          {/* List View Layout */}
          <div className="max-w-4xl mx-auto mb-8 space-y-4">
            {SUB_GAMES.map((subGame, index) => (
              <div
                key={index}
                className={`group relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-[1.01] ${
                  theme === 'dark' 
                    ? 'bg-gray-800/50 border border-gray-700/50 hover:border-gray-600' 
                    : 'bg-white/80 border border-gray-200/50 hover:border-gray-300'
                } backdrop-blur-sm hover:shadow-lg`}
              >
                {/* Animated border highlight */}
                <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                  subGame.color === 'emerald' ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/20' :
                  subGame.color === 'blue' ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/20' :
                  'bg-gradient-to-r from-red-500/20 to-red-600/20'
                }`} />
                
                {/* Left accent line */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                  subGame.color === 'emerald' ? 'bg-gradient-to-b from-emerald-500 to-emerald-600' :
                  subGame.color === 'blue' ? 'bg-gradient-to-b from-blue-500 to-blue-600' :
                  'bg-gradient-to-b from-red-500 to-red-600'
                }`} />
                
                <div className="relative p-6">
                  <div className="flex items-center justify-between">
                    {/* Left section - Icon and main info */}
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="text-3xl">{subGame.emoji}</div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {subGame.title}
                          </h3>
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            subGame.color === 'emerald' ? 'bg-emerald-100 text-emerald-800' :
                            subGame.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {subGame.level}
                          </div>
                        </div>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} max-w-2xl`}>
                          {subGame.description}
                        </p>
                      </div>
                    </div>
                    
                    {/* Right section - Duration and button */}
                    <div className="flex items-center space-x-4">
                      <div className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'} flex items-center whitespace-nowrap`}>
                        ⏱️ {subGame.duration}
                      </div>
                      
                      <ShimmerButton
                        onClick={() => handleStartSimulation(index)}
                        disabled={isGenerating}
                        className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
                          subGame.color === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700' :
                          subGame.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                          'bg-red-600 hover:bg-red-700'
                        } text-white ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isGenerating ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Generating...</span>
                          </div>
                        ) : (
                          `Start ${subGame.level}`
                        )}
                      </ShimmerButton>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Compact Footer Info */}
          <div className={`text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            <p className="text-sm">
              💡 <strong>Training Objective:</strong> Develop critical thinking and communication skills for financial investigations
            </p>
          </div>
        </main>
      </div>
      
      {/* Sign In Popup */}
      <SignInPopup
        isOpen={showSignInPopup}
        onClose={closeSignInPopup}
        onSuccess={onSignInSuccess}
        gameName="Financial Investigation"
      />
    </ThemeProvider>
  );
}