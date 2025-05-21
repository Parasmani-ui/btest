import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { HOSPITAL_CRISIS_SIMULATION_PROMPT } from '@/utils/prompts';

export const maxDuration = 60; // Maximum allowed duration for Vercel hobby plan

export async function POST(request: NextRequest) {
  console.log('Generating new Hospital Crisis simulation');
  
  try {
    // Try to use OpenAI API if configured in environment
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.log('No API key found, returning error');
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    try {
      console.log('Attempting to generate hospital crisis simulation with OpenAI API');
      // Initialize OpenAI client with timeout settings
      const openai = new OpenAI({ 
        apiKey,
        timeout: 45000,  // 45 second timeout for API calls
        maxRetries: 2    // Allow more retries
      });
      
      // Use the imported HOSPITAL_CRISIS_SIMULATION_PROMPT
      const hospitalPrompt = HOSPITAL_CRISIS_SIMULATION_PROMPT;

      try {
        // Make the API call with JSON response formatting
        const completion = await openai.chat.completions.create({
          // model: "gpt-4o-mini",
          model: "gpt-4.1",
          messages: [
            {
              role: 'system',
              content: hospitalPrompt,
            },
            {
              role: 'user',
              content: "Start a new hospital crisis management simulation. Select a random role for the participant from the available options. Begin with Round 1 and present an initial hospital crisis scenario. Format the response as JSON exactly as described in the OUTPUT_STRUCTURE section of your instructions.",
            }
          ],
          temperature: 0.8, // Higher temperature for more variety
          max_tokens: 4000, // Appropriate for initial scenario
          response_format: { type: "json_object" }, // Request JSON format
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