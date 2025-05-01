import React from 'react';

interface CharacterActionPanelProps {
  suspects: string[];
  interrogatedSuspects: string[];
  onInterrogate: (suspect: string) => void;
}

const CharacterActionPanel: React.FC<CharacterActionPanelProps> = ({
  suspects,
  interrogatedSuspects,
  onInterrogate
}) => {
  return (
    <div className="p-4 rounded-lg bg-gray-800">
      <h3 className="text-xl font-bold mb-4">Suspects</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {suspects.map((suspect, index) => (
          <button
            key={index}
            onClick={() => onInterrogate(suspect)}
            className={`p-3 rounded-lg ${
              interrogatedSuspects.includes(suspect)
                ? 'bg-green-800'
                : 'bg-gray-700'
            } hover:bg-gray-600`}
          >
            {suspect}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CharacterActionPanel; 