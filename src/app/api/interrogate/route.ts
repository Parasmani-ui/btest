import { NextRequest, NextResponse } from 'next/server';
import { interrogateSuspect } from '@/utils/helpers';

// Reference to the game state (this should be shared between all API routes) 
// In a real production app we would store this in a database or session store

interface GameStateData {
  started: boolean;
  mode: string | null;
  caseDetails: string | null;
  suspects: string[];
  evidence: string[];
  murderer: string | null;
  actions: string[];
}

if (!(global as unknown as {gameState?: GameStateData}).gameState) {
  (global as unknown as {gameState: GameStateData}).gameState = {
    started: false,
    mode: null,
    caseDetails: null,
    suspects: [],
    evidence: [],
    murderer: null,
    actions: []
  };
}

export async function POST(req: NextRequest) {
  try {
    const gameState = (global as unknown as {gameState: GameStateData}).gameState;
    
    if (!gameState.started) {
      return NextResponse.json({ error: 'Game not started' }, { status: 400 });
    }
    
    const data = await req.json();
    const suspect = data.suspect;
    
    if (!suspect || !gameState.suspects.includes(suspect)) {
      return NextResponse.json({ error: 'Invalid suspect' }, { status: 400 });
    }
    
    const response = await interrogateSuspect(
      suspect, 
      gameState.caseDetails || '', 
      gameState.murderer || ''
    );
    
    // Track action
    gameState.actions.push(`Interrogated ${suspect}`);
    
    return NextResponse.json({
      success: true,
      response,
      suspect
    });
  } catch (error) {
    console.error('Error during interrogation:', error);
    return NextResponse.json({ error: 'Failed to interrogate suspect' }, { status: 500 });
  }
} 