'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import GameHeader from '@/components/ui/GameHeader';
import ScenarioPlanningClient from './client-page';

interface Navigator {
  id: number;
  name: string;
  description: string;
  icon: string;
}

const NAVIGATORS: Navigator[] = [
  {
    id: 0,
    name: "Political Navigator",
    description: "Identify political and legal driving forces that could impact your strategic issue. Explore government policies, regulations, and political dynamics.",
    icon: "🏛️"
  },
  {
    id: 1,
    name: "Social Navigator",
    description: "Analyze social driving forces including demographics, culture, digital connectivity, education, and societal trends.",
    icon: "👥"
  },
  {
    id: 2,
    name: "Technology Navigator",
    description: "Examine technological forces such as AI, IoT, automation, connectivity, and their adoption barriers or accelerators.",
    icon: "🔬"
  },
  {
    id: 3,
    name: "Economic Navigator",
    description: "Explore economic drivers like macroeconomic trends, industry forces, policy changes, and international exposure.",
    icon: "💰"
  },
  {
    id: 4,
    name: "Focal Issue Transformer",
    description: "Transform narrow, controllable issues into broader focal issues focusing on external events beyond your control.",
    icon: "🎯"
  },
  {
    id: 5,
    name: "Force Classifier",
    description: "Classify driving forces into logical buckets and create 2x2 scenarios with vivid narratives of potential futures.",
    icon: "🔮"
  }
];

export default function ScenarioPlanningPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [hoveredNavigator, setHoveredNavigator] = useState<number | null>(null);
  const [selectedNavigator, setSelectedNavigator] = useState<number | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const router = useRouter();

  const selectNavigator = (navigatorId: number) => {
    setSelectedNavigator(navigatorId);
  };

  const handleBackToSelection = () => {
    setSelectedNavigator(null);
    setSessionStartTime(null);
  };

  const handleSessionStart = (startTime: Date) => {
    setSessionStartTime(startTime);
  };

  const handleSessionEnd = (endTime: Date, elapsedTime: string) => {
    console.log('Session ended:', elapsedTime);
  };

  // If navigator is selected, show the client component
  if (selectedNavigator !== null) {
    return (
      <ScenarioPlanningClient
        navigatorId={selectedNavigator}
        onBackToSelection={handleBackToSelection}
        onSessionStart={handleSessionStart}
        onSessionEnd={handleSessionEnd}
      />
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <GameHeader gameTitle="Scenario Planning Workshop" />
      
      <main className={`container mx-auto px-4 py-8 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Scenario Planning Workshop</h1>
          <p className={`text-lg max-w-3xl mx-auto ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            Explore strategic foresight through our comprehensive navigators. Each tool helps you identify driving forces and build robust scenarios for your strategic decisions.
          </p>
        </div>

        {/* Navigator Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {NAVIGATORS.map((navigator) => (
            <div
              key={navigator.id}
              className={`rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                theme === 'dark' 
                  ? 'bg-gray-800 border-indigo-500 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/50' 
                  : 'bg-white border-indigo-300 hover:border-indigo-400 hover:shadow-xl'
              } ${
                hoveredNavigator === navigator.id ? 'scale-105' : ''
              }`}
              onClick={() => selectNavigator(navigator.id)}
              onMouseEnter={() => setHoveredNavigator(navigator.id)}
              onMouseLeave={() => setHoveredNavigator(null)}
            >
              <div className="p-6">
                {/* Icon and Title */}
                <div className="flex items-center mb-4">
                  <span className="text-4xl mr-4">{navigator.icon}</span>
                  <h3 className="text-xl font-bold">{navigator.name}</h3>
                </div>
                
                {/* Description */}
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                  {navigator.description}
                </p>

                {/* Hover Indicator */}
                {hoveredNavigator === navigator.id && (
                  <div className={`mt-4 text-sm font-semibold ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>
                    Click to start →
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Info Section */}
        <div className={`rounded-lg p-6 mb-8 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className="text-2xl font-bold mb-4">How Scenario Planning Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-3xl mb-2">1️⃣</div>
              <h3 className="font-semibold mb-2">Identify Forces</h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Use navigators to explore political, economic, social, and technological forces that could impact your strategic issue.
              </p>
            </div>
            <div>
              <div className="text-3xl mb-2">2️⃣</div>
              <h3 className="font-semibold mb-2">Transform Issues</h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Convert narrow, controllable issues into broader focal issues that focus on external events beyond your control.
              </p>
            </div>
            <div>
              <div className="text-3xl mb-2">3️⃣</div>
              <h3 className="font-semibold mb-2">Build Scenarios</h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Classify forces and create vivid scenarios that help you prepare for different possible futures.
              </p>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center">
          <button
            onClick={() => router.push('/')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              theme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
            }`}
          >
            ← Back to Home
          </button>
        </div>
      </main>
    </div>
  );
}
