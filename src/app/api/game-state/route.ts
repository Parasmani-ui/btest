import { NextRequest, NextResponse } from 'next/server';

// access game state
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

export async function GET(req: NextRequest) {
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