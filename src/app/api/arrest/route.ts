import { NextRequest, NextResponse } from 'next/server';
import { GameState } from '@/types/gameState';

// Access game state

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
    
    const correct = suspect === (global as any).gameState.murderer;
    
    // Reset game
    (global as any).gameState.started = false;
    
    return NextResponse.json({
      success: true,
      correct,
      murderer: (global as any).gameState.murderer
    });
  } catch (error) {
    console.error('Error making arrest:', error);
    return NextResponse.json({ error: 'Failed to make arrest' }, { status: 500 });
  }
} 