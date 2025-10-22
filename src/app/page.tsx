'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { TextReveal } from '@/components/magicui/text-reveal';
import { ShimmerButton } from '@/components/magicui/shimmer-button';
import { TextAnimate } from '@/components/magicui/text-animate';
import { Header } from '@/components/ui/Header';
import { useGameAuth } from '@/hooks/useGameAuth';
import { SignInPopup } from '@/components/auth/SignInPopup';



export default function Home() {
  const router = useRouter();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);
  const [showCaseOptions, setShowCaseOptions] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  
  // Authentication hook
  const { checkAuthAndProceed, showSignInPopup, closeSignInPopup, onSignInSuccess } = useGameAuth();

  // Sub-games data
  const negotiationSubGames = [
    "Contract Negotiation",
    "Salary Negotiation", 
    "Business Partnership",
    "Conflict Resolution",
    "International Trade"
  ];

  const financialSubGames = [
    "Expense Fraud Investigation",
    "Project Cost Overrun Audit",
    "Financial Fraud Investigation"
  ];

  // Component mounted after hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const startGame = () => {
    checkAuthAndProceed(() => {
      router.push(`/game?mode=quick`);
    }, 'Police Investigation');
  };

  const startSimulation = () => {
    checkAuthAndProceed(() => {
      router.push(`/simulation`);
    }, 'POSH Investigation');
  };

  const startHospitalSimulation = () => {
    checkAuthAndProceed(() => {
      router.push(`/hospital-simulation`);
    }, 'Hospital Management');
  };

  const startFakeNewsSimulation = () => {
    checkAuthAndProceed(() => {
      router.push(`/fake-news-simulation`);
    }, 'Social Media Misinformation');
  };

  const startChainFailSimulation = () => {
    checkAuthAndProceed(() => {
      router.push(`/chainfail-simulation`);
    }, 'Chain Analysis');
  };

  const startForensicAuditSimulation = () => {
    checkAuthAndProceed(() => {
      router.push(`/forensic-audit-simulation`);
    }, 'Financial Forensic');
  };

  const startFoodSafetySimulation = () => {
    checkAuthAndProceed(() => {
      router.push(`/food-safety-simulation`);
    }, 'Food Safety');
  };

  const startNegotiationSimulation = () => {
    checkAuthAndProceed(() => {
      router.push(`/negotiation-simulation`);
    }, 'Negotiation Simulation');
  };

  const startFinancialNegotiationSimulation = () => {
    checkAuthAndProceed(() => {
      router.push(`/financial-negotiation`);
    }, 'Financial Investigation');
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
          {/* Sidebar - Increased width from w-48 to w-64 */}
          <div className={`w-64 sticky top-0 h-screen overflow-y-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}>
            <div className="flex flex-col h-full">
              {/* <div className="p-4 flex justify-center">
                <Link href="/">
                  <Image src="/img.png" alt="DetectAive Logo" width={80} height={80} className="cursor-pointer" priority/>
                </Link>
              </div> */}
              
              <div className="p-6 flex-grow">
                <div className="mb-4 relative space-y-4">
                  <ShimmerButton
                    onClick={startGame}
                    className="w-full p-4 text-white text-sm font-medium"
                    shimmerColor="rgba(255, 255, 255, 0.8)"
                    shimmerSize="0.1em"
                    shimmerDuration="2s"
                    borderRadius="0.5rem"
                    background="rgb(37, 99, 235)"
                  >
                   Procedural Blind Spot
                  </ShimmerButton>
                  
                  <ShimmerButton
                    onClick={startSimulation}
                    className="w-full p-4 text-white text-sm font-medium"
                    shimmerColor="rgba(255, 255, 255, 0.8)"
                    shimmerSize="0.1em"
                    shimmerDuration="2s"
                    borderRadius="0.5rem"
                    background="rgb(21, 128, 61)"
                  >
                    Culture Compass
                  </ShimmerButton>

                  <ShimmerButton
                    onClick={startHospitalSimulation}
                    className="w-full p-4 text-white text-sm font-medium"
                    shimmerColor="rgba(255, 255, 255, 0.8)"
                    shimmerSize="0.1em"
                    shimmerDuration="2s"
                    borderRadius="0.5rem"
                    background="rgb(220, 38, 38)"
                  >
                    Lifeline & Leverage
                  </ShimmerButton>

                  <ShimmerButton
                    onClick={startFakeNewsSimulation}
                    className="w-full p-4 text-white text-sm font-medium"
                    shimmerColor="rgba(255, 255, 255, 0.8)"
                    shimmerSize="0.1em"
                    shimmerDuration="2s"
                    borderRadius="0.5rem"
                    background="rgb(245, 101, 39)"
                  >
                    Cyber Scrutiny
                  </ShimmerButton>

                  <ShimmerButton
                    onClick={startChainFailSimulation}
                    className="w-full p-4 text-white text-sm font-medium"
                    shimmerColor="rgba(255, 255, 255, 0.8)"
                    shimmerSize="0.1em"
                    shimmerDuration="2s"
                    borderRadius="0.5rem"
                    background="rgb(168, 85, 247)"
                  >
                    ChainFail 
                  </ShimmerButton>

                  <ShimmerButton
                    onClick={startForensicAuditSimulation}
                    className="w-full p-4 text-white text-sm font-medium"
                    shimmerColor="rgba(255, 255, 255, 0.8)"
                    shimmerSize="0.1em"
                    shimmerDuration="2s"
                    borderRadius="0.5rem"
                    background="rgb(245, 158, 11)"
                  >
                    Finance Forensic
                  </ShimmerButton>

                  <ShimmerButton
                    onClick={startFoodSafetySimulation}
                    className="w-full p-4 text-white text-sm font-medium"
                    shimmerColor="rgba(255, 255, 255, 0.8)"
                    shimmerSize="0.1em"
                    shimmerDuration="2s"
                    borderRadius="0.5rem"
                    background="rgb(8, 145, 178)"
                  >
                    Food Safety
                  </ShimmerButton>

                  <ShimmerButton
                    onClick={startNegotiationSimulation}
                    className="w-full p-4 text-white text-sm font-medium"
                    shimmerColor="rgba(255, 255, 255, 0.8)"
                    shimmerSize="0.1em"
                    shimmerDuration="2s"
                    borderRadius="0.5rem"
                    background="rgb(147, 51, 234)"
                  >
                    <div className="text-center">
                      Negotiation Simulation
                    </div>
                  </ShimmerButton>

                  <ShimmerButton
                    onClick={startFinancialNegotiationSimulation}
                    className="w-full p-4 text-white text-sm font-medium"
                    shimmerColor="rgba(255, 255, 255, 0.8)"
                    shimmerSize="0.1em"
                    shimmerDuration="2s"
                    borderRadius="0.5rem"
                    background="rgb(34, 197, 94)"
                  >
                    <div className="text-center">
                      Financial Investigation
                    </div>
                  </ShimmerButton>
                </div>
              </div>
              
              {/* <div className={`p-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`}>
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
              </div> */}
            </div>
          </div>
          
          {/* Main Content */}
          <div className="flex-grow p-8 overflow-y-auto">
            <div className="max-w-6xl mx-auto">
              {/* Header Section */}
              <div className="text-center mb-12">
                <Image src="/img.png" alt="Parasmani Skills Logo" width={200} height={200} className="mx-auto mb-6" priority/>
                
                <div className="mb-6">
                  <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                    Your Trusted Company
                  </h1>
                  <h2 className="text-xl font-semibold mb-4">Skills Assessment Agency</h2>
                  <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} max-w-4xl mx-auto`}>
                    "AIMA Bizlab" is started with the objective to be a key player as an assessing agency and incorporated the socio-economic background of the trainee in the assessment procedure so as to make the whole process more objective.
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
                
                {/* First Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
                  {/* Police Investigation card */}
                  <div 
                    className={`rounded-lg border border-[rgb(37,99,235)] ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} cursor-pointer hover:shadow-lg transition overflow-hidden`} 
                    onClick={startGame}
                  >
                    <div className="relative h-40 w-full">
                      <Image 
                        src="/01_police_investigation.png" 
                        alt="Police Investigation" 
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 20vw"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-bold mb-2">
                        Police Investigation
                      </h3>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Procedural Blind Spot</p>
                    </div>
                  </div>
                  
                  {/* POSH Investigation card */}
                  <div 
                    className={`rounded-lg border border-[rgb(21,128,61)] ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} cursor-pointer hover:shadow-lg transition overflow-hidden`} 
                    onClick={startSimulation}
                  >
                    <div className="relative h-40 w-full">
                      <Image 
                        src="/02_posh.png" 
                        alt="POSH Investigation" 
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 20vw"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-bold mb-2">
                        POSH Investigation
                      </h3>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Culture Compass</p>
                    </div>
                  </div>
                  
                  {/* Hospital Management card */}
                  <div 
                    className={`rounded-lg border border-[rgb(220,38,38)] ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} cursor-pointer hover:shadow-lg transition overflow-hidden`} 
                    onClick={startHospitalSimulation}
                  >
                    <div className="relative h-40 w-full">
                      <Image 
                        src="/03_hospital_management.png" 
                        alt="Hospital Management" 
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 20vw"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-bold mb-2">
                        {/* Hospital Management*/}
                        Crisis Management
                      </h3>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Lifeline & Leverage</p>
                    </div>
                  </div>
                  
                  {/* Social Media Misinformation card */}
                  <div 
                    className={`rounded-lg border border-[rgb(245,101,39)] ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} cursor-pointer hover:shadow-lg transition overflow-hidden`} 
                    onClick={startFakeNewsSimulation}
                  >
                    <div className="relative h-40 w-full">
                      <Image 
                        src="/04_fakeNews.png" 
                        alt="Social Media Misinformation" 
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 20vw"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-bold mb-2">
                        Social Media Misinformation
                      </h3>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Cyber Scrutiny</p>
                    </div>
                  </div>
                  
                  {/* Chain Analysis card */}
                  <div 
                    className={`rounded-lg border border-[rgb(168,85,247)] ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} cursor-pointer hover:shadow-lg transition overflow-hidden`} 
                    onClick={startChainFailSimulation}
                  >
                    <div className="relative h-40 w-full">
                      <Image 
                        src="/05_chain_analysis.png" 
                        alt="Chain Analysis" 
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 20vw"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-bold mb-2">
                        Chain Analysis
                      </h3>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Critical ChainFail</p>
                    </div>
                  </div>
                </div>

                {/* Second Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                  {/* Financial Forensic card */}
                  <div 
                    className={`rounded-lg border border-[rgb(245,158,11)] ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} cursor-pointer hover:shadow-lg transition overflow-hidden`} 
                    onClick={startForensicAuditSimulation}
                  >
                    <div className="relative h-40 w-full">
                      <Image 
                        src="/06_financial_forensic.png" 
                        alt="Financial Forensic" 
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 20vw"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-bold mb-2">
                        Financial Forensic
                      </h3>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Integrity Ledger</p>
                    </div>
                  </div>
                  
                  {/* Food Safety card */}
                  <div 
                    className={`rounded-lg border border-[rgb(8,145,178)] ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} cursor-pointer hover:shadow-lg transition overflow-hidden`} 
                    onClick={startFoodSafetySimulation}
                  >
                    <div className="relative h-40 w-full">
                      <Image 
                        src="/07_food_safety.png" 
                        alt="Food Safety" 
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 20vw"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-bold mb-2">
                        Food Safety
                      </h3>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Critical Thinking</p>
                    </div>
                  </div>
                  
                  {/* Negotiation Simulation - Enhanced with hover */}
                  <div 
                    className={`relative rounded-lg border border-[rgb(168,85,247)] ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden`} 
                    onClick={startNegotiationSimulation}
                    onMouseEnter={() => setHoveredCard('negotiation')}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    <div className="relative h-40 w-full">
                      <Image 
                        src="/08_negotiation.png" 
                        alt="Negotiation Simulation" 
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 20vw"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-bold mb-2">
                        Negotiation Simulation
                      </h3>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Multiple modes</p>
                    </div>
                    
                    {/* Hover overlay */}
                    {hoveredCard === 'negotiation' && (
                      <div className={`absolute inset-0 rounded-lg p-4 ${theme === 'dark' ? 'bg-gray-900/95' : 'bg-white/95'} border border-purple-400 z-10 backdrop-blur-sm`}>
                        <div className="text-sm font-semibold mb-2 text-purple-600">5 Negotiation Scenarios:</div>
                        <ul className={`text-xs space-y-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                          {negotiationSubGames.map((game, index) => (
                            <li key={index} className="flex items-center">
                              <span className="text-purple-500 mr-2">•</span>
                              {game}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  {/* Financial Investigation card - Enhanced with hover */}
                  <div 
                    className={`relative rounded-lg border border-[rgb(21,128,61)] ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden`} 
                    onClick={startFinancialNegotiationSimulation}
                    onMouseEnter={() => setHoveredCard('financial')}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    <div className="relative h-40 w-full">
                      <Image 
                        src="/09_Financial Investigation.png" 
                        alt="Financial Investigation" 
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 20vw"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-bold mb-2">
                        Financial Investigation
                      </h3>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>3 modes</p>
                    </div>
                    
                    {/* Hover overlay */}
                    {hoveredCard === 'financial' && (
                      <div className={`absolute inset-0 rounded-lg p-4 ${theme === 'dark' ? 'bg-gray-900/95' : 'bg-white/95'} border border-green-400 z-10 backdrop-blur-sm`}>
                        <div className="text-sm font-semibold mb-2 text-green-600">3 Investigation Modes:</div>
                        <ul className={`text-xs space-y-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                          {financialSubGames.map((game, index) => (
                            <li key={index} className="flex items-center">
                              <span className="text-green-500 mr-2">•</span>
                              {game}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <div className={`rounded-lg border border-gray-300 ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100'} opacity-50 overflow-hidden`}>
                    <div className="h-40 w-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">Coming Soon</span>
                    </div>
                    <div className="p-4">
                      <div className="text-lg font-bold mb-2 text-gray-500">Coming Soon</div>
                      <p className="text-sm text-gray-400">New Game Mode</p>
                    </div>
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
                  © AIMA Bizlab | Empowering minds through innovative assessment solutions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Sign In Popup */}
      <SignInPopup
        isOpen={showSignInPopup}
        onClose={closeSignInPopup}
        onSuccess={onSignInSuccess}
      />
    </>
  );
}