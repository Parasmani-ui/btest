import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { NEGOTIATION_SIMULATION_PROMPTS } from '@/utils/prompts';

export const maxDuration = 60; // Maximum allowed duration for Vercel hobby plan

export async function POST(request: NextRequest) {
  console.log('Generating new Negotiation simulation');
  
  try {
    // Parse request body to get the sub-game index
    const body = await request.json();
    const { subGameIndex } = body;

    if (subGameIndex === undefined || subGameIndex < 0 || subGameIndex >= NEGOTIATION_SIMULATION_PROMPTS.length) {
      return NextResponse.json({ error: 'Invalid sub-game index' }, { status: 400 });
    }

    // Try to use OpenAI API if configured in environment
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.log('No API key found, returning error');
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    try {
      console.log(`Attempting to generate negotiation simulation for sub-game ${subGameIndex} with OpenAI API`);
      // Initialize OpenAI client with timeout settings
      const openai = new OpenAI({ 
        apiKey,
        timeout: 45000,  // 45 second timeout for API calls
        maxRetries: 2    // Allow more retries
      });
      
      // Get the specific negotiation prompt for the selected sub-game
      const selectedScenario = NEGOTIATION_SIMULATION_PROMPTS[subGameIndex];
      
      // Create a comprehensive prompt that includes all the scenario details
      const negotiationPrompt = `
You are a Negotiation Training Simulation AI. Create a COMPLETELY FRESH and UNIQUE negotiation scenario each time based on the following requirements:

GAME_INTENT: ${selectedScenario.GAME_INTENT}

GAME_BOUNDARIES: ${selectedScenario.GAME_BOUNDARIES}

SCENARIO_GENERATION: ${selectedScenario.SCENARIO_GENERATION}

GAME_MECHANICS: ${selectedScenario.GAME_MECHANICS}

EXAMPLE_SCENARIO: ${selectedScenario.EXAMPLE_SCENARIO}

HINT_LOGIC: ${selectedScenario.HINT_LOGIC}

FACILITATOR_NOTE: ${selectedScenario.FACILITATOR_NOTE}

CRITICAL: Generate a completely NEW scenario each time with:
- Different company/organization names
- Different character names and personalities  
- Different specific details (salary amounts, project names, product details, etc.)
- Different contexts and settings
- Fresh dialogue and situations
- Varied stakes and complications

Start with the initial scenario setup and present 4 dialogue options (A, B, C, D) for the user to choose from. Format your response clearly with the scenario description followed by choice options.

Make sure to:
1. Set a completely unique context and stakes each time
2. Present realistic dialogue options with different approaches
3. Keep track that this is Turn 1 of 5
4. Make the scenario challenging but achievable
5. Include realistic personalities and motivations for the other party
6. Vary all specific details like names, amounts, timelines, etc.
`;

      try {
        // Make the API call with text response formatting
        const completion = await openai.chat.completions.create({
          // model: "gpt-4o-mini",
          model: "gpt-4.1",
          messages: [
            {
              role: 'system',
              content: negotiationPrompt,
            },
            {
              role: 'user',
              content: `Generate a COMPLETELY NEW and UNIQUE negotiation simulation scenario (Session ID: ${Date.now()}). DO NOT use the exact details from the example scenario. Instead:

1. Create different company/organization names (avoid repeating any previous names)
2. Use different character names and personalities  
3. Vary specific details like salary amounts, project timelines, vendor relationships, etc.
4. Create fresh dialogue and situations while maintaining the same negotiation principles
5. Generate unique contexts and settings each time
6. Use current market conditions and realistic contemporary details

Present the situation clearly and provide 4 dialogue options (A, B, C, D) for the participant to choose from. Make this scenario completely different from any previous scenarios while following the same learning objectives.

IMPORTANT: Each scenario should feel like a real-world situation with authentic details, realistic stakes, and genuine negotiation challenges.`,
            }
          ],
          temperature: 0.9, // Higher temperature for maximum variety
          max_tokens: 3000, // Appropriate for initial scenario
        });

        const simulationText = completion.choices[0]?.message?.content;
        
        if (!simulationText) {
          throw new Error('No content generated from OpenAI');
        }

        console.log('Successfully generated negotiation simulation scenario');
        return NextResponse.json({ 
          scenario: simulationText,
          subGameIndex: subGameIndex
        });

      } catch (openaiError: any) {
        console.error('OpenAI API error:', openaiError);
        
        // Provide more specific error messages
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
      console.error('Error in OpenAI processing:', error);
      return NextResponse.json({ 
        error: 'Failed to process negotiation simulation request' 
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Error generating negotiation simulation:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 