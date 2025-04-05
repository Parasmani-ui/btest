import { NextResponse } from 'next/server';
import { GameState } from '@/types/gameState';

// access game state

export async function GET() {
  try {
    return NextResponse.json({
      started: (global as any).gameState.started,
      mode: (global as any).gameState.mode,
      suspects: (global as any).gameState.suspects,
      evidence: (global as any).gameState.evidence,
      actions: (global as any).gameState.actions
    });
  } catch (error) {
    console.error('Error getting game state:', error);
    return NextResponse.json({ error: 'Failed to get game state' }, { status: 500 });
  }
} 