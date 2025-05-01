import React from 'react';
import Link from 'next/link';
import { ResponsibleParty, MisconductType, PrimaryMotivation } from '@/types/simulation';

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

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 text-gray-200">
      <h2 className="text-2xl font-bold mb-6 text-white">Case Analysis</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2 text-white">Responsible Individual</h3>
          <div className={`p-4 rounded-lg ${
            isResponsibleCorrect
              ? 'bg-green-800 text-green-100'
              : 'bg-red-800 text-red-100'
          }`}>
            <p className="font-medium">Your Selection: {selectedResponsible}</p>
            {correctResponsible && (
              <p className="mt-1">Correct Answer: {correctResponsible}</p>
            )}
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-2 text-white">Nature of Misconduct</h3>
          <div className={`p-4 rounded-lg ${
            isMisconductCorrect
              ? 'bg-green-800 text-green-100'
              : 'bg-red-800 text-red-100'
          }`}>
            <p className="font-medium">Your Selection: {selectedMisconduct}</p>
            {correctMisconduct && (
              <p className="mt-1">Correct Answer: {correctMisconduct}</p>
            )}
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-2 text-white">Primary Motivation</h3>
          <div className={`p-4 rounded-lg ${
            isMotivationCorrect
              ? 'bg-green-800 text-green-100'
              : 'bg-red-800 text-red-100'
          }`}>
            <p className="font-medium">Your Selection: {selectedMotivation}</p>
            {correctMotivation && (
              <p className="mt-1">Correct Answer: {correctMotivation}</p>
            )}
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-2 text-white">Expert Analysis</h3>
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="text-green-400 leading-snug" dangerouslySetInnerHTML={{ __html: analysis }} />
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
              className="w-full py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              Go To Home
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}; 