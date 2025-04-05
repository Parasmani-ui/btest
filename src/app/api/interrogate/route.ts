import { NextRequest, NextResponse } from 'next/server';
import { interrogateSuspect } from '@/utils/helpers';
import { GameState } from '@/types/gameState';

// Reference to the game state (this should be shared between all API routes) 
// In a real production app we would store this in a database or session store

if (!(global as any).gameState) {
  (global as any).gameState = {
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
    if (!(global as any).gameState.started) {
      return NextResponse.json({ error: 'Game not started' }, { status: 400 });
    }
    
    const data = await req.json();
    const suspect = data.suspect;
    
    if (!suspect || !(global as any).gameState.suspects.includes(suspect)) {
      return NextResponse.json({ error: 'Invalid suspect' }, { status: 400 });
    }
    
    const response = await interrogateSuspect(
      suspect, 
      (global as any).gameState.caseDetails || '', 
      (global as any).gameState.murderer || ''
    );
    
    // Track action
    (global as any).gameState.actions.push(`Interrogated ${suspect}`);
    
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