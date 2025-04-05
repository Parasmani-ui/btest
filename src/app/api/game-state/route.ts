import { NextResponse } from 'next/server';
import { GameState } from '@/types/gameState';

// access game state

export async function GET() {
  try {
    return NextResponse.json({
      started: global.gameState.started,
      mode: global.gameState.mode,
      suspects: global.gameState.suspects,
      evidence: global.gameState.evidence,
      actions: global.gameState.actions
    });
  } catch (error) {
    console.error('Error getting game state:', error);
    return NextResponse.json({ error: 'Failed to get game state' }, { status: 500 });
  }
} 