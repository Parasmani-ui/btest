import React from 'react';
import Button from './Button';

interface AnswerPanelProps {
  suspects: string[];
  onArrest: (suspect: string) => void;
}

const AnswerPanel: React.FC<AnswerPanelProps> = ({
  suspects,
  onArrest
}) => {
  return (
    <div className="p-4 rounded-lg bg-gray-800">
      <h3 className="text-xl font-bold mb-4">Make an Arrest</h3>
      <p className="mb-4">Who do you think is the murderer?</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {suspects.map((suspect, index) => (
          <button
            key={index}
            onClick={() => onArrest(suspect)}
            className="p-3 rounded-lg bg-red-800 hover:bg-red-700"
          >
            {suspect}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AnswerPanel; 