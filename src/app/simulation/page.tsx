'use client';

import { useState } from 'react';
import SimulationClient from './client-page';
import { ThemeProvider } from '@/utils/theme';

export default function SimulationPage() {
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
    const timeoutId = setTimeout(() => controller.abort(), 70000); // Increased to 70 seconds timeout (from 30s)
    
    try {
      const response = await fetch('/api/simulation/generate', {
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
      setSimulationText(data.simulationText || '');
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
            <h2 className="text-2xl font-bold mb-4">Generating Simulation</h2>
            <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-6`}>Please wait while we create your case simulation...</p>
            <div className="w-16 h-16 border-t-4 border-b-4 border-blue-500 rounded-full animate-spin mx-auto"></div>
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
            <h2 className="text-2xl font-bold mb-4">Error</h2>
            <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-6`}>{error}</p>
            <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-sm mb-4`}>
              <p className="mb-2">To resolve this issue:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Check your internet connection</li>
                <li>Try refreshing the page</li>
                <li>Try again in a few minutes</li>
              </ol>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setError(null)}
                className={`px-4 py-2 ${theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} rounded-lg transition`}
              >
                Go Back
              </button>
              <button
                onClick={generateSimulation}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  if (hasStarted && simulationText) {
    return (
      <SimulationClient
        simulationText={simulationText}
        onStartNewCase={handleStartNewCase}
      />
    );
  }

  // Landing page for simulation
  return (
    <ThemeProvider value={{ theme, toggleTheme }}>
      <div className={`flex h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
        {/* Sidebar */}
        <div className={`w-64 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'} flex flex-col p-4 border-r ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>
          {/* Logo */}
          <div className="mb-4 flex justify-center">
            <div className="w-24 h-24 relative">
              <img 
                src="/img.png" 
                alt="POSH Training Logo" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          
          {/* Home Button */}
          <a 
            href="/"
            className={`group mb-4 w-full py-2 px-4 ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'} rounded-lg hover:bg-gray-600 hover:text-white flex items-center justify-center transition`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 transition" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            Home
          </a>
          
          {/* Theme toggle button */}
          <button
            onClick={toggleTheme}
            className={`mb-4 w-full py-2 px-4 ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'} rounded-lg hover:bg-gray-600 hover:text-white flex items-center justify-center transition`}
          >
            {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
          
          {/* New Case Button */}
          <button 
            onClick={generateSimulation}
            className="group mb-4 w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 transition" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Start New Case
          </button>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto px-8 py-4">
          {/* <div className="w-full px-6 py-4">  */}
            {/* Company Image */}
            <div className="mb-4 flex justify-center">
              <div className="w-48 h-24 relative">
                <img 
                  src="/img.png" 
                  alt="Training Company Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            
            {/* Description */}
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-5 rounded-lg shadow-lg mb-4 transition hover:translate-y-[-5px]`}>
              <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'} mb-3`}>POSH Training Simulation</h1>
              <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-3 text-sm`}>
                This simulation is designed for HR professionals and legal advisors who want to practice investigation skills under the Prevention of Sexual Harassment (POSH) Act, 2013 in the workplace.
              </p>
              <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-4 text-sm`}>
                In each simulation, you will be provided with a realistic case where you need to review various evidence, consult the legal reference guide, and reach a conclusion. This will help you understand the investigation process under the POSH Act.
              </p>
              
              {/* Start Button */}
              <button 
                onClick={generateSimulation}
                className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-lg font-medium transition hover:shadow-lg"
              >
                Start Simulation
              </button>
            </div>
            
            {/* Rules and Guidelines */}
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-5 rounded-lg shadow-lg transition hover:translate-y-[-5px]`}>
              <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'} mb-3`}>Simulation Rules and Guidelines</h2>
              <ul className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} space-y-2 text-sm`}>
                <li className="flex items-start transition hover:translate-x-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Each simulation includes a realistic case with various evidence and perspectives.</span>
                </li>
                <li className="flex items-start transition hover:translate-x-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>You should review all available evidence and consult the legal reference guide.</span>
                </li>
                <li className="flex items-start transition hover:translate-x-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>In your conclusion, you will need to select the responsible party, type of misconduct, and primary motivation.</span>
                </li>
                <li className="flex items-start transition hover:translate-x-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>At the end of the simulation, you will receive an analysis of your conclusion that evaluates the accuracy of your selections.</span>
                </li>
                <li className="flex items-start transition hover:translate-x-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>You can practice as many cases as you want, each with different scenarios and challenges.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
} 