import React from 'react';
import Link from 'next/link';
import { GameState } from '@/types/gameState';
import Button from './Button';
import { useTheme } from '@/utils/theme';
import { TextAnimate } from '@/components/magicui/text-animate';
import { SparklesText } from '@/components/magicui/sparkles-text';

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
            <SparklesText
              className="text-lg" 
              colors={{ first: "#10b981", second: "#34d399" }}
              sparklesCount={6}
            >
              Congratulations, Detective! You've successfully identified the killer and brought them to justice.
            </SparklesText>
          </div>
        ) : (
          <div className={`p-3 rounded mb-4 ${theme === 'dark' ? 'bg-red-900 text-white' : 'bg-red-100 text-red-800 border border-red-200'}`}>
            <SparklesText
              className="text-lg"
              colors={{ first: "#ef4444", second: "#f87171" }}
              sparklesCount={6}
            >
              Unfortunately, you've arrested the wrong person.
            </SparklesText>
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
        <Link href="/">
          <Button className="text-white" background={theme === 'dark' ? 'rgb(75, 85, 99)' : 'rgb(156, 163, 175)'}>Go To Home</Button>
        </Link>
      </div>
    </div>
  );
};

export default ArrestResult; 