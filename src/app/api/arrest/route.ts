import { NextRequest, NextResponse } from 'next/server';
import { calculateSimulationScore, formatFinalScores } from '@/utils/scoring';

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

    // Calculate 3-parameter scores for detective simulation using the centralized scoring system
    const evidenceCount = gameState.analyzedEvidence?.length || 0;
    const suspectCount = gameState.interrogatedSuspects?.length || 0;
    const hintsUsed = gameState.currentHint || 0;

    // Build content for score calculation
    const performanceContent = `
Investigation Report:
- Arrested: ${suspectName}
- Correct suspect: ${correctSuspect}
- Result: ${correct ? 'Correct arrest' : 'Incorrect arrest'}
- Evidence analyzed: ${evidenceCount} pieces
- Suspects interrogated: ${suspectCount} suspects
- Hints used: ${hintsUsed}

Performance Assessment:
Critical Thinking: ${correct ? 'Excellent logical deduction' : 'Needs improvement in connecting evidence'}
Evidence Analysis: ${evidenceCount >= 3 ? 'Thorough investigation' : 'Limited evidence gathering'}
Intuition: ${correct ? 'Strong intuitive abilities' : 'Needs to develop better instincts'}
    `.trim();

    // Calculate scores using the centralized scoring system
    const calculatedScores = calculateSimulationScore(
      'DETECTIVE_SIMULATION',
      performanceContent,
      {
        correct,
        evidenceCount,
        suspectCount,
        hintsUsed
      }
    );

    // Format the scores for display
    const formattedScores = formatFinalScores(calculatedScores, 'DETECTIVE_SIMULATION');

    return NextResponse.json({
      success: true,
      correctSuspect: correctSuspect,
      correctSuspectIdentified: correct,
      reasoning: `${reasoning}\n\n${formattedScores}`,
      explanation: correct
        ? `Well done! ${suspectName} was indeed the murderer. Your detective skills are impressive.`
        : `Unfortunately, ${suspectName} was not the murderer. The real murderer was ${correctSuspect}. Better luck next time.`,
      scores: {
        parameter1: calculatedScores.parameter1,
        parameter2: calculatedScores.parameter2,
        parameter3: calculatedScores.parameter3,
        overall: calculatedScores.overall,
        summary: calculatedScores.summary,
        // Legacy format for backward compatibility
        criticalThinking: calculatedScores.parameter1,
        evidenceAnalysis: calculatedScores.parameter2,
        intuition: calculatedScores.parameter3
      },
      formattedScores: formattedScores
    });
  } catch (error) {
    console.error('Error making arrest:', error);
    return NextResponse.json({ error: 'Failed to make arrest' }, { status: 500 });
  }
} 