import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { POWERPLANT_CRISIS_SIMULATION_PROMPT } from '@/utils/prompts';

export const maxDuration = 60; // Maximum allowed duration for Vercel hobby plan

export async function POST(request: NextRequest) {
  console.log('Generating new Power Crisis simulation');
  
  try {
    // Try to use OpenAI API if configured in environment
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.log('No API key found, returning error');
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    try {
      console.log('Attempting to generate power crisis simulation with OpenAI API');
      // Initialize OpenAI client with timeout settings
      const openai = new OpenAI({ 
        apiKey,
        timeout: 45000,  // 45 second timeout for API calls
        maxRetries: 2    // Allow more retries
      });
      
      // Use the imported POWERPLANT_CRISIS_SIMULATION_PROMPT
      const powerCrisisPrompt = POWERPLANT_CRISIS_SIMULATION_PROMPT;

      try {
        // Make the API call with text response formatting
        const completion = await openai.chat.completions.create({
          // model: "gpt-4o-mini",
          model: "gpt-4.1",
          messages: [
            {
              role: 'system',
              content: powerCrisisPrompt,
            },
            {
              role: 'user',
              content: "Start a new power plant crisis management simulation. Select a random role for the participant from the available options. Begin with Round 1 and present an initial power plant crisis scenario using the simple text format described in your instructions.",
            }
          ],
          temperature: 0.8, // Higher temperature for more variety
          max_tokens: 4000, // Appropriate for initial scenario
        });

        const simulationText = completion.choices[0]?.message?.content;
        
        if (!simulationText) {
          console.log('No simulation text in API response');
          return NextResponse.json({ 
            error: 'Failed to generate simulation' 
          }, { status: 500 });
        }
        
        // Return the simulation text
        return NextResponse.json({ 
          simulationText: simulationText 
        });
      } catch (apiError) {
        console.error('API Error:', apiError);
        return NextResponse.json({ 
          error: 'Error generating simulation' 
        }, { status: 500 });
      }
    } catch (openaiError) {
      console.error('OpenAI API Error:', openaiError);
      return NextResponse.json({ 
        error: 'OpenAI API error' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Unexpected error generating simulation:', error);
    return NextResponse.json({ 
      error: 'Unexpected error generating simulation' 
    }, { status: 500 });
  }
}

