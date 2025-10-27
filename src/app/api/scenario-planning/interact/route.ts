import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { SCENARIO_PLANNING_SIMULATIONS } from '@/utils/prompts';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { navigatorId, messages, userMessage, isExiting } = await request.json();

    if (navigatorId < 0 || navigatorId >= SCENARIO_PLANNING_SIMULATIONS.length) {
      return NextResponse.json(
        { error: 'Invalid navigator ID' },
        { status: 400 }
      );
    }

    const navigator = SCENARIO_PLANNING_SIMULATIONS[navigatorId];

    // Build the system prompt
    const systemPrompt = `You are a scenario planning consultant with the following role and task:

${navigator.ROLE}

TASK:
${navigator.TASK}

BOUNDARIES:
${navigator.BOUNDARIES}

RULES:
${navigator.RULES}

You must follow these rules strictly:
- Ask only ONE question at a time
- Never answer questions directly - only ask probing questions
- If user asks for advice, respond: "It may be better if I do the asking and you do the answering :)"
- Maintain a curious, personal, and gently probing tone
- Adapt your questions based on the user's responses
- Provide hints only when necessary, keeping them subtle
- NEVER suggest ending the conversation or summarize unless the user explicitly says "exit", "quit", "end", or "done"
- Keep the conversation going with follow-up questions - this is a collaborative exploration, not a rapid Q&A
- If a user's response is short, dig deeper with follow-up questions

CONVERSATION HISTORY: The user has been discussing: ${JSON.stringify(messages.slice(-3).map((m: any) => m.role === 'user' ? m.content : ''))}

${isExiting ? `
The user is ending the session. Provide a summary of:
${navigator.FACILITATOR_NOTE}

Format your response as a clear, structured summary that the user can use for their scenario planning work.
` : ''}

Generate your response now. Remember: ${isExiting ? 'Provide a structured summary of insights gathered during the session.' : 'Ask ONE clear, probing question that builds on the conversation.'}`;

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content
        }))
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content || 'I apologize, but I encountered an issue. Please try again.';

    // Check if conversation should end
    // ONLY end if:
    // 1. User explicitly typed "exit", "quit", or "end" as the ONLY message
    // 2. We're in the exit flow (isExiting flag is set)
    const userMessageLower = userMessage?.toLowerCase().trim() || '';
    const explicitExitKeywords = ['exit', 'quit', 'end'];
    const isExplicitExit = isExiting || explicitExitKeywords.some(keyword => 
      userMessageLower === keyword || userMessageLower.startsWith(keyword + ' ') || userMessageLower.endsWith(' ' + keyword)
    );

    // Check message count to prevent premature ending
    const messageCount = messages.filter((m: any) => m.role === 'user').length;
    const minMessagesBeforeExit = 5; // Require at least 5 exchanges before allowing natural conclusion

    // Only complete if:
    // - User explicitly requested exit, OR
    // - We have enough messages AND user's message suggests they're done (contains "done", "finished", "complete", "ready to summarize")
    const shouldComplete = isExplicitExit || (
      messageCount >= minMessagesBeforeExit && 
      (
        userMessageLower.includes('done with this') ||
        userMessageLower.includes('ready to') ||
        userMessageLower.includes('i think we') ||
        userMessageLower.includes('that covers') ||
        userMessageLower.includes('summarize')
      )
    );

    return NextResponse.json({
      response,
      isComplete: shouldComplete,
    });

  } catch (error: any) {
    console.error('Error in scenario planning interaction:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}
