import { NextResponse } from 'next/server';

// access game state
interface GameStateData {
  started: boolean;
  mode: string | null;
  suspects: string[];
  evidence: string[];
  actions: string[];
}

export async function GET() {
  try {
    // First cast to unknown, then to the specific type
    const gameState = (global as unknown as { gameState: GameStateData }).gameState;
    
    return NextResponse.json({
      started: gameState.started,
      mode: gameState.mode,
      suspects: gameState.suspects,
      evidence: gameState.evidence,
      actions: gameState.actions
    });
  } catch (error) {
    console.error('Error getting game state:', error);
    return NextResponse.json({ error: 'Failed to get game state' }, { status: 500 });
  }
} 