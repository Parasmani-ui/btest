import { NextRequest, NextResponse } from 'next/server';

// Access the game state here
declare global {
  var gameState: {
    started: boolean;
    mode: string | null;
    caseDetails: string | null;
    suspects: string[];
    evidence: string[];
    murderer: string | null;
    actions: string[];
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
    
    const correct = suspect === global.gameState.murderer;
    
    // Reset game
    global.gameState.started = false;
    
    return NextResponse.json({
      success: true,
      correct,
      murderer: global.gameState.murderer
    });
  } catch (error) {
    console.error('Error making arrest:', error);
    return NextResponse.json({ error: 'Failed to make arrest' }, { status: 500 });
  }
} 