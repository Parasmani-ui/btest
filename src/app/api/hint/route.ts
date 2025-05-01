import { NextResponse } from 'next/server';
import { getDetectiveHint } from '@/utils/helpers';

// access game state
interface GameStateData {
  started: boolean;
  caseDetails: string;
  murderer: string;
}

export async function GET() {
  try {
    const gameState = (global as unknown as { gameState: GameStateData }).gameState;
    
    if (!gameState.started) {
      return NextResponse.json({ error: 'Game not started' }, { status: 400 });
    }
    
    const hint = await getDetectiveHint(
      gameState.caseDetails || '', 
      gameState.murderer || ''
    );
    
    return NextResponse.json({
      success: true,
      hint
    });
  } catch (error) {
    console.error('Error getting hint:', error);
    return NextResponse.json({ error: 'Failed to get hint' }, { status: 500 });
  }
} 