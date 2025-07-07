// Define game state type
export interface GameState {
  started: boolean;
  mode: string | null;
  caseDetails: string;
  suspects: string[];
  evidence: string[];
  interrogatedSuspects: string[];
  analyzedEvidence: string[];
  currentAction: string | null;
  currentResponse: string;
  hints: string[];
  currentHint: number;
  currentSuspect: string | null;
  gameOver?: boolean;
  correctSuspect?: string;
  correctSuspectIdentified?: boolean;
  explanation?: string;
  finalElapsedTime?: string;
  arrestResult?: {
    correct: boolean;
    murderer: string;
    suspectArrested: string;
    reasoning?: string;
  };
}

// Extend global to include gameState
declare global {
  const gameState: GameState;
}

// This initialization should be in a single place like _app.ts or a specific init file
// if (typeof global !== 'undefined' && !global.gameState) {
//   global.gameState = {
//     started: false,
//     mode: null,
//     caseDetails: null,
//     suspects: [],
//     evidence: [],
//     murderer: null,
//     actions: []
//   };
// } 