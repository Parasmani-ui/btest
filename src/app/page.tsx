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

  const startHospitalSimulation = () => {
    router.push(`/hospital-simulation`);
  };

  const startFakeNewsSimulation = () => {
    router.push(`/fake-news-simulation`);
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
                  className="w-full p-3 text-white"
                  shimmerColor="rgba(255, 255, 255, 0.8)"
                  shimmerSize="0.1em"
                  shimmerDuration="2s"
                  borderRadius="0.5rem"
                  background="rgb(245, 101, 39)"
                >
                  Critical Misinformation
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
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    Critical Reading
                  </SparklesText>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>5-8m | Quick Investigation</p>
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
                    Critical Investigation
                  </SparklesText>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>5-8m | POSH Training</p>
                </div>

                {/* Crisis Management card */}
                <div 
                  className={`p-6 rounded-lg border border-[rgb(220,38,38)] ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} cursor-pointer hover:shadow-lg transition`} 
                  onClick={startHospitalSimulation}
                >
                  <SparklesText 
                    className="text-lg font-bold mb-2"
                    colors={{ first: "#ef4444", second: "#f87171" }}
                    sparklesCount={6}
                  >
                    Crisis Management
                  </SparklesText>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>5-8m | Hospital Simulation</p>
                </div>

                {/* Critical Misinformation card */}
                <div 
                  className={`p-6 rounded-lg border border-[rgb(245,101,39)] ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} cursor-pointer hover:shadow-lg transition`} 
                  onClick={startFakeNewsSimulation}
                >
                  <SparklesText 
                    className="text-lg font-bold mb-2"
                    colors={{ first: "#f59e0b", second: "#fbbf24" }}
                    sparklesCount={6}
                  >
                    Critical Misinformation
                  </SparklesText>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>5-8m | Fake News</p>
                </div>
              </div>
            </div>

            {/* What We Do Section */}
            <div className="mb-16">
              <div className="flex justify-center mb-8">
                <TextAnimate
                  className="text-2xl font-bold border-b-4 border-blue-300 inline-block pb-1"
                  animation="slideUp"
                  by="word"
                  duration={0.3}
                >
                  What We Do
                </TextAnimate>
              </div>

              <p className={`text-center text-lg mb-8 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                We provide wide range of business services
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} text-center hover:shadow-lg transition`}>
                  <h3 className="font-semibold mb-2">SKILLS ASSESSMENT</h3>
                </div>
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} text-center hover:shadow-lg transition`}>
                  <h3 className="font-semibold mb-2">CREDENTIAL SERVICES</h3>
                </div>
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} text-center hover:shadow-lg transition`}>
                  <h3 className="font-semibold mb-2">SOLUTION FOR INSTITUTIONS</h3>
                </div>
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} text-center hover:shadow-lg transition`}>
                  <h3 className="font-semibold mb-2">CORPORATE SOLUTIONS</h3>
                </div>
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} text-center hover:shadow-lg transition`}>
                  <h3 className="font-semibold mb-2">PLACEMENT SUPPORT</h3>
                </div>
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} text-center hover:shadow-lg transition`}>
                  <h3 className="font-semibold mb-2">TEST YOUR SKILLS</h3>
                </div>
              </div>
              
              <div className="text-center mt-8">
                <ShimmerButton
                  onClick={() => {}}
                  className="px-6 py-3 text-white"
                  shimmerColor="rgba(255, 255, 255, 0.8)"
                  shimmerSize="0.1em"
                  shimmerDuration="2s"
                  borderRadius="0.5rem"
                  background="rgb(37, 99, 235)"
                >
                  View All Our Services
                </ShimmerButton>
              </div>
            </div>

            {/* Our Associations Section */}
            <div className="mb-16">
              <TextAnimate
                className="text-2xl font-bold text-center mb-8"
                animation="slideUp"
                by="word"
                duration={0.3}
              >
                Our Associations
              </TextAnimate>
              <p className={`text-center text-lg mb-8 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                We are associated with like minded Organizations
              </p>
              
              {/* <div className="grid grid-cols-2 md:grid-cols-5 gap-6 items-center">
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} text-center hover:shadow-lg transition`}>
                  <p className="font-semibold">PSSC</p>
                </div>
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} text-center hover:shadow-lg transition`}>
                  <p className="font-semibold">RASCI</p>
                </div>
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} text-center hover:shadow-lg transition`}>
                  <p className="font-semibold">AU</p>
                </div>
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} text-center hover:shadow-lg transition`}>
                  <p className="font-semibold">CII</p>
                </div>
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} text-center hover:shadow-lg transition`}>
                  <p className="font-semibold">DWSSC</p>
                </div>
              </div> */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6 items-center">
                {/* PSSC */}
                <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} text-center hover:shadow-lg transition`}>
                 <img src="/pssc.png" alt="PSSC Logo" className="w-22 h-22 mx-auto mb-1 object-contain" />
                 <p className="font-semibold">PSSC</p>
                </div>

              {/* RASCI */}
                <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} text-center hover:shadow-lg transition`}>
                  <img src="/rasci.jpg" alt="RASCI Logo" className="w-22 h-22 mx-auto mb-1 object-contain" />
                  <p className="font-semibold">RASCI</p>
                </div>

              {/* AU */}
                <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} text-center hover:shadow-lg transition`}>
                  <img src="/images/au.png" alt="AU " className="w-22 h-22 mx-auto mb-1 object-contain" />
                  <p className="font-semibold">AU</p>
                </div>

              {/* CII */}
                <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} text-center hover:shadow-lg transition`}>
                  <img src="/cii.png" alt="CII Logo" className="w-22 h-22 mx-auto mb-1 object-contain" />
                  <p className="font-semibold">CII</p>
                </div>

              {/* DWSSC */}
                <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} text-center hover:shadow-lg transition`}>
                  <img src="/dwssc.png" alt="DWSSC Logo" className="w- h-16 mx-auto mb-1 object-contain" />
                  <p className="font-semibold">DWSSC</p>
                </div>
              </div>


            </div>

            {/* About Us Section */}
            <div className="mb-16">
              <TextAnimate
                className="text-2xl font-bold text-center mb-8"
                animation="slideUp"
                by="word"
                duration={0.3}
              >
                Your Trusted Partners For Assessment
              </TextAnimate>
              <p className={`text-center text-lg mb-12 max-w-4xl mx-auto ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                The company is incorporated with mission of contributing to the inclusive growth of individuals and organisation and contribute to the development of country by being a key player in assessment system.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} text-center hover:shadow-lg transition`}>
                  <h3 className="font-bold text-lg mb-3">ABOUT US</h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    Parasmani Skills is started with the objective to be a key player as an assessing agency.
                  </p>
                </div>
                
                <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} text-center hover:shadow-lg transition`}>
                  <h3 className="font-bold text-lg mb-3">CAREER</h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    Parasmani Skills is providing employment opportunities for various roles & locations.
                  </p>
                </div>
                
                <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} text-center hover:shadow-lg transition`}>
                  <h3 className="font-bold text-lg mb-3">SOLUTIONS</h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    Parasmani Skills provides different services for students and agencies.
                  </p>
                </div>
                
                <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} text-center hover:shadow-lg transition`}>
                  <h3 className="font-bold text-lg mb-3">ASSOCIATE WITH US</h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    Parasmani Skills is working to supplement and compliment the effort of like-minded agencies.
                  </p>
                </div>
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
