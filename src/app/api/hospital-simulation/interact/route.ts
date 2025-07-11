import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { HOSPITAL_CRISIS_SIMULATION_PROMPT } from '@/utils/prompts';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  console.log('Processing hospital simulation interaction');
  
  try {
    // Parse request body
    const body = await request.json();
    const { messages, currentRound } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Missing or invalid messages array' }, { status: 400 });
    }

    // Get the last user message
    const lastUserMessage = messages[messages.length - 1];
    if (!lastUserMessage || lastUserMessage.role !== 'user') {
      return NextResponse.json({ error: 'No user message found' }, { status: 400 });
    }

    const userInput = lastUserMessage.content;

    // Check if we're at round 10 and need to auto-complete
    let isRound10Complete = false;
    if (currentRound >= 10 || userInput.toLowerCase().includes('exit')) {
      isRound10Complete = true;
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
    
    // Create the user message based on input
    let userMessage = "";
    if (isRound10Complete) {
      userMessage = "exit and provide a performance evaluation";
    } else {
      userMessage = userInput;
    }

    // Make the API call
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: 'system',
            content: HOSPITAL_CRISIS_SIMULATION_PROMPT,
          },
          {
            role: 'system',
            content: "CRITICAL INSTRUCTION: After receiving the user's decision, acknowledge their choice briefly, then advance to the next round with a completely new scenario. DO NOT repeat the current round."
          },
          {
            role: 'system',
            content: "PROGRESS REQUIREMENT: Each time a user submits a decision, increment the round number and present an entirely new scenario using the simple text format specified in your instructions."
          },
          ...messages.map((msg: any) => ({
            role: msg.role,
            content: msg.content
          })),
          {
            role: 'user',
            content: userMessage
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      });

      const responseText = completion.choices[0]?.message?.content;
      
      if (!responseText) {
        console.log('No response text in API response');
        return NextResponse.json({ 
          error: 'Failed to generate response' 
        }, { status: 500 });
      }
      
      // Return the response in the format the client expects
      return NextResponse.json({ 
        response: responseText 
      });
    } catch (apiError) {
      console.error('API Error:', apiError);
      return NextResponse.json({ 
        error: 'Error processing interaction' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Unexpected error in simulation interaction:', error);
    return NextResponse.json({ 
      error: 'Unexpected error processing interaction' 
    }, { status: 500 });
  }
} 