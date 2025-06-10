'use client';

import { useState } from 'react';
import FakeNewsSimulationClient from './client-page';
import { ThemeProvider } from '@/utils/theme';
import { ShimmerButton } from '@/components/magicui/shimmer-button';
import { TextAnimate } from '@/components/magicui/text-animate';
import { SparklesText } from '@/components/magicui/sparkles-text';

export default function FakeNewsSimulationPage() {
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
      const response = await fetch('/api/fake-news-simulation/generate', {
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
              Generating Simulation
            </TextAnimate>
            <TextAnimate
              className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-6`}
              animation="slideUp"
              by="word"
              duration={0.2}
            >
              Please wait while we create your misinformation crisis scenario...
            </TextAnimate>
            <div className="w-16 h-16 border-t-4 border-b-4 border-orange-500 rounded-full animate-spin mx-auto"></div>
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
                background="rgb(245, 101, 39)"
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
      <ThemeProvider value={{ theme, toggleTheme }}>
        <FakeNewsSimulationClient 
          simulationText={simulationText} 
          onStartNewCase={handleStartNewCase}
        />
      </ThemeProvider>
    );
  }

  // Initial state - show start screen
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
                alt="FACTLOCK Logo" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          
          {/* Home Button */}
          <ShimmerButton
            onClick={() => window.location.href = '/'}
            className={`group mb-4 w-full py-2 px-4 flex items-center justify-center transition ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}
            shimmerColor="rgba(255, 255, 255, 0.5)"
            shimmerSize="0.05em"
            shimmerDuration="2s"
            borderRadius="0.375rem"
            background={theme === 'dark' ? 'rgb(55, 65, 81)' : 'rgb(229, 231, 235)'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 transition ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`} viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            Home
          </ShimmerButton>
          
          {/* Theme toggle button */}
          <ShimmerButton
            onClick={toggleTheme}
            className={`mb-4 w-full py-2 px-4 flex items-center justify-center transition ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}
            shimmerColor="rgba(255, 255, 255, 0.5)"
            shimmerSize="0.05em"
            shimmerDuration="2s"
            borderRadius="0.375rem"
            background={theme === 'dark' ? 'rgb(55, 65, 81)' : 'rgb(229, 231, 235)'}
          >
            {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </ShimmerButton>
          
          {/* Start New Simulation Button */}
          <ShimmerButton
            onClick={generateSimulation}
            className="group mb-4 w-full py-2 px-4 text-white flex items-center justify-center transition"
            shimmerColor="rgba(255, 255, 255, 0.8)"
            shimmerSize="0.1em"
            shimmerDuration="2s"
            borderRadius="0.375rem"
            background="rgb(245, 101, 39)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 transition" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Start FACTLOCK Training
          </ShimmerButton>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto px-8 py-4">
            {/* FACTLOCK Image */}
            <div className="mb-4 flex justify-center">
              <div className="w-48 h-24 relative">
                <img 
                  src="/img.png" 
                  alt="FACTLOCK Training Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            
            {/* Description */}
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-5 rounded-lg shadow-lg mb-4 transition hover:translate-y-[-5px]`}>
              <SparklesText className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'} mb-3`}>
                FACTLOCK - Critical Misinformation Training
              </SparklesText>
              <TextAnimate
                className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-3 text-sm`}
                animation="slideUp"
                by="word"
                duration={0.3}
              >
                This simulation is designed for cyber forensics professionals and digital literacy experts who want to practice analyzing viral misinformation campaigns and their real-world consequences.
              </TextAnimate>
              <TextAnimate
                className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-4 text-sm`}
                animation="slideUp"
                by="word"
                duration={0.3}
                delay={0.2}
              >
                In each simulation, you will be assigned the role of a Cyber Forensics Officer and face complex social media crisis scenarios that require critical analysis, evidence evaluation, and impact assessment. Your mission is to identify the source, amplifiers, and assess the impact of digital misinformation.
              </TextAnimate>
              
              {/* Start Button */}
              <ShimmerButton
                onClick={generateSimulation}
                className="w-full py-3 text-white text-lg font-medium transition hover:shadow-lg"
                shimmerColor="rgba(255, 255, 255, 0.8)"
                shimmerSize="0.1em"
                shimmerDuration="2s"
                borderRadius="0.5rem"
                background="rgb(245, 101, 39)"
              >
                Start FACTLOCK Training
              </ShimmerButton>
            </div>
            
            {/* Simulation Rules and Guidelines */}
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-5 rounded-lg shadow-lg transition hover:translate-y-[-5px]`}>
              <TextAnimate
                className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'} mb-3`}
                animation="blurInUp"
                by="word"
                duration={0.3}
              >
                Simulation Rules and Guidelines
              </TextAnimate>
              <ul className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} space-y-2 text-sm`}>
                <li className="flex items-start transition hover:translate-x-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-orange-500 flex-shrink-0 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <TextAnimate animation="slideUp" by="word" duration={0.2} delay={0.1}>
                    Each simulation presents a realistic viral social media case that led to real-world consequences.
                  </TextAnimate>
                </li>
                <li className="flex items-start transition hover:translate-x-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-orange-500 flex-shrink-0 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <TextAnimate animation="slideUp" by="word" duration={0.2} delay={0.2}>
                    You'll take on the role of a Cyber Forensics Officer at the National Crisis Response Unit.
                  </TextAnimate>
                </li>
                <li className="flex items-start transition hover:translate-x-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-orange-500 flex-shrink-0 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <TextAnimate animation="slideUp" by="word" duration={0.2} delay={0.3}>
                    Analyze timeline events, examine evidence, and profile key individuals involved in the crisis.
                  </TextAnimate>
                </li>
                <li className="flex items-start transition hover:translate-x-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-orange-500 flex-shrink-0 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <TextAnimate animation="slideUp" by="word" duration={0.2} delay={0.4}>
                    Make critical decisions about post factuality, key amplifiers, and consequence severity.
                  </TextAnimate>
                </li>
                <li className="flex items-start transition hover:translate-x-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-orange-500 flex-shrink-0 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <TextAnimate animation="slideUp" by="word" duration={0.2} delay={0.5}>
                    Receive detailed performance analysis and scoring based on your investigative accuracy.
                  </TextAnimate>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
} 