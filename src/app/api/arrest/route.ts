import { NextRequest, NextResponse } from 'next/server';

// Access game state

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const suspectName = data.suspectName;
    const gameState = data.gameState;
    
    if (!suspectName || !gameState || !gameState.suspects.includes(suspectName)) {
      return NextResponse.json({ error: 'Invalid suspect or game state' }, { status: 400 });
    }
    
    // In a real app, this would check if the suspect is the murderer
    // For this demo, randomly decide if the suspect is guilty
    const correctSuspect = gameState.suspects[Math.floor(Math.random() * gameState.suspects.length)];
    const correct = suspectName === correctSuspect;
    
    // Generate a reasoning for why this suspect was the murderer
    const reasoning = `${correctSuspect} had both motive and opportunity. The evidence shows they were present at the crime scene at the time of the murder, and their fingerprints were found on the murder weapon. Their alibi didn't check out when cross-referenced with witness testimonies.`;
    
    return NextResponse.json({
      success: true,
      correctSuspect: correctSuspect,
      correctSuspectIdentified: correct,
      reasoning: reasoning,
      explanation: correct 
        ? `Well done! ${suspectName} was indeed the murderer. Your detective skills are impressive.`
        : `Unfortunately, ${suspectName} was not the murderer. The real murderer was ${correctSuspect}. Better luck next time.`
    });
  } catch (error) {
    console.error('Error making arrest:', error);
    return NextResponse.json({ error: 'Failed to make arrest' }, { status: 500 });
  }
} 