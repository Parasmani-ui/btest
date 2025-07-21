import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { NEGOTIATION_SIMULATION_PROMPTS } from '@/utils/prompts';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  console.log('Processing negotiation simulation interaction');
  
  try {
    // Parse request body
    const body = await request.json();
    const { messages, currentTurn, subGameIndex, requestHint } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Missing or invalid messages array' }, { status: 400 });
    }

    if (subGameIndex === undefined || subGameIndex < 0 || subGameIndex >= NEGOTIATION_SIMULATION_PROMPTS.length) {
      return NextResponse.json({ error: 'Invalid sub-game index' }, { status: 400 });
    }

    // Get the specific scenario configuration
    const selectedScenario = NEGOTIATION_SIMULATION_PROMPTS[subGameIndex];

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
You are a Negotiation Training Simulation AI. Continue this negotiation scenario based on the following configuration:

GAME_INTENT: ${selectedScenario.GAME_INTENT}
GAME_BOUNDARIES: ${selectedScenario.GAME_BOUNDARIES}
SCENARIO_GENERATION: ${selectedScenario.SCENARIO_GENERATION}
GAME_MECHANICS: ${selectedScenario.GAME_MECHANICS}
SCORING_MATRIX: ${JSON.stringify(selectedScenario.SCORING_MATRIX)}

Current turn: ${currentTurn}/5

${isFinalTurn ? `
This is the final turn. Provide a comprehensive performance evaluation that includes:
1. Assessment of the user's negotiation approach
2. Scores for each dimension in the scoring matrix (out of 10)
3. Overall outcome classification
4. Specific feedback on what they did well and areas for improvement
5. Final recommendation or negotiation result

Format the evaluation clearly with sections and scores.
` : `
Continue the negotiation scenario. Respond as the other party in the negotiation, then present the next situation with 4 new dialogue options (A, B, C, D) for turn ${currentTurn + 1}.

IMPORTANT: Do NOT show any scores, ratings, or performance evaluations until the final turn. Focus only on advancing the negotiation story and providing realistic character responses.

Make sure to:
1. Respond realistically to the user's choice
2. Advance the negotiation scenario logically  
3. Present 4 varied dialogue options for the next turn
4. Maintain appropriate tension and stakes
5. Track progress toward the negotiation goals
6. Keep the scenario dynamic and engaging with realistic character responses
7. Vary the challenges and pushback based on the user's previous choices
8. Do NOT include any scoring information or performance metrics in your response
`}

Conversation history:
${messages.map(msg => `${msg.role}: ${msg.content}`).join('\n')}
`;

    try {
      // Make the API call
      const completion = await openai.chat.completions.create({
        // model: "gpt-4o-mini",
        model: "gpt-4.1",

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

      // If it's the final turn, try to extract scoring information
      let scoreData = null;
      if (isFinalTurn) {
        scoreData = extractScoreFromResponse(response, selectedScenario.SCORING_MATRIX);
      }

      console.log(`Successfully processed negotiation turn ${currentTurn}`);
      return NextResponse.json({ 
        response: response,
        isComplete: isFinalTurn,
        score: scoreData
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
    console.error('Error processing negotiation interaction:', error);
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
Based on this negotiation scenario and the current conversation state, provide a helpful hint following these guidelines:

HINT_LOGIC: ${selectedScenario.HINT_LOGIC}

Current turn: ${currentTurn}/5
Conversation so far:
${messages.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Provide a concise, actionable hint that helps the user improve their negotiation approach without giving away the exact answer. The hint should be 1-2 sentences and focus on strategy or approach.
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
          content: "Please provide a helpful negotiation hint for this situation.",
        }
      ],
      temperature: 0.5,
      max_tokens: 200,
    });

    const hint = completion.choices[0]?.message?.content;
    
    return NextResponse.json({ 
      hint: hint || 'Focus on finding common ground and presenting data-driven arguments.'
    });

  } catch (error) {
    console.error('Error generating hint:', error);
    return NextResponse.json({ 
      hint: 'Consider the other party\'s perspective and look for win-win solutions.'
    });
  }
}

function extractScoreFromResponse(response: string, scoringMatrix: any): any {
  // Simple score extraction - this could be enhanced with more sophisticated parsing
  const scoreData = {
    ...scoringMatrix,
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
      
      // Map to scoring matrix dimensions
      if (dimension.includes('assert')) scoreData.assertiveness = score;
      if (dimension.includes('data') || dimension.includes('research')) scoreData.dataDriven = score;
      if (dimension.includes('empathy') || dimension.includes('relationship')) scoreData.empathy = score;
      if (dimension.includes('credibility') || dimension.includes('technical')) scoreData.credibility = score;
      if (dimension.includes('diplomacy') || dimension.includes('communication')) scoreData.diplomacy = score;
      if (dimension.includes('realism') || dimension.includes('feasibility')) scoreData.realism = score;
      if (dimension.includes('creativity') || dimension.includes('innovation')) scoreData.creativity = score;
      if (dimension.includes('firmness') || dimension.includes('resolve')) scoreData.firmness = score;
      if (dimension.includes('alignment') || dimension.includes('collaboration')) scoreData.alignment = score;
      if (dimension.includes('flexibility') || dimension.includes('adaptation')) scoreData.flexibility = score;
      if (dimension.includes('transparency') || dimension.includes('honesty')) scoreData.transparency = score;
      if (dimension.includes('risk')) scoreData.riskManagement = score;
    }
  }

  // Calculate average score
  if (scoreCount > 0) {
    scoreData.totalScore = Math.round(totalScore / scoreCount);
  }

  // Determine outcome based on score
  if (scoreData.totalScore >= 8) scoreData.outcome = 'Win-Win';
  else if (scoreData.totalScore >= 6) scoreData.outcome = 'Acceptable';
  else if (scoreData.totalScore >= 4) scoreData.outcome = 'Stalemate';
  else scoreData.outcome = 'Loss';

  return scoreData;
} 