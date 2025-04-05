// Define game state type
export interface GameState {
  started: boolean;
  mode: string | null;
  caseDetails: string | null;
  suspects: string[];
  evidence: string[];
  murderer: string | null;
  actions: string[];
}

// Extend global to include gameState
declare global {
  var gameState: GameState;
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