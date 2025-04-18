import { NextResponse } from 'next/server';
import { getDetectiveHint } from '@/utils/helpers';
import { GameState } from '@/types/gameState';

// access game state

export async function GET() {
  try {
    if (!(global as any).gameState.started) {
      return NextResponse.json({ error: 'Game not started' }, { status: 400 });
    }
    
    const hint = await getDetectiveHint(
      (global as any).gameState.caseDetails || '', 
      (global as any).gameState.murderer || ''
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