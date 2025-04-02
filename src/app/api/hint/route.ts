import { NextRequest, NextResponse } from 'next/server';
import { getDetectiveHint } from '@/utils/helpers';

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

export async function GET(req: NextRequest) {
  try {
    if (!global.gameState.started) {
      return NextResponse.json({ error: 'Game not started' }, { status: 400 });
    }
    
    const hint = await getDetectiveHint(
      global.gameState.caseDetails || '', 
      global.gameState.murderer || ''
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