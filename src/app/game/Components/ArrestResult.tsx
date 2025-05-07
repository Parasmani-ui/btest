import React from 'react';
import Link from 'next/link';
import { GameState } from '@/types/gameState';
import Button from './Button';
import { useTheme } from '@/utils/theme';

interface ArrestResultProps {
  gameState: GameState;
  resetGame: () => void;
}

const ArrestResult: React.FC<ArrestResultProps> = ({ gameState, resetGame }) => {
  const { arrestResult } = gameState;
  const { theme } = useTheme();
  
  if (!arrestResult) {
    return <div>No arrest result found</div>;
  }

  return (
    <div className={`arrest-result p-6 ${theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-gray-200 text-gray-800'} rounded-lg shadow-lg max-w-2xl mx-auto`}>
      <h2 className="text-2xl font-bold mb-4 text-center">
        {arrestResult.correct 
          ? 'Case Closed Successfully!' 
          : 'Wrong Suspect Arrested!'}
      </h2>
      
      <div className={`p-4 rounded-lg mb-4 ${theme === 'dark' ? 'bg-slate-700' : 'bg-white'}`}>
        <p className="mb-2">
          You arrested: <span className="font-bold text-yellow-600">{arrestResult.suspectArrested}</span>
        </p>
        <p className="mb-4">
          The actual murderer was: <span className="font-bold text-red-600">{arrestResult.murderer}</span>
        </p>
        
        {arrestResult.correct ? (
          <div className={`p-3 rounded ${theme === 'dark' ? 'bg-green-900 text-white' : 'bg-green-100 text-green-800 border border-green-200'}`}>
            <p>Congratulations, Detective! You've successfully identified the killer and brought them to justice.</p>
          </div>
        ) : (
          <div className={`p-3 rounded mb-4 ${theme === 'dark' ? 'bg-red-900 text-white' : 'bg-red-100 text-red-800 border border-red-200'}`}>
            <p>Unfortunately, you've arrested the wrong person.</p>
          </div>
        )}

        {arrestResult.reasoning && (
          <div className={`p-3 rounded mt-4 ${theme === 'dark' ? 'bg-blue-900 text-white' : 'bg-blue-100 text-blue-800 border border-blue-200'}`}>
            <h3 className="text-lg font-semibold mb-2">Evidence Against {arrestResult.murderer}:</h3>
            <p>{arrestResult.reasoning}</p>
          </div>
        )}
      </div>
      
      <div className="flex justify-center space-x-4">
        <Button onClick={resetGame}>Start New Case</Button>
        <Link href="/">
          <Button className={`${theme === 'dark' ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-400 hover:bg-gray-500'}`}>Go To Home</Button>
        </Link>
      </div>
    </div>
  );
};

export default ArrestResult; 