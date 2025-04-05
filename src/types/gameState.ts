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
  namespace NodeJS {
    interface Global {
      gameState: GameState;
    }
  }
} 