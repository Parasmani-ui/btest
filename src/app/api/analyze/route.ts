import { NextRequest, NextResponse } from 'next/server';
import { analyzeEvidence } from '@/utils/helpers';
import { Config } from '@/config/config';

// Access game state

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const evidence = data.evidence;
    
    if (!evidence) {
      return NextResponse.json({ error: 'No evidence provided' }, { status: 400 });
    }
    
    let response;
    
    // Use mock data if API key is not configured
    if (!Config.OPENAI_API_KEY || Config.OPENAI_API_KEY === 'your_openai_api_key_here') {
      response = `Analysis of ${evidence}:\n\nThis piece of evidence provides important insights into the case.`;
    } else {
      // Use actual OpenAI API
      response = await analyzeEvidence(
        evidence,
        (global as {gameState?: {caseDetails: string}}).gameState?.caseDetails || '',
        (global as {gameState?: {murderer: string}}).gameState?.murderer || ''
      );
    }
    
    // Track action
    if ((global as {gameState?: {actions: string[]}}).gameState) {
      (global as {gameState?: {actions: string[]}}).gameState.actions.push(`Analyzed evidence: ${evidence}`);
    }
    
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