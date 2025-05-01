import React from 'react';

interface EvidenceActionPanelProps {
  evidence: string[];
  analyzedEvidence: string[];
  onAnalyze: (evidence: string) => void;
}

const EvidenceActionPanel: React.FC<EvidenceActionPanelProps> = ({
  evidence,
  analyzedEvidence,
  onAnalyze
}) => {
  return (
    <div className="p-4 rounded-lg bg-gray-800">
      <h3 className="text-xl font-bold mb-4">Evidence</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {evidence.map((item, index) => (
          <button
            key={index}
            onClick={() => onAnalyze(item)}
            className={`p-3 rounded-lg ${
              analyzedEvidence.includes(item)
                ? 'bg-green-800'
                : 'bg-gray-700'
            } hover:bg-gray-600`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EvidenceActionPanel; 