import React from 'react';
import Link from 'next/link';
import { GameState } from '@/types/gameState';
import Button from './Button';

interface ArrestResultProps {
  gameState: GameState;
  resetGame: () => void;
}

const ArrestResult: React.FC<ArrestResultProps> = ({ gameState, resetGame }) => {
  const { arrestResult } = gameState;
  
  if (!arrestResult) {
    return <div>No arrest result found</div>;
  }

  return (
    <div className="arrest-result p-6 bg-slate-800 rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">
        {arrestResult.correct 
          ? 'Case Closed Successfully!' 
          : 'Wrong Suspect Arrested!'}
      </h2>
      
      <div className="bg-slate-700 p-4 rounded-lg mb-4">
        <p className="mb-2">
          You arrested: <span className="font-bold text-yellow-400">{arrestResult.suspectArrested}</span>
        </p>
        <p className="mb-4">
          The actual murderer was: <span className="font-bold text-red-400">{arrestResult.murderer}</span>
        </p>
        
        {arrestResult.correct ? (
          <div className="bg-green-900 p-3 rounded">
            <p>Congratulations, Detective! You've successfully identified the killer and brought them to justice.</p>
          </div>
        ) : (
          <div className="bg-red-900 p-3 rounded mb-4">
            <p>Unfortunately, you've arrested the wrong person.</p>
          </div>
        )}

        {arrestResult.reasoning && (
          <div className="bg-blue-900 p-3 rounded mt-4">
            <h3 className="text-lg font-semibold mb-2">Evidence Against {arrestResult.murderer}:</h3>
            <p>{arrestResult.reasoning}</p>
          </div>
        )}
      </div>
      
      <div className="flex justify-center space-x-4">
        <Button onClick={resetGame}>Start New Case</Button>
        <Link href="/">
          <Button className="bg-gray-600 hover:bg-gray-700">Go To Home</Button>
        </Link>
      </div>
    </div>
  );
};

export default ArrestResult; 