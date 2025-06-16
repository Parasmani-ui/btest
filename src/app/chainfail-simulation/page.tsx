'use client';

import { useState } from 'react';
import ChainFailSimulationClient from './client-page';
import { ThemeProvider } from '@/utils/theme';
import { ShimmerButton } from '@/components/magicui/shimmer-button';
import { TextAnimate } from '@/components/magicui/text-animate';
import { SparklesText } from '@/components/magicui/sparkles-text';

export default function ChainFailSimulationPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [simulationText, setSimulationText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const generateSimulation = async () => {
    setIsLoading(true);
    setError(null);
    
    // Create an AbortController to handle request timeouts
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 70000); // 70 seconds timeout
    
    try {
      const response = await fetch('/api/chainfail-simulation/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      // Clear the timeout since request completed
      clearTimeout(timeoutId);
      
      // Handle non-200 responses
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Error: ${response.status} ${response.statusText}`;
        
        try {
          // Try to parse the error as JSON
          const errorData = JSON.parse(errorText);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // If parsing fails, use the raw text with a fallback
          errorMessage = errorText || 'Failed to generate simulation';
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      setSimulationText(data.data || '');
      setHasStarted(true);
    } catch (err) {
      // Clear the timeout in case of error
      clearTimeout(timeoutId);
      
      console.error('Error generating simulation:', err);
      
      // Special handling for AbortError (timeout)
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('Request timed out. The server is taking too long to respond. Please try again later.');
      } else {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartNewCase = () => {
    // Clear all state
    setSimulationText('');
    setHasStarted(false);
    setError(null);
    
    // Directly trigger a new simulation generation
    generateSimulation();
  };

  if (isLoading) {
    return (
      <ThemeProvider value={{ theme, toggleTheme }}>
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
                className={`px-4 py-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}
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

  if (hasStarted && simulationText) {
    return (
      <ChainFailSimulationClient
        simulationText={simulationText}
        onStartNewCase={handleStartNewCase}
      />
    );
  }

  return (
    <ThemeProvider value={{ theme, toggleTheme }}>
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'} flex items-center justify-center`}>
        <div className={`${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} p-8 rounded-lg shadow-lg max-w-2xl w-full`}>
          <div className="text-center">
            <div className="mb-6">
              <SparklesText 
                className="text-3xl font-bold mb-4"
                colors={{ first: "#a855f7", second: "#d8b4fe" }}
                sparklesCount={8}
              >
                GAMECHAIN - Critical ChainFail Training
              </SparklesText>
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
            
            <div className={`text-center mb-6 p-4 ${theme === 'dark' ? 'bg-purple-900/20' : 'bg-purple-50'} rounded-lg border border-purple-200`}>
              <p className={`text-sm ${theme === 'dark' ? 'text-purple-200' : 'text-purple-800'}`}>
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