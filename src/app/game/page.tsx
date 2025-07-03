'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { SparklesText } from '@/components/magicui/sparkles-text';
import { TextAnimate } from '@/components/magicui/text-animate';
import { ShimmerButton } from '@/components/magicui/shimmer-button';
import GameContent from './client-page';

export default function CriticalReadingPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [hasStarted, setHasStarted] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const startGame = () => {
    setHasStarted(true);
  };

  // If game has started, show the game content
  if (hasStarted) {
    return <GameContent />;
  }

  // Landing page for Critical Reading
  return (
    <main className={`min-h-screen ${theme === 'dark' ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className="flex">
        {/* Sidebar */}
        <div className={`w-48 fixed h-full ${theme === 'dark' ? 'bg-blue-800' : 'bg-gray-200'}`}>
          <div className="flex flex-col h-full">
            <div className="p-4 flex justify-center">
              <div onClick={() => router.push('/')} className="cursor-pointer">
                <Image src="/img.png" alt="DetectAive Logo" width={80} height={80} priority/>
              </div>
            </div>
            
            <div className="p-4 flex-grow">
              <div className="mb-4 relative space-y-4">
                {/* Home Button */}
                <ShimmerButton
                  onClick={() => router.push('/')}
                  className={`w-full p-3 flex items-center justify-center transition ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}
                  shimmerColor="rgba(255, 255, 255, 0.5)"
                  shimmerSize="0.05em"
                  shimmerDuration="2s"
                  borderRadius="0.5rem"
                  background={theme === 'dark' ? 'rgb(29, 78, 216)' : 'rgb(229, 231, 235)'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 transition ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`} viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                  Home
                </ShimmerButton>

                {/* Theme Toggle Button */}
                <ShimmerButton
                  onClick={toggleTheme}
                  className={`w-full p-3 flex items-center justify-center transition ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}
                  shimmerColor="rgba(255, 255, 255, 0.5)"
                  shimmerSize="0.05em"
                  shimmerDuration="2s"
                  borderRadius="0.5rem"
                  background={theme === 'dark' ? 'rgb(29, 78, 216)' : 'rgb(229, 231, 235)'}
                >
                  {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
                </ShimmerButton>

                {/* Start New Case Button */}
                <ShimmerButton
                  onClick={startGame}
                  className="w-full p-3 text-white"
                  shimmerColor="rgba(255, 255, 255, 0.8)"
                  shimmerSize="0.1em"
                  shimmerDuration="2s"
                  borderRadius="0.5rem"
                  background="rgb(37, 99, 235)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 inline" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Start New Case
                </ShimmerButton>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="ml-48 flex-grow p-8">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <div className="mb-6">
              <ShimmerButton
                onClick={() => router.push('/')}
                className={`flex items-center gap-2 px-4 py-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}
                shimmerColor="rgba(255, 255, 255, 0.5)"
                shimmerSize="0.05em"
                shimmerDuration="2s"
                borderRadius="0.375rem"
                background={theme === 'dark' ? 'rgb(29, 78, 216)' : 'rgb(229, 231, 235)'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to Home
              </ShimmerButton>
            </div>

            <div className="text-center">
              <Image src="/img.png" alt="Critical Reading Logo" width={200} height={200} className="mx-auto" priority/>
            
              {/* Main description */}
              <div className="my-6 text-lg relative min-h-[100px] overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <SparklesText 
                    className="text-xl sm:text-2xl font-normal"
                    colors={{ first: "#3b82f6", second: "#60a5fa" }}
                    sparklesCount={8}
                  >
                    Play as a detective solving procedurally generated murder mysteries. 
                    Examine evidence, interrogate suspects, and solve cases.
                  </SparklesText>
                </div>
              </div>

              {/* Game Mode Card */}
              <div className="my-4 flex justify-center">
                <div 
                  className={`p-8 rounded-lg ${theme === 'dark' ? 'bg-blue-800' : 'bg-white'} cursor-pointer hover:shadow-lg transition max-w-md w-full`} 
                  onClick={startGame}
                >
                  <SparklesText 
                    className="text-2xl font-bold mb-4"
                    colors={{ first: "#3b82f6", second: "#60a5fa" }}
                    sparklesCount={10}
                  >
                    Police Investigation
                  </SparklesText>
                  <p className="text-lg mb-4">5-8m | Procedural Blind Spot</p>
                  <TextAnimate
                    className={`${theme === 'dark' ? 'text-blue-300' : 'text-gray-600'} mb-6 leading-relaxed`}
                    animation="slideUp"
                    by="word"
                    duration={0.2}
                  >
                    Dive into a quick murder mystery where every clue matters. Use your detective skills to analyze evidence, interrogate suspects, and solve the case before time runs out.
                  </TextAnimate>
                  
                  <ShimmerButton
                    onClick={startGame}
                    className="w-full py-3 text-white text-lg font-medium transition hover:shadow-lg"
                    shimmerColor="rgba(255, 255, 255, 0.8)"
                    shimmerSize="0.1em"
                    shimmerDuration="2s"
                    borderRadius="0.5rem"
                    background="rgb(37, 99, 235)"
                  >
                    Start Investigation
                  </ShimmerButton>
                </div>
              </div>
              
              {/* How to Play section */}
              <div className={`${theme === 'dark' ? 'bg-blue-800' : 'bg-white'} p-8 rounded-lg shadow-lg mb-8`}>
                <TextAnimate
                  className="text-2xl font-bold mb-6"
                  animation="slideUp"
                  by="word"
                  duration={0.3}
                >
                  How to Play Critical Reading
                </TextAnimate>
                
                {/* Rules section with 2-column layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
                      <div>
                        <h4 className="font-semibold mb-1">Start Investigation</h4>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Begin your detective work with a procedurally generated murder case.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
                      <div>
                        <h4 className="font-semibold mb-1">Examine Crime Scene</h4>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Review the initial evidence and circumstances surrounding the crime.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
                      <div>
                        <h4 className="font-semibold mb-1">Interrogate Suspects</h4>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Question each suspect carefully to find inconsistencies in their stories.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">4</div>
                      <div>
                        <h4 className="font-semibold mb-1">Investigate Evidence</h4>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Examine each piece of evidence carefully for hidden clues and connections.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">5</div>
                      <div>
                        <h4 className="font-semibold mb-1">Make an Arrest</h4>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>When confident in your deduction, make an arrest and solve the case.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">6</div>
                      <div>
                        <h4 className="font-semibold mb-1">Case Resolution</h4>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Learn if you arrested the right suspect and review your detective work.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Game Features */}
              <div className={`${theme === 'dark' ? 'bg-blue-800' : 'bg-white'} p-8 rounded-lg shadow-lg`}>
                <TextAnimate
                  className="text-2xl font-bold mb-6"
                  animation="slideUp"
                  by="word"
                  duration={0.3}
                >
                  Game Features
                </TextAnimate>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                  <div className="space-y-3">
                    <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h4 className="font-semibold">AI-Generated Cases</h4>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Every case is unique with procedurally generated scenarios and clues.</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h4 className="font-semibold">Interactive Investigation</h4>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Interrogate suspects and examine evidence through dynamic interactions.</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <h4 className="font-semibold">Critical Thinking</h4>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Develop analytical skills through logical deduction and problem-solving.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
