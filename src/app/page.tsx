'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { SparklesText } from '@/components/magicui/sparkles-text';
import { TextReveal } from '@/components/magicui/text-reveal';
import { ShimmerButton } from '@/components/magicui/shimmer-button';
import { TextAnimate } from '@/components/magicui/text-animate';

export default function Home() {
  const router = useRouter();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);
  const [showCaseOptions, setShowCaseOptions] = useState(false);

  // Component mounted after hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const startGame = () => {
    router.push(`/game?mode=quick`);
  };

  const startSimulation = () => {
    router.push(`/simulation`);
  };

  // Don't render until client-side
  if (!mounted) {
    return null;
  }

  return (
    <main className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className="flex">
        {/* Sidebar */}
        <div className={`w-48 fixed h-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}>
          <div className="flex flex-col h-full">
            <div className="p-4 flex justify-center">
              <Link href="/">
                <Image src="/img.png" alt="DetectAive Logo" width={80} height={80} className="cursor-pointer" priority/>
              </Link>
            </div>
            
            <div className="p-4 flex-grow">
              <div className="mb-4 relative space-y-4">
                <ShimmerButton
                  onClick={startGame}
                  className="w-full p-3 text-white"
                  shimmerColor="rgba(255, 255, 255, 0.8)"
                  shimmerSize="0.1em"
                  shimmerDuration="2s"
                  borderRadius="0.5rem"
                  background="rgb(37, 99, 235)"
                >
                  Critical Reading
                </ShimmerButton>
                
                <ShimmerButton
                  onClick={startSimulation}
                  className="w-full p-3 text-white"
                  shimmerColor="rgba(255, 255, 255, 0.8)"
                  shimmerSize="0.1em"
                  shimmerDuration="2s"
                  borderRadius="0.5rem"
                  background="rgb(21, 128, 61)"
                >
                  Critical Investigation
                </ShimmerButton>
              </div>
            </div>
            
            <div className={`p-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`}>
              <div className="flex flex-col gap-4">
                <Link href="/admin" className={`w-full p-2 text-center ${theme === 'dark' ? 'bg-gray-600 text-white' : 'bg-gray-400 text-gray-800'} rounded`}>
                  Admin
                </Link>
                <div className="flex justify-end">
                  <button onClick={toggleTheme} className="text-xl">
                    {theme === 'dark' ? '🌙' : '☀️'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="ml-48 flex-grow p-8">
          <div className="max-w-4xl mx-auto text-center">
            <Image src="/img.png" alt="DetectAive Logo" width={200} height={200} className="mx-auto" priority/>
            
            {/* Main text with SparklesText */}
            <div className="my-6 text-lg relative min-h-[100px] overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <SparklesText 
                  className="text-xl sm:text-2xl font-normal"
                  colors={{ first: "#3b82f6", second: "#10b981" }}
                >
                  Play as a detective solving procedurally generated murder mysteries. 
                  Examine evidence, interrogate suspects, and solve cases.
                </SparklesText>
              </div>
            </div>
            
            <div className="my-8 flex flex-col sm:flex-row justify-center gap-6">
              {/* Critical Reading card with SparklesText */}
              <div 
                className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} cursor-pointer hover:shadow-lg transition`} 
                onClick={startGame}
              >
                <SparklesText 
                  className="text-lg sm:text-xl font-bold mb-2"
                  colors={{ first: "#3b82f6", second: "#60a5fa" }}
                  sparklesCount={6}
                >
                  Critical Reading
                </SparklesText>
                <p>5-8m | Quick Investigation</p>
              </div>
              
              {/* Critical Investigation card with SparklesText */}
              <div 
                className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} cursor-pointer hover:shadow-lg transition`} 
                onClick={startSimulation}
              >
                <SparklesText 
                  className="text-lg sm:text-xl font-bold mb-2"
                  colors={{ first: "#10b981", second: "#34d399" }}
                  sparklesCount={6}
                >
                  Critical Investigation
                </SparklesText>
                <p>5-8m | POSH Training Simulation</p>
              </div>
            </div>
            
            {/* How to Play title with TextAnimate */}
            <TextAnimate
              className="text-xl font-bold mt-12 mb-4"
              animation="slideUp"
              by="word"
              duration={0.3}
            >
              How to Play Critical Reading
            </TextAnimate>
            
            {/* Rules section with 2-column layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="mb-2"><strong>1. Start a Critical Reading:</strong> Begin your investigation.</p>
                <p className="mb-2"><strong>2. Examine the Crime Scene:</strong> Review the initial evidence and circumstances.</p>
                <p className="mb-2"><strong>3. Interrogate Suspects:</strong> Question each suspect to find inconsistencies.</p>
              </div>
              <div>
                <p className="mb-2"><strong>4. Investigate Evidence:</strong> Examine each piece of evidence for clues.</p>
                <p className="mb-2"><strong>5. Make an Arrest:</strong> When confident, make an arrest and solve the case.</p>
                <p className="mb-2"><strong>6. Case Resolution:</strong> Learn if you arrested the right suspect.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <footer className={`fixed bottom-0 w-full p-2 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}>
        <div className="flex justify-between items-center">
          <span>@Parasmani Skill Pvt</span>
        </div>
      </footer>
      
      {/* Add custom scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${theme === 'dark' ? '#1f2937' : '#e5e7eb'};
          border-radius: 5px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${theme === 'dark' ? '#4b5563' : '#9ca3af'};
          border-radius: 5px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${theme === 'dark' ? '#6b7280' : '#6b7280'};
        }
      `}</style>
    </main>
  );
}
