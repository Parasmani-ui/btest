'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { SparklesText } from '@/components/magicui/sparkles-text';
import { TextReveal } from '@/components/magicui/text-reveal';
import { ShimmerButton } from '@/components/magicui/shimmer-button';
import { TextAnimate } from '@/components/magicui/text-animate';
import { Header } from '@/components/ui/Header';

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

  const startHospitalSimulation = () => {
    router.push(`/hospital-simulation`);
  };

  const startFakeNewsSimulation = () => {
    router.push(`/fake-news-simulation`);
  };

  const startChainFailSimulation = () => {
    router.push(`/chainfail-simulation`);
  };

  // Don't render until client-side
  if (!mounted) {
    return null;
  }

  return (
    <>
      <Header />
      <main className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-900 text-gray-900'}`}>
        <div className="flex">
          {/* Sidebar */}
          <div className={`w-48 fixed h-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}>
            <div className="flex flex-col h-full">
              {/* <div className="p-4 flex justify-center">
                <Link href="/">
                  <Image src="/img.png" alt="DetectAive Logo" width={80} height={80} className="cursor-pointer" priority/>
                </Link>
              </div> */}
              
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
                    className="w-full p-3 text-white text-sm"
                    shimmerColor="rgba(255, 255, 255, 0.8)"
                    shimmerSize="0.1em"
                    shimmerDuration="2s"
                    borderRadius="0.5rem"
                    background="rgb(21, 128, 61)"
                  >
                    Critical Investigation
                  </ShimmerButton>

                  <ShimmerButton
                    onClick={startHospitalSimulation}
                    className="w-full p-3 text-white"
                    shimmerColor="rgba(255, 255, 255, 0.8)"
                    shimmerSize="0.1em"
                    shimmerDuration="2s"
                    borderRadius="0.5rem"
                    background="rgb(220, 38, 38)"
                  >
                    Crisis Management
                  </ShimmerButton>

                  <ShimmerButton
                    onClick={startFakeNewsSimulation}
                    className="w-full p-3 text-white text-sm"
                    shimmerColor="rgba(255, 255, 255, 0.8)"
                    shimmerSize="0.1em"
                    shimmerDuration="2s"
                    borderRadius="0.5rem"
                    background="rgb(245, 101, 39)"
                  >
                    Critical Misinformation
                  </ShimmerButton>

                  <ShimmerButton
                    onClick={startChainFailSimulation}
                    className="w-full p-3 text-white"
                    shimmerColor="rgba(255, 255, 255, 0.8)"
                    shimmerSize="0.1em"
                    shimmerDuration="2s"
                    borderRadius="0.5rem"
                    background="rgb(168, 85, 247)"
                  >
                    Critical ChainFail
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
          <div className="ml-48 flex-grow p-8 overflow-y-auto">
            <div className="max-w-6xl mx-auto">
              {/* Header Section */}
              <div className="text-center mb-12">
                <Image src="/img.png" alt="Parasmani Skills Logo" width={200} height={200} className="mx-auto mb-6" priority/>
                
                <div className="mb-6">
                  <SparklesText 
                    className="text-2xl sm:text-3xl font-bold mb-2"
                    colors={{ first: "#3b82f6", second: "#10b981" }}
                  >
                    Your Trusted Company
                  </SparklesText>
                  <h2 className="text-xl font-semibold mb-4">Skills Assessment Agency</h2>
                  <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} max-w-4xl mx-auto`}>
                    "Parasmani Skills" is started with the objective to be a key player as an assessing agency and incorporated the socio-economic background of the trainee in the assessment procedure so as to make the whole process more objective.
                  </p>
                </div>
              </div>

              {/* Game Modes Section */}
              <div className="mb-16">
                <TextAnimate
                  className="text-2xl font-bold text-center mb-8"
                  animation="slideUp"
                  by="word"
                  duration={0.3}
                >
                  TEST YOUR SKILLS
                </TextAnimate>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                  {/* Critical Reading card */}
                  <div 
                    className={`p-6 rounded-lg border border-[rgb(37,99,235)] ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} cursor-pointer hover:shadow-lg transition`} 
                    onClick={startGame}
                  >
                    <SparklesText 
                      className="text-lg font-bold mb-2"
                      colors={{ first: "#3b82f6", second: "#60a5fa" }}
                      sparklesCount={6}
                    >
                      Quick Investigation
                    </SparklesText>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>5-8m | Critical Reading</p>
                  </div>
                  
                  {/* Critical Investigation card */}
                  <div 
                    className={`p-6 rounded-lg border border-[rgb(21,128,61)] ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} cursor-pointer hover:shadow-lg transition`} 
                    onClick={startSimulation}
                  >
                    <SparklesText 
                      className="text-lg font-bold mb-2"
                      colors={{ first: "#10b981", second: "#34d399" }}
                      sparklesCount={6}
                    >
                      Complex Investigation
                    </SparklesText>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>15-30m | Critical Investigation</p>
                  </div>
                  
                  {/* Crisis Management card */}
                  <div 
                    className={`p-6 rounded-lg border border-[rgb(220,38,38)] ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} cursor-pointer hover:shadow-lg transition`} 
                    onClick={startHospitalSimulation}
                  >
                    <SparklesText 
                      className="text-lg font-bold mb-2"
                      colors={{ first: "#dc2626", second: "#ef4444" }}
                      sparklesCount={6}
                    >
                      Crisis Response
                    </SparklesText>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>10-20m | Crisis Management</p>
                  </div>
                  
                  {/* Critical Misinformation card */}
                  <div 
                    className={`p-6 rounded-lg border border-[rgb(245,101,39)] ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} cursor-pointer hover:shadow-lg transition`} 
                    onClick={startFakeNewsSimulation}
                  >
                    <SparklesText 
                      className="text-lg font-bold mb-2"
                      colors={{ first: "#f56527", second: "#fb923c" }}
                      sparklesCount={6}
                    >
                      Information Scrutiny
                    </SparklesText>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>8-15m | Critical Misinformation</p>
                  </div>
                  
                  {/* Critical ChainFail card */}
                  <div 
                    className={`p-6 rounded-lg border border-[rgb(168,85,247)] ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} cursor-pointer hover:shadow-lg transition`} 
                    onClick={startChainFailSimulation}
                  >
                    <SparklesText 
                      className="text-lg font-bold mb-2"
                      colors={{ first: "#a855f7", second: "#c084fc" }}
                      sparklesCount={6}
                    >
                      Chain Analysis
                    </SparklesText>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>12-25m | Critical ChainFail</p>
                  </div>
                </div>
              </div>

                             {/* Skills showcase section */}

              <div className="mb-16">
                <div className="flex justify-center mb-8">
                  <TextAnimate
                    className="text-2xl font-bold border-b-4 border-blue-300 inline-block pb-1 text-white"
                    animation="slideUp"
                    by="word"
                    duration={0.3}
                  >
                    Experience our comprehensive skills assessment program 
                  </TextAnimate>
                </div>  
                <p className={`text-lg mt-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} max-w-3xl mx-auto`}>
                  Develop critical thinking, problem-solving, and investigative skills through immersive scenarios designed to challenge and enhance your cognitive abilities.
                </p>
              </div>

              {/* Partners section */}
              <div className="mb-16">
                <h3 className="text-xl font-bold text-center mb-8">Our Esteemed Partners</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8 items-center justify-center">
                  <div className="flex justify-center">
                    <Image src="/cii.png" alt="CII" width={80} height={80} className="object-contain" />
                  </div>
                  <div className="flex justify-center">
                    <Image src="/dwssc.png" alt="DWSSC" width={80} height={60} className="object-contain" />
                  </div>
                  <div className="flex justify-center">
                    <Image src="/ncvet_skill_india.png" alt="NCVET Skill India" width={80} height={80} className="object-contain" />
                  </div>
                  <div className="flex justify-center">
                    <Image src="/nsdc.png" alt="NSDC" width={80} height={80} className="object-contain" />
                  </div>
                  <div className="flex justify-center">
                    <Image src="/pssc.png" alt="PSSC" width={80} height={80} className="object-contain" />
                  </div>
                </div>
              </div>

              {/* About section */}
              <div className={`p-8 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} mb-16`}>
                <h3 className="text-2xl font-bold mb-6 text-center">Why Choose Parasmani ?</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <h4 className="text-lg font-semibold mb-3">🎯 Targeted Assessment</h4>
                    <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      Our assessments are designed to evaluate specific cognitive skills essential for modern problem-solving scenarios.
                    </p>
                  </div>
                  <div className="text-center">
                    <h4 className="text-lg font-semibold mb-3">🧠 Adaptive Learning</h4>
                    <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      Each simulation adapts to your skill level, providing personalized challenges that promote continuous improvement.
                    </p>
                  </div>
                  <div className="text-center">
                    <h4 className="text-lg font-semibold mb-3">📊 Comprehensive Analytics</h4>
                    <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      Detailed performance analytics help you understand your strengths and areas for development.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-8 border-t border-gray-300">
                <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  © 2016 Parasmani Skills. | Empowering minds through innovative assessment solutions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
