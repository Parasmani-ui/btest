import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { HOSPITAL_CRISIS_SIMULATION_PROMPT } from '@/utils/prompts';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  console.log('Processing hospital simulation interaction');
  
  try {
    // Parse request body
    const body = await request.json();
    const { simulationHistory, userInput, isExit } = body;

    if (!simulationHistory) {
      return NextResponse.json({ error: 'Missing simulation history' }, { status: 400 });
    }

    if (!userInput && !isExit) {
      return NextResponse.json({ error: 'Missing user input' }, { status: 400 });
    }

    // Check if we're at round 10 and need to auto-complete
    let isRound10Complete = false;
    try {
      // Check the last assistant message for round number
      for (let i = simulationHistory.length - 1; i >= 0; i--) {
        if (simulationHistory[i].role === 'assistant') {
          // Try to extract round number
          const roundMatch = simulationHistory[i].content.match(/Round (\d+)\/10/);
          if (roundMatch && roundMatch[1] && parseInt(roundMatch[1]) >= 10) {
            isRound10Complete = true;
            break;
          }
          
          // Also try JSON format
          if (simulationHistory[i].content.trim().startsWith('{')) {
            try {
              const jsonData = JSON.parse(simulationHistory[i].content);
              if (jsonData.roundNumber && jsonData.roundNumber >= 10) {
                isRound10Complete = true;
                break;
              }
            } catch (e) {
              // Not valid JSON, continue checking
            }
          }
          break;
        }
      }
    } catch (e) {
      // Error parsing round, continue normally
      console.log("Error detecting round:", e);
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
    if (isExit || isRound10Complete) {
      userMessage = "exit and provide a performance evaluation";
    } else {
      // Append next round instruction to user input
      userMessage = `${userInput}`;
    }

    // Make the API call
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4.1",
        // model: "gpt-4o-mini",
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
          ...simulationHistory.map((msg: any) => ({
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
      
      // Return the response
      return NextResponse.json({ 
        responseText: responseText 
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