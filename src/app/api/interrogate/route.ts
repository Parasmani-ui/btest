import { NextRequest, NextResponse } from 'next/server';
import { interrogateSuspect } from '@/utils/helpers';

// Reference to the game state (this should be shared between all API routes) 
// In a real production app we would store this in a database or session store
declare global {
  let gameState: {
    started: boolean;
    mode: string | null;
    caseDetails: string | null;
    suspects: string[];
    evidence: string[];
    murderer: string | null;
    actions: string[];
  };
}

if (!global.gameState) {
  global.gameState = {
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
    if (!global.gameState.started) {
      return NextResponse.json({ error: 'Game not started' }, { status: 400 });
    }
    
    const data = await req.json();
    const suspect = data.suspect;
    
    if (!suspect || !global.gameState.suspects.includes(suspect)) {
      return NextResponse.json({ error: 'Invalid suspect' }, { status: 400 });
    }
    
    const response = await interrogateSuspect(
      suspect, 
      global.gameState.caseDetails || '', 
      global.gameState.murderer || ''
    );
    
    // Track action
    global.gameState.actions.push(`Interrogated ${suspect}`);
    
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