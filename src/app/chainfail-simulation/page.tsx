'use client';

import { useState } from 'react';
import ChainFailSimulationClient from './client-page';
import { ThemeProvider } from '@/utils/theme';
import { ShimmerButton } from '@/components/magicui/shimmer-button';
import { TextAnimate } from '@/components/magicui/text-animate';

import { useGameSession } from '@/lib/gameSession';
import GameHeader from '@/components/ui/GameHeader';

export default function ChainFailSimulationPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [simulationText, setSimulationText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [resetKey, setResetKey] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [sessionActive, setSessionActive] = useState(false);
  const { startSession } = useGameSession();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const generateSimulation = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/chainfail-simulation/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate_simulation'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setSimulationText(data.simulationText);
        setHasStarted(true);
        await startSession('chainfail');
      } else {
        throw new Error(data.error || 'Failed to generate simulation');
      }
    } catch (error) {
      console.error('Error generating simulation:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
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
  };

  const handleGameEnd = () => {
    setGameEnded(true);
    setSessionActive(false);
  };

  const handleStartNewCase = () => {
    setHasStarted(false);
    setGameEnded(false);
    setSimulationText('');
    setError(null);
    setIsLoading(false);
    setSessionStartTime(null);
    setSessionActive(false);
    setResetKey(prev => prev + 1);
    generateSimulation();
  };

  if (isLoading) {
    return (
      <ThemeProvider value={{ theme, toggleTheme }}>
        <GameHeader 
          gameTitle="ChainFail - Industrial Safety Analysis" 
          showTimestamp={true} 
          startTiming={false}
          gameEnded={gameEnded}
          resetKey={resetKey}
        />
        <div className={`flex min-h-screen items-center justify-center ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
          <div className={`${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} p-8 rounded-lg shadow-lg max-w-md w-full text-center`}>
            <TextAnimate
              className="text-2xl font-bold mb-4"
              animation="blurInUp"
              by="word"
              duration={0.3}
            >
              Generating Investigation
            </TextAnimate>
            <TextAnimate
              className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-6`}
              animation="slideUp"
              by="word"
              duration={0.2}
            >
              Please wait while we create your industrial accident investigation scenario...
            </TextAnimate>
            <div className="w-16 h-16 border-t-4 border-b-4 border-purple-500 rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  if (error) {
    return (
      <ThemeProvider value={{ theme, toggleTheme }}>
        <GameHeader 
          gameTitle="ChainFail - Industrial Safety Analysis" 
          showTimestamp={true} 
          startTiming={false}
          resetKey={resetKey}
        />
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'} flex items-center justify-center`}>
          <div className={`${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} p-8 rounded-lg shadow-lg max-w-md w-full`}>
            <TextAnimate
              className="text-2xl font-bold mb-4"
              animation="blurInUp"
              by="word"
              duration={0.3}
            >
              Error
            </TextAnimate>
            <TextAnimate
              className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-6`}
              animation="slideUp"
              by="word"
              duration={0.2}
            >
              {error}
            </TextAnimate>
            <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-sm mb-4`}>
              <TextAnimate
                className="mb-2"
                animation="slideUp"
                by="word"
                duration={0.2}
                delay={0.1}
              >
                To resolve this issue:
              </TextAnimate>
              <ol className="list-decimal pl-5 space-y-1">
                <li>
                  <TextAnimate
                    animation="slideUp"
                    by="word"
                    duration={0.2}
                    delay={0.2}
                  >
                    Check your internet connection
                  </TextAnimate>
                </li>
                <li>
                  <TextAnimate
                    animation="slideUp"
                    by="word"
                    duration={0.2}
                    delay={0.3}
                  >
                    Try refreshing the page
                  </TextAnimate>
                </li>
                <li>
                  <TextAnimate
                    animation="slideUp"
                    by="word"
                    duration={0.2}
                    delay={0.4}
                  >
                    Try again in a few minutes
                  </TextAnimate>
                </li>
              </ol>
            </div>
            <div className="flex justify-end space-x-4">
              <ShimmerButton
                onClick={() => setError(null)}
                className={`px-4 py-2 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}
                shimmerColor="rgba(255, 255, 255, 0.5)"
                shimmerSize="0.05em"
                shimmerDuration="2s"
                borderRadius="0.375rem"
                background={theme === 'dark' ? 'rgb(55, 65, 81)' : 'rgb(229, 231, 235)'}
              >
                Go Back
              </ShimmerButton>
              <ShimmerButton
                onClick={generateSimulation}
                className="px-4 py-2 text-white"
                shimmerColor="rgba(255, 255, 255, 0.8)"
                shimmerSize="0.1em"
                shimmerDuration="2s"
                borderRadius="0.375rem"
                background="rgb(168, 85, 247)"
              >
                Try Again
              </ShimmerButton>
            </div>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  // Show simulation client when we have text and not ended
  if (simulationText && hasStarted && !error) {
    return (
      <ThemeProvider value={{ theme, toggleTheme }}>
        <GameHeader 
          gameTitle="ChainFail - Industrial Safety Analysis" 
          showTimestamp={true} 
          startTiming={sessionActive}
          gameEnded={gameEnded}
          resetKey={resetKey}
          sessionStartTime={sessionStartTime}
        />
        <ChainFailSimulationClient 
          simulationText={simulationText}
          onStartNewCase={handleStartNewCase}
          onGameEnd={handleGameEnd}
          onSessionStart={handleSessionStart}
          onSessionEnd={handleSessionEnd}
        />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={{ theme, toggleTheme }}>
      <GameHeader 
        gameTitle="ChainFail - Industrial Safety Analysis" 
        showTimestamp={true} 
        startTiming={false}
        gameEnded={gameEnded}
        resetKey={resetKey}
      />
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'} flex items-center justify-center`}>
        <div className={`${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} p-8 rounded-lg shadow-lg max-w-2xl w-full`}>
          <div className="text-center">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-4">
                GAMECHAIN - Critical ChainFail Training
              </h1>
              <TextAnimate
                className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}
                animation="slideUp"
                by="word"
                duration={0.3}
              >
                Industrial Accident Investigation Simulation
              </TextAnimate>
            </div>
            
            <div className={`text-left mb-8 p-6 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
              <h3 className={`text-lg font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                🔧 What You'll Experience:
              </h3>
              <ul className={`space-y-2 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                <li>• Investigate complex workplace accidents with multiple potential causes</li>
                <li>• Analyze equipment failure reports, witness statements, and technical logs</li>
                <li>• Distinguish between human error, mechanical failure, and procedural violations</li>
                <li>• Make critical decisions about root cause analysis and preventive measures</li>
                <li>• Practice industrial safety protocols and accident reconstruction</li>
              </ul>
            </div>
            
            <div className={`text-center mb-6 p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-purple-50'} rounded-lg border border-purple-200`}>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-purple-800'}`}>
                ⚠️ <strong>Training Focus:</strong> Safety Officers, Compliance Auditors, Factory Managers, and Engineering Trainees
              </p>
            </div>
            
            <ShimmerButton
              onClick={generateSimulation}
              className="w-full py-3 text-white text-lg font-semibold"
              shimmerColor="rgba(255, 255, 255, 0.8)"
              shimmerSize="0.1em"
              shimmerDuration="2s"
              borderRadius="0.5rem"
              background="rgb(168, 85, 247)"
            >
              Start ChainFail Investigation
            </ShimmerButton>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
} 