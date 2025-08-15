import React from 'react';
import Link from 'next/link';
import { GameState } from '@/types/gameState';
import Button from './Button';
import { useTheme } from '@/utils/theme';
import { TextAnimate } from '@/components/magicui/text-animate';


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
      <TextAnimate 
        className="text-2xl font-bold mb-4 text-center"
        animation="blurInUp" 
        by="word"
        duration={0.4}
      >
        {arrestResult.correct 
          ? 'Case Closed Successfully!' 
          : 'Wrong Suspect Arrested!'}
      </TextAnimate>
      
      {/* Display elapsed time */}
      {gameState.finalElapsedTime && (
        <div className={`text-center mb-4 p-3 rounded-lg ${theme === 'dark' ? 'bg-slate-700' : 'bg-white'}`}>
          <span className={`text-lg font-semibold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
            Time Elapsed: {gameState.finalElapsedTime}
          </span>
        </div>
      )}
      
      <div className={`p-4 rounded-lg mb-4 ${theme === 'dark' ? 'bg-slate-700' : 'bg-white'}`}>
        <div className="mb-2 flex items-center">
          <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            You arrested:
          </span>
          {' '}
          <span className="font-bold text-yellow-600 ml-2">{arrestResult.suspectArrested}</span>
        </div>
        
        <div className="mb-4 flex items-center">
          <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            The actual murderer was:
          </span>
          {' '}
          <span className="font-bold text-red-600 ml-2">{arrestResult.murderer}</span>
        </div>
        
        {arrestResult.correct ? (
          <div className={`p-3 rounded ${theme === 'dark' ? 'bg-green-900 text-white' : 'bg-green-100 text-green-800 border border-green-200'}`}>
            <p className="text-lg">
              Congratulations, Detective! You've successfully identified the killer and brought them to justice.
            </p>
          </div>
        ) : (
          <div className={`p-3 rounded mb-4 ${theme === 'dark' ? 'bg-red-900 text-white' : 'bg-red-100 text-red-800 border border-red-200'}`}>
            <p className="text-lg">
              Unfortunately, you've arrested the wrong person.
            </p>
          </div>
        )}

        {arrestResult.reasoning && (
          <div className={`p-3 rounded mt-4 ${theme === 'dark' ? 'bg-blue-900 text-white' : 'bg-blue-100 text-blue-800 border border-blue-200'}`}>
            <div className="text-lg font-semibold mb-2">
              <span className={`${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                Evidence Against {arrestResult.murderer}:
              </span>
            </div>
            <p className={theme === 'dark' ? 'text-white' : 'text-gray-800'}>{arrestResult.reasoning}</p>
          </div>
        )}
      </div>
      
      <div className="flex justify-center space-x-4">
        <Button onClick={resetGame}>Start New Case</Button>
        <Link href="/dashboard">
          <Button className="text-white" background={theme === 'dark' ? 'rgb(29, 78, 216)' : 'rgb(59, 130, 246)'}>Go To Dashboard</Button>
        </Link>
        <Link href="/">
          <Button className="text-white" background={theme === 'dark' ? 'rgb(75, 85, 99)' : 'rgb(156, 163, 175)'}>Go To Home</Button>
        </Link>
      </div>
    </div>
  );
};

export default ArrestResult; 