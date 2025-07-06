import { NextRequest, NextResponse } from 'next/server';
import { CRITICAL_THINKING_SIMULATION_PROMPT } from '@/utils/prompts';

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === 'start_simulation') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // model: 'gpt-4o-mini',
          model: 'gpt-4.1',
          messages: [
            {
              role: 'system',
              content: CRITICAL_THINKING_SIMULATION_PROMPT
            },
            {
              role: 'user',
              content: 'Let\'s Start'
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate simulation');
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Extract the opening statement from the AI response
      const openingStatement = content;
      
      return NextResponse.json({
        caseTitle: 'Maggi Crisis 2015',
        scenario: 'Food Safety Regulatory Challenge',
        openingStatement: openingStatement,
        success: true
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in food safety simulation generate:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 