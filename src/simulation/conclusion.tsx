import React from 'react';
import Link from 'next/link';
import { ResponsibleParty, MisconductType, PrimaryMotivation } from '@/types/simulation';
import { useTheme } from '@/utils/theme';

interface SimulationConclusionProps {
  conclusion: string;
  selectedResponsible: ResponsibleParty | string;
  selectedMisconduct: MisconductType | string;
  selectedMotivation: PrimaryMotivation | string;
  analysis: string;
  onStartNewCase: () => void;
  correctResponsible?: string;
  correctMisconduct?: string;
  correctMotivation?: string;
}

export const SimulationConclusion: React.FC<SimulationConclusionProps> = ({
  conclusion,
  selectedResponsible,
  selectedMisconduct,
  selectedMotivation,
  analysis,
  onStartNewCase,
  correctResponsible,
  correctMisconduct,
  correctMotivation
}) => {
  // Determine if the answer is correct (if we have the correct answers)
  const isResponsibleCorrect = correctResponsible ? selectedResponsible === correctResponsible : true;
  const isMisconductCorrect = correctMisconduct ? selectedMisconduct === correctMisconduct : true;
  const isMotivationCorrect = correctMotivation ? selectedMotivation === correctMotivation : true;
  
  const { theme } = useTheme();

  return (
    <div className={`${theme === 'dark' ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'} rounded-lg shadow-lg p-6`}>
      <h2 className={`text-2xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Case Analysis</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Responsible Individual</h3>
          <div className={`p-4 rounded-lg ${
            isResponsibleCorrect
              ? theme === 'dark' ? 'bg-green-800 text-green-100' : 'bg-green-100 text-green-800 border border-green-200'
              : theme === 'dark' ? 'bg-red-800 text-red-100' : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            <p className="font-medium">Your Selection: {selectedResponsible}</p>
            {correctResponsible && (
              <p className="mt-1">Correct Answer: {correctResponsible}</p>
            )}
          </div>
        </div>
        
        <div>
          <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Nature of Misconduct</h3>
          <div className={`p-4 rounded-lg ${
            isMisconductCorrect
              ? theme === 'dark' ? 'bg-green-800 text-green-100' : 'bg-green-100 text-green-800 border border-green-200'
              : theme === 'dark' ? 'bg-red-800 text-red-100' : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            <p className="font-medium">Your Selection: {selectedMisconduct}</p>
            {correctMisconduct && (
              <p className="mt-1">Correct Answer: {correctMisconduct}</p>
            )}
          </div>
        </div>
        
        <div>
          <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Primary Motivation</h3>
          <div className={`p-4 rounded-lg ${
            isMotivationCorrect
              ? theme === 'dark' ? 'bg-green-800 text-green-100' : 'bg-green-100 text-green-800 border border-green-200'
              : theme === 'dark' ? 'bg-red-800 text-red-100' : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            <p className="font-medium">Your Selection: {selectedMotivation}</p>
            {correctMotivation && (
              <p className="mt-1">Correct Answer: {correctMotivation}</p>
            )}
          </div>
        </div>
        
        <div>
          <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Expert Analysis</h3>
          <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} p-4 rounded-lg`}>
            <div className={`${theme === 'dark' ? 'text-green-400' : 'text-green-700'} leading-snug`} dangerouslySetInnerHTML={{ __html: analysis }} />
          </div>
        </div>
        
        <div className="pt-4 flex space-x-4">
          <button
            onClick={onStartNewCase}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Start New Case
          </button>
          <Link href="/" className="flex-1">
            <button
              className={`w-full py-3 ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'} ${theme === 'dark' ? 'text-white' : 'text-gray-800'} rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-400'} transition`}
            >
              Go To Home
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}; 