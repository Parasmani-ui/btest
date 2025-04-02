import { NextRequest, NextResponse } from 'next/server';
import { analyzeEvidence } from '@/utils/helpers';

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
    const evidence = data.evidence;
    
    if (!evidence || !global.gameState.evidence.includes(evidence)) {
      return NextResponse.json({ error: 'Invalid evidence' }, { status: 400 });
    }
    
    const response = await analyzeEvidence(
      evidence, 
      global.gameState.caseDetails || '', 
      global.gameState.murderer || ''
    );
    
    // Track action
    global.gameState.actions.push(`Analyzed ${evidence}`);
    
    return NextResponse.json({
      success: true,
      response,
      evidence
    });
  } catch (error) {
    console.error('Error analyzing evidence:', error);
    return NextResponse.json({ error: 'Failed to analyze evidence' }, { status: 500 });
  }
} 