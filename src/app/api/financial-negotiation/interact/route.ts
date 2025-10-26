import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { FINANCIAL_NAGOTIATION_SIMULATION_PROMPTS } from '@/utils/prompts';
import { calculateSimulationScore, formatFinalScores } from '@/utils/scoring';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  console.log('Processing Financial Investigation simulation interaction');
  
  try {
    // Parse request body
    const body = await request.json();
    const { messages, currentTurn, subGameIndex, requestHint } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Missing or invalid messages array' }, { status: 400 });
    }

    if (subGameIndex === undefined || subGameIndex < 0 || subGameIndex >= FINANCIAL_NAGOTIATION_SIMULATION_PROMPTS.length) {
      return NextResponse.json({ error: 'Invalid sub-game index' }, { status: 400 });
    }

    // Get the specific scenario configuration
    const selectedScenario = FINANCIAL_NAGOTIATION_SIMULATION_PROMPTS[subGameIndex];

    // If requesting a hint
    if (requestHint) {
      return handleHintRequest(selectedScenario, messages, currentTurn);
    }

    // Get the last user message
    const lastUserMessage = messages[messages.length - 1];
    if (!lastUserMessage || lastUserMessage.role !== 'user') {
      return NextResponse.json({ error: 'No user message found' }, { status: 400 });
    }

    const userInput = lastUserMessage.content;

    // Check if we're at turn 5 and need to auto-complete
    let isFinalTurn = false;
    if (currentTurn >= 5 || userInput.toLowerCase().includes('exit')) {
      isFinalTurn = true;
    }

    // Get API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.log('No API key found, returning error');
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Initialize OpenAI client
    const openai = new OpenAI({ 
      apiKey,
      timeout: 45000,  // 45 second timeout for API calls
      maxRetries: 2    // Allow more retries
    });
    
    // Create the system prompt based on the scenario
    const systemPrompt = `
You are a Financial Investigation Training Simulation AI. Continue this financial forensics scenario based on the following configuration:

GAME_INTENT: ${selectedScenario.GAME_INTENT}
GAME_BOUNDARIES: ${selectedScenario.GAME_BOUNDARIES}
SCENARIO_GENERATION: ${selectedScenario.SCENARIO_GENERATION}
GAME_MECHANICS: ${selectedScenario.GAME_MECHANICS}

Current turn: ${currentTurn}/5

${isFinalTurn ? `
This is the final turn. Provide a comprehensive performance evaluation that includes:

**Final Scores:**  
Data Accuracy: [score]/10  
Compliance Awareness: [score]/10  
Risk Assessment: [score]/10  
Overall Outcome: [summary outcome]

1. Assessment of the user's investigation approach and professionalism
2. Specific feedback on what they did well and areas for improvement
3. Final recommendation on the case findings

Format the evaluation clearly with the scoring section first, followed by detailed feedback.
` : `
Continue the financial investigation scenario. Respond as the relevant party (manager, colleague, system, etc.) in the investigation, then present the next situation with 4 new dialogue options (A, B, C, D) for turn ${currentTurn + 1}.

IMPORTANT: Do NOT show any scores, ratings, or performance evaluations until the final turn. Focus only on advancing the investigation story and providing realistic responses.

Make sure to:
1. Respond realistically to the user's investigation approach
2. Advance the financial investigation scenario logically  
3. Present 4 varied dialogue options for the next turn
4. Maintain appropriate professional audit/investigation tone
5. Track progress toward uncovering the financial irregularities
6. Keep the scenario dynamic and engaging with realistic character responses
7. Vary the challenges and evidence based on the user's previous choices
8. Do NOT include any scoring information or performance metrics in your response
`}

Conversation history:
${messages.map(msg => `${msg.role}: ${msg.content}`).join('\n')}
`;

    try {
      // Make the API call
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userInput,
          }
        ],
        temperature: 0.7,
        max_tokens: isFinalTurn ? 4000 : 3000,
      });

      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        throw new Error('No response generated from OpenAI');
      }

      // If it's the final turn, calculate the 3-parameter scores
      let scoreData = null;
      let formattedScores = null;
      if (isFinalTurn) {
        // Calculate scores using centralized scoring system
        const calculatedScores = calculateSimulationScore(
          'FINANCIAL_NEGOTIATION_SIMULATION',
          response,
          {
            messages: messages.length,
            turnsCompleted: currentTurn
          },
          messages
        );

        // Format the scores for display
        formattedScores = formatFinalScores(calculatedScores, 'FINANCIAL_NEGOTIATION_SIMULATION');

        scoreData = {
          parameter1: calculatedScores.parameter1,
          parameter2: calculatedScores.parameter2,
          parameter3: calculatedScores.parameter3,
          overall: calculatedScores.overall,
          summary: calculatedScores.summary,
          // Legacy compatibility
          dataAccuracy: calculatedScores.parameter1,
          complianceAwareness: calculatedScores.parameter2,
          riskAssessment: calculatedScores.parameter3
        };
      }

      console.log(`Successfully processed financial investigation turn ${currentTurn}`);
      return NextResponse.json({
        response: response,
        isComplete: isFinalTurn,
        score: scoreData,
        formattedScores: formattedScores
      });

    } catch (openaiError: any) {
      console.error('OpenAI API error:', openaiError);
      
      if (openaiError.code === 'rate_limit_exceeded') {
        return NextResponse.json({ 
          error: 'Rate limit exceeded. Please try again in a moment.' 
        }, { status: 429 });
      }
      
      if (openaiError.code === 'insufficient_quota') {
        return NextResponse.json({ 
          error: 'API quota exceeded. Please try again later.' 
        }, { status: 503 });
      }
      
      return NextResponse.json({ 
        error: `OpenAI API error: ${openaiError.message}` 
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Error processing Financial Investigation interaction:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

async function handleHintRequest(selectedScenario: any, messages: any[], currentTurn: number) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  const openai = new OpenAI({ 
    apiKey,
    timeout: 30000,
    maxRetries: 2
  });

  const hintPrompt = `
Based on this financial investigation scenario and the current conversation state, provide a helpful hint.

Current turn: ${currentTurn}/5
Conversation so far:
${messages.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Provide a concise, actionable hint that helps the user improve their investigation approach without giving away the exact answer. The hint should be 1-2 sentences and focus on investigation strategy or audit procedure.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: 'system',
          content: hintPrompt,
        },
        {
          role: 'user',
          content: "Please provide a helpful financial investigation hint for this situation.",
        }
      ],
      temperature: 0.5,
      max_tokens: 200,
    });

    const hint = completion.choices[0]?.message?.content;
    
    return NextResponse.json({ 
      hint: hint || 'Focus on asking specific questions about documentation and cross-verifying information.'
    });

  } catch (error) {
    console.error('Error generating hint:', error);
    return NextResponse.json({ 
      hint: 'Consider the audit trail and ask for supporting documentation to verify claims.'
    });
  }
}

function extractScoreFromResponse(response: string): any {
  // Simple score extraction - this could be enhanced with more sophisticated parsing
  const scoreData = {
    documentationCheck: 0,
    professionalTone: 0,
    evidenceGathering: 0,
    totalScore: 0,
    outcome: 'Acceptable' // Default outcome
  };

  // Look for numeric scores in the response
  const scoreRegex = /(\w+):\s*(\d+)/gi;
  let match;
  let scoreCount = 0;
  let totalScore = 0;

  while ((match = scoreRegex.exec(response)) !== null) {
    const dimension = match[1].toLowerCase();
    const score = parseInt(match[2]);
    
    if (score >= 1 && score <= 10) {
      scoreCount++;
      totalScore += score;
      
      // Map to scoring matrix dimensions based on financial investigation criteria
      if (dimension.includes('documentation') || dimension.includes('check')) scoreData.documentationCheck = score;
      if (dimension.includes('professional') || dimension.includes('tone')) scoreData.professionalTone = score;
      if (dimension.includes('evidence') || dimension.includes('gathering')) scoreData.evidenceGathering = score;
    }
  }

  // Calculate average score
  if (scoreCount > 0) {
    scoreData.totalScore = Math.round(totalScore / scoreCount);
  }

  // Determine outcome based on score
  if (scoreData.totalScore >= 8) scoreData.outcome = 'Excellent Investigation';
  else if (scoreData.totalScore >= 6) scoreData.outcome = 'Thorough Investigation';
  else if (scoreData.totalScore >= 4) scoreData.outcome = 'Basic Investigation';
  else scoreData.outcome = 'Insufficient Investigation';

  return scoreData;
} 