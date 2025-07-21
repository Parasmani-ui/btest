import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { FINANCIAL_NAGOTIATION_SIMULATION_PROMPTS } from '@/utils/prompts';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  console.log('Generating financial negotiation simulation');
  
  try {
    // Parse request body
    const body = await request.json();
    const { subGameIndex } = body;

    if (subGameIndex === undefined || subGameIndex < 0 || subGameIndex >= FINANCIAL_NAGOTIATION_SIMULATION_PROMPTS.length) {
      return NextResponse.json({ error: 'Invalid sub-game index' }, { status: 400 });
    }

    // Get the specific scenario configuration
    const selectedScenario = FINANCIAL_NAGOTIATION_SIMULATION_PROMPTS[subGameIndex];

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

    // Create the system prompt for scenario generation
    const systemPrompt = `
You are a Financial Investigation Training Simulation AI. Generate a realistic financial forensics scenario based on the following configuration:

GAME_INTENT: ${selectedScenario.GAME_INTENT}
GAME_BOUNDARIES: ${selectedScenario.GAME_BOUNDARIES}
SCENARIO_GENERATION: ${selectedScenario.SCENARIO_GENERATION}
GAME_MECHANICS: ${selectedScenario.GAME_MECHANICS}
EXAMPLE_SCENARIO: ${selectedScenario.EXAMPLE_SCENARIO || 'Use provided scenario format'}
FACILITATOR_NOTE: ${selectedScenario.FACILITATOR_NOTE}

Generate a realistic financial investigation scenario that:
1. Follows the specified difficulty level (Beginner/Intermediate/Advanced)
2. Includes suspicious financial activities or irregularities
3. Provides initial context and your role as the investigator
4. Sets up the first interaction with 4 dialogue options (A, B, C, D) if applicable
5. Creates realistic characters and situations
6. Maintains professional audit/forensic investigation tone

The scenario should be immersive, educational, and challenging while remaining realistic and professional.

Start the scenario with context setting and your role, then present the initial situation that requires investigation.
`;

    console.log('Making OpenAI API call for financial simulation generation');

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
            content: `Generate a ${selectedScenario.SCENARIO_GENERATION.includes('Beginner') ? 'Beginner' : 
                                    selectedScenario.SCENARIO_GENERATION.includes('Intermediate') ? 'Intermediate' : 
                                    'Advanced'} level financial investigation scenario.`,
          }
        ],
        temperature: 0.8,
        max_tokens: 3000,
      });

      const simulationText = completion.choices[0]?.message?.content;
      
      if (!simulationText) {
        throw new Error('No simulation text generated from OpenAI');
      }

      console.log('Successfully generated financial negotiation simulation');
      return NextResponse.json({ simulation: simulationText });

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
    console.error('Error generating financial negotiation simulation:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 